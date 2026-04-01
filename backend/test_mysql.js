const mysql = require('mysql2/promise');

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
    });
    console.log('Successfully connected to MySQL!');
    await conn.end();
  } catch (err) {
    console.error('Failed to connect to MySQL:', err.message);
  }
}

test();
