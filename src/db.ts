import 'dotenv/config';
import { Pool } from 'pg';

const DB_HOST = process.env.DB_HOST ?? 'localhost';
const DB_PORT = Number(process.env.DB_PORT ?? 5432);
const DB_USER = process.env.DB_USER ?? 'postgres';
const DB_PASS = process.env.DB_PASS ?? 'postgres';
const DB_NAME = process.env.DB_NAME ?? 'monitoreo_trafico';

export const pool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
});
