const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chatapp',
};

async function check() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [users] = await connection.execute('SELECT id, username FROM users');
    console.log('--- USERS ---');
    console.table(users);

    const [contacts] = await connection.execute('SELECT * FROM contacts');
    console.log('--- CONTACTS ---');
    console.table(contacts);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

check();
