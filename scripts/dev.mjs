import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWin = process.platform === 'win32';
const shell = isWin ? 'cmd.exe' : '/bin/sh';

const commands = [
  { name: 'api',       dir: path.join(rootDir, 'apps/api') },
  { name: 'admin-web', dir: path.join(rootDir, 'apps/admin-web') },
];

for (const { name, dir } of commands) {
  const shellArgs = isWin
    ? ['/d', '/s', '/c', 'pnpm', '--dir', dir, 'run', 'dev']
    : ['-c', `pnpm --dir '${dir}' run dev`];

  const child = spawn(shell, shellArgs, {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env,
    windowsHide: false,
  });

  child.on('exit', (code, signal) => {
    if (code !== 0) {
      console.error(`${name} exited with ${code ?? signal ?? 'unknown'}`);
      process.exit(code ?? 1);
    }
  });

  child.on('error', (error) => {
    console.error(error);
    process.exit(1);
  });
}