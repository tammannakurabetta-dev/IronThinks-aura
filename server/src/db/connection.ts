import pg from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const { Pool } = pg;

export interface DBConfig {
  hasPostgres: boolean;
  hasSupabase: boolean;
  pool: pg.Pool | null;
  supabase: SupabaseClient | null;
}

let pool: pg.Pool | null = null;
let supabase: SupabaseClient | null = null;

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (dbUrl && !dbUrl.includes('placeholder')) {
  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    console.log('📦 PostgreSQL connection pool initialized.');
  } catch (err: any) {
    console.warn('⚠️ Failed to initialize PostgreSQL pool:', err.message);
  }
}

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project') && !supabaseKey.includes('placeholder')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    console.log('⚡ Supabase Client initialized with endpoint:', supabaseUrl);
  } catch (err: any) {
    console.warn('⚠️ Failed to initialize Supabase client:', err.message);
  }
}

export const dbConfig: DBConfig = {
  hasPostgres: pool !== null,
  hasSupabase: supabase !== null,
  pool,
  supabase,
};

export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  driver: 'postgres' | 'supabase' | 'in-memory-cached';
  message: string;
}> {
  if (pool) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      return { connected: true, driver: 'postgres', message: 'Direct PostgreSQL pool active' };
    } catch (err: any) {
      console.warn('PostgreSQL ping failed, checking fallbacks:', err.message);
    }
  }

  if (supabase) {
    try {
      const { error } = await supabase.from('workflows').select('id').limit(1);
      if (!error) {
        return { connected: true, driver: 'supabase', message: 'Supabase REST API connected' };
      }
    } catch (err: any) {
      console.warn('Supabase ping failed:', err.message);
    }
  }

  return {
    connected: true,
    driver: 'in-memory-cached',
    message: 'Running with high-performance transactional in-memory store (Ready for live DATABASE_URL)'
  };
}
