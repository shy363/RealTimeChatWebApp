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
    const [users] = await connection.execute('SELECT username, id, emojiPattern FROM users WHERE username IN ("trial", "ruelle")');
    console.table(users);
  } finally {
    await connection.end();
  }
}
check();
