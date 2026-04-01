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
    const [ruelle] = await connection.execute('SELECT id FROM users WHERE username = "ruelle"');
    const [trial] = await connection.execute('SELECT id FROM users WHERE username = "trial"');
    
    if (ruelle.length > 0 && trial.length > 0) {
      console.log('Ruelle ID:', ruelle[0].id);
      console.log('Trial ID:', trial[0].id);
      
      const [contacts] = await connection.execute(
        'SELECT * FROM contacts WHERE (userId = ? AND contactId = ?) OR (userId = ? AND contactId = ?)',
        [ruelle[0].id, trial[0].id, trial[0].id, ruelle[0].id]
      );
      console.log('Contacts between them:');
      console.table(contacts);
    } else {
      console.log('Ruelle or Trial not found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

check();
