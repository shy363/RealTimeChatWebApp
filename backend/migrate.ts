import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chatapp',
};

async function migrate() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        console.log('Adding inviteCode column...');
        await connection.query('ALTER TABLE users ADD COLUMN inviteCode VARCHAR(50) UNIQUE AFTER phoneNumber');
        console.log('Migration successful!');
    } catch (e: any) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists.');
        } else {
            console.error('Migration failed:', e);
        }
    } finally {
        await connection.end();
    }
}

migrate();
