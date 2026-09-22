import dotenv from 'dotenv';
dotenv.config();

import { testConnection, query, closePool } from './src/server/db';

const EXPECTED_TABLES = [
  'users',
  'projects',
  'financial_parameters',
  'product_categories',
  'product_skus',
  'sheet3_cogs',
  'suppliers',
  'product_quotations',
  'sales_months',
  'sales_volumes',
  'channel_mix_config',
  'creator_plan',
  'creator_campaigns',
  'hr_positions',
  'hr_headcount',
  'capex_items',
  'opex_items',
  'hr_config',
];

async function run() {
  console.log('🧪 Starting Database Tests (normalized schema)...\n');

  console.log('📌 Test 1: Database Connection');
  const ok = await testConnection();
  if (!ok) {
    console.error('❌ Connection failed. Check .env DB_* settings and that MySQL is running.');
    process.exit(1);
  }
  console.log('✅ Connection successful!\n');

  console.log('📌 Test 2: Verify Tables Exist');
  const rows: any = await query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'`
  );
  const existing = new Set((rows as any[]).map((r) => String(r.table_name || r.TABLE_NAME).toLowerCase()));

  let missing = 0;
  for (const t of EXPECTED_TABLES) {
    if (existing.has(t)) {
      console.log(`  ✅ Table "${t}" exists`);
    } else {
      console.log(`  ❌ Table "${t}" MISSING`);
      missing++;
    }
  }

  if (missing > 0) {
    console.error(`\n❌ ${missing} table(s) missing. Run: mysql -u root -p < database.sql\n`);
    await closePool();
    process.exit(1);
  }

  console.log('\n📌 Test 3: Insert & Query Test Project');
  const name = `test_project_${Date.now()}`;
  await query('INSERT INTO projects (project_name) VALUES (?)', [name]);
  const found: any = await query('SELECT id, project_name, created_at FROM projects WHERE project_name = ?', [
    name,
  ]);
  console.log(`  ✅ Inserted test project: "${name}"`);
  console.log(`  ✅ Retrieved project: ID=${found[0].id}, Name=${found[0].project_name}`);
  console.log(`  ✅ Created at: ${found[0].created_at}`);
  await query('DELETE FROM projects WHERE project_name = ?', [name]);
  console.log('  ✅ Cleaned up test project');

  console.log('\n📌 Test 4: Database Structure Validation');
  console.log(`  ✅ Total expected tables: ${EXPECTED_TABLES.length}`);
  console.log(`  ✅ All expected tables created`);

  console.log('\n✨ Database tests completed!');
  await closePool();
  process.exit(0);
}

run().catch(async (err) => {
  console.error(err);
  await closePool();
  process.exit(1);
});
