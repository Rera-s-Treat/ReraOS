import { randomBytes } from 'crypto';
import { extname } from 'path';

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

let client: S3Client | null = null;

function getClient(): S3Client {
  if (client) return client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 storage is not configured (missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)',
    );
  }

  client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  return client;
}

function buildKey(folder: string, originalName: string): string {
  const uniqueName = `${Date.now()}-${randomBytes(6).toString('hex')}${extname(originalName)}`;
  return `${folder}/${uniqueName}`;
}

/**
 * Uploads a file buffer to the R2 bucket and returns its permanent public
 * URL. Unlike Render's local disk, this survives every redeploy.
 */
export async function uploadToR2(
  folder: string,
  file: { buffer: Buffer; originalname: string; mimetype: string },
): Promise<string> {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucket || !publicUrl) {
    throw new Error('R2 storage is not configured (missing R2_BUCKET_NAME / R2_PUBLIC_URL)');
  }

  const key = buildKey(folder, file.originalname);

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return `${publicUrl.replace(/\/$/, '')}/${key}`;
}

/** Best-effort delete - failures are swallowed since a missing/stale object
 * shouldn't block whatever database change triggered the cleanup. */
export async function deleteFromR2(publicUrl: string): Promise<void> {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.R2_PUBLIC_URL;
  if (!bucket || !publicUrlBase || !publicUrl.startsWith(publicUrlBase)) return;

  const key = publicUrl.slice(publicUrlBase.replace(/\/$/, '').length + 1);
  if (!key) return;

  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch {
    // Non-fatal - orphaned objects in R2 cost nothing worth chasing here.
  }
}
