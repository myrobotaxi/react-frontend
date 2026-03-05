import { test as setup } from '@playwright/test';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';

import { createAuthStorageState } from './helpers/auth-helpers';

const AUTH_DIR = path.join(__dirname, '.auth');
const SESSION_FILE = path.join(AUTH_DIR, 'session.json');

/**
 * Global setup project — runs once before all test projects.
 *
 * 1. Pushes the Prisma schema (creates tables if missing, no destructive reset).
 * 2. Seeds the database with dev data (upserts are idempotent).
 * 3. Generates a valid NextAuth JWT and saves it as a Playwright storageState
 *    so that authenticated test projects pick it up automatically.
 */
setup('seed database and create auth session', async () => {
  // 1. Ensure schema is in sync (CI starts with empty DB, local may already have it)
  execSync('npx prisma db push --skip-generate', {
    stdio: 'pipe',
    env: { ...process.env },
  });

  // 2. Seed the database (uses upserts — safe to re-run)
  execSync('npx prisma db seed', {
    stdio: 'pipe',
    env: { ...process.env },
  });

  // 3. Generate auth session file
  mkdirSync(AUTH_DIR, { recursive: true });
  const storageState = await createAuthStorageState();
  writeFileSync(SESSION_FILE, JSON.stringify(storageState, null, 2));
});
