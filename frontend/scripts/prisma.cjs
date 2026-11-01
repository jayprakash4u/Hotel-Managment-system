// Use the same environment files as Next.js, including .env.local.
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadEnvConfig } = require('@next/env');

const projectDir = path.resolve(__dirname, '..');
loadEnvConfig(projectDir, process.env.NODE_ENV !== 'production');

if (!process.env.DATABASE_URL) {
  console.error('Add DATABASE_URL to frontend/.env.local (see .env.example).');
  process.exit(1);
}

const result = spawnSync(process.execPath, [require.resolve('prisma'), ...process.argv.slice(2)], {
  cwd: projectDir,
  env: process.env,
  stdio: 'inherit',
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
