import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const targets = [
  { name: 'api', dir: path.join(rootDir, 'apps/api'), activeFile: '.env' },
  {
    name: 'admin-web',
    dir: path.join(rootDir, 'apps/admin-web'),
    activeFile: '.env.local',
  },
];

const mode = process.argv[2];

if (!['staging', 'development'].includes(mode)) {
  console.error('Usage: node scripts/use-env.mjs <staging|development>');
  process.exit(1);
}

for (const { name, dir, activeFile } of targets) {
  const activePath = path.join(dir, activeFile);
  const backupPath = path.join(dir, `${activeFile}.development.bak`);
  const stagingSourcePath = path.join(dir, '.env.staging');

  if (mode === 'staging') {
    if (!fs.existsSync(stagingSourcePath)) {
      console.warn(`[${name}] No .env.staging found, skipping.`);
      continue;
    }

    if (fs.existsSync(activePath) && !fs.existsSync(backupPath)) {
      fs.copyFileSync(activePath, backupPath);
      console.log(
        `[${name}] Backed up ${activeFile} -> ${path.basename(backupPath)}`,
      );
    }

    fs.copyFileSync(stagingSourcePath, activePath);
    console.log(`[${name}] Switched ${activeFile} to staging config.`);
  } else {
    if (!fs.existsSync(backupPath)) {
      console.warn(
        `[${name}] No development backup found (${path.basename(backupPath)}), leaving ${activeFile} as-is.`,
      );
      continue;
    }

    fs.copyFileSync(backupPath, activePath);
    console.log(`[${name}] Restored ${activeFile} from development backup.`);
  }
}

console.log('\nDone. Restart your dev servers for the change to take effect.');
