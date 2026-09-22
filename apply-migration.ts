/**
 * Apply / refresh normalized schema tables.
 * Prefer: mysql -u root -p < database.sql
 * This script is a safety net for environments that can run Node against MySQL.
 */
import { getConnection, closePool } from './src/server/db';
import fs from 'fs';
import path from 'path';

async function applyMigration() {
  const conn = await getConnection();
  try {
    const schemaPath = path.join(process.cwd(), 'database.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Strip CREATE DATABASE / USE - connection already selects DB
    const statements = sql
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith('--'))
      .filter((s) => !/^CREATE\s+DATABASE/i.test(s))
      .filter((s) => !/^USE\s+/i.test(s));

    console.log(`Applying ${statements.length} SQL statements from database.sql...`);
    for (const stmt of statements) {
      try {
        await conn.query(stmt);
      } catch (err: any) {
        // Ignore "already exists" style noise; log others
        if (!/already exists/i.test(err.message)) {
          console.warn('Statement warning:', err.message);
        }
      }
    }
    console.log('✅ Schema apply finished');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    conn.release();
    await closePool();
    process.exit(0);
  }
}

applyMigration();
