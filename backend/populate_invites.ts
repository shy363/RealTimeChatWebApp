import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chatapp',
};

async function populateInvites() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [users] = await connection.query('SELECT id FROM users WHERE inviteCode IS NULL') as any[];
        console.log(`Populating invite codes for ${users.length} users...`);
        for (const user of users) {
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            await connection.query('UPDATE users SET inviteCode = ? WHERE id = ?', [code, user.id]);
        }
        console.log('Successfully populated invite codes!');
    } catch (e: any) {
        console.error('Population failed:', e);
    } finally {
        await connection.end();
    }
}

populateInvites();
