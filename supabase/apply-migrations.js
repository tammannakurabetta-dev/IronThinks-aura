import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from supabase/.env or root or server/.env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', 'server', '.env') });

const { Client } = pg;

async function runMigration() {
  console.log('====================================================');
  console.log('🌱 Agri-Genome OS - Supabase Database Migration Runner');
  console.log('====================================================\n');

  const migrationFilePath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
  if (!fs.existsSync(migrationFilePath)) {
    console.error(`❌ Migration file not found at: ${migrationFilePath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');
  console.log(`📄 Loaded migration file: 001_initial_schema.sql (${(sqlContent.length / 1024).toFixed(1)} KB)`);

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (dbUrl) {
    console.log('🔌 Connecting directly to PostgreSQL via connection string...');
    const client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log('✅ Connected to PostgreSQL database.');
      console.log('⏳ Executing schema migration...');
      
      const startTime = Date.now();
      await client.query(sqlContent);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      
      console.log(`🎉 Migration successfully applied in ${elapsed}s!\n`);

      // Verification checks
      console.log('🔍 Running schema verification checks...');
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('profiles', 'farms', 'plots', 'advisories', 'advisory_action_items')
        ORDER BY table_name;
      `);
      console.log(`✅ Verified tables in 'public' schema (${tablesRes.rows.length}/5):`);
      tablesRes.rows.forEach(r => console.log(`   - ${r.table_name}`));

      const rlsRes = await client.query(`
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN ('profiles', 'farms', 'plots', 'advisories', 'advisory_action_items');
      `);
      console.log(`✅ Row Level Security (RLS) Status:`);
      rlsRes.rows.forEach(r => console.log(`   - ${r.tablename}: ${r.rowsecurity ? 'ENABLED (Protected)' : 'DISABLED'}`));

      const countsRes = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM profiles) AS profiles_count,
          (SELECT COUNT(*) FROM farms) AS farms_count,
          (SELECT COUNT(*) FROM plots) AS plots_count,
          (SELECT COUNT(*) FROM advisories) AS advisories_count,
          (SELECT COUNT(*) FROM advisory_action_items) AS actions_count;
      `);
      console.log('\n📊 Seed Records Summary:');
      console.log(`   - Profiles: ${countsRes.rows[0].profiles_count}`);
      console.log(`   - Farms: ${countsRes.rows[0].farms_count}`);
      console.log(`   - Plots: ${countsRes.rows[0].plots_count}`);
      console.log(`   - Advisories: ${countsRes.rows[0].advisories_count}`);
      console.log(`   - Action Items: ${countsRes.rows[0].actions_count}`);

      await client.end();
      process.exit(0);
    } catch (err) {
      console.error('❌ Migration failed:', err.message);
      await client.end();
      process.exit(1);
    }
  } else if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes('your-project')) {
    console.log(`🌐 Supabase URL detected: ${supabaseUrl}`);
    console.log('🔑 Supabase Service Role Key present.');
    
    // Check if tables already exist via REST API
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      if (!error) {
        console.log('✅ Tables already exist and are reachable via Supabase Service Client.');
        console.log('💡 To re-apply or run DDL statements directly, provide DATABASE_URL in your .env');
        console.log('   or copy & paste supabase/migrations/001_initial_schema.sql into your Supabase Dashboard SQL Editor.');
        process.exit(0);
      } else {
        console.log('ℹ️ Profiles table not yet created on Supabase project.');
        console.log('\n===============================================================');
        console.log('👉 ACTION REQUIRED: Run SQL in Supabase SQL Editor:');
        console.log('1. Open your Supabase Dashboard: ' + supabaseUrl.replace('.supabase.co', '') + ' (or https://supabase.com/dashboard)');
        console.log('2. Navigate to "SQL Editor" -> "New Query"');
        console.log('3. Paste the contents of supabase/migrations/001_initial_schema.sql and click "Run"');
        console.log('   OR: Provide DATABASE_URL in your server/.env (Project Settings -> Database -> Connection string (URI))');
        console.log('===============================================================\n');
        process.exit(0);
      }
    } catch (err) {
      console.error('Error connecting to Supabase:', err.message);
    }
  } else {
    console.log('⚠️  No active DATABASE_URL or Supabase credentials detected.');
    console.log('📋 Validated SQL Migration File:');
    console.log(`   Location: ${migrationFilePath}`);
    console.log(`   Size: ${(sqlContent.length / 1024).toFixed(1)} KB`);
    console.log('\n💡 To apply this migration to your live Supabase database:');
    console.log('   Option A (Direct SQL Editor):');
    console.log('     1. Open Supabase Dashboard -> SQL Editor');
    console.log('     2. Copy & paste supabase/migrations/001_initial_schema.sql and execute.');
    console.log('   Option B (CLI / Automated runner):');
    console.log('     1. Add DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres in server/.env');
    console.log('     2. Run `npm run migrate` in the supabase/ folder.\n');
  }
}

runMigration().catch(console.error);
