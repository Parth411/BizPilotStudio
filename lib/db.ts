import 'server-only';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is missing. Run `neon env pull` in the project root.');

export const sql = neon(connectionString, { fetchOptions: { cache: 'no-store' } });
