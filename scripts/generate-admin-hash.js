#!/usr/bin/env node
/**
 * Generate a bcrypt hash for ADMIN_PASSWORD_HASH env var.
 *
 * Usage:
 *   node scripts/generate-admin-hash.js
 *   node scripts/generate-admin-hash.js "MySecurePassword123"
 *
 * Then copy the output into .env.local and Vercel env vars as ADMIN_PASSWORD_HASH.
 * Remove ADMIN_PASSWORD afterwards.
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');

async function main() {
  let password = process.argv[2];

  if (!password) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    password = await new Promise((resolve) => {
      rl.question('Enter password to hash: ', (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  if (!password || password.length < 8) {
    console.error('❌ Password must be at least 8 characters.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);

  console.log('\n✅ Bcrypt hash generated:\n');
  console.log(hash);
  console.log('\nAdd this to .env.local AND Vercel env vars:\n');
  console.log(`ADMIN_PASSWORD_HASH='${hash}'`);
  console.log('\nThen REMOVE the old ADMIN_PASSWORD variable.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
