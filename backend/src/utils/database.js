import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Use Railway DATABASE_URL directly
const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 150,
  queueLimit: 0,
});

export const initDatabase = async () => {
  try {
    console.log("Connecting to Railway MySQL...");

    // ✅ Direct connection using DATABASE_URL
    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    // Test connection
    await connection.query('SELECT 1');
    await connection.end();

    // Get pool connection
    const poolConn = await pool.getConnection();
    console.log(`Successfully connected to Railway database`);

    // ✅ Create tables
    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        emojiPattern VARCHAR(255),
        phoneNumber VARCHAR(20),
        inviteCode VARCHAR(50) UNIQUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);

    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        contactId VARCHAR(36) NOT NULL,
        status ENUM('pending', 'sent', 'accepted', 'blocked') DEFAULT 'accepted',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY u_contact (userId, contactId),
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (contactId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content TEXT NOT NULL,
        userId VARCHAR(36) NOT NULL,
        username VARCHAR(50) NOT NULL,
        recipientId VARCHAR(36),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (userId),
        CONSTRAINT fk_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    await poolConn.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        fingerprint VARCHAR(255) NOT NULL,
        token TEXT NOT NULL,
        lastSeen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);

    // Schema updates
    try {
      await poolConn.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS emojiPattern VARCHAR(255)');
    } catch (e) {
      try {
        await poolConn.query('ALTER TABLE users ADD COLUMN emojiPattern VARCHAR(255)');
      } catch (err) {
        if (err.errno !== 1060) throw err;
      }
    }

    try {
      await poolConn.query("ALTER TABLE contacts MODIFY COLUMN status ENUM('pending', 'sent', 'accepted', 'blocked') DEFAULT 'accepted'");
    } catch (err) {
      console.warn('Enum status update warn:', err.message);
    }

    try {
      await poolConn.query("ALTER TABLE user_sessions MODIFY COLUMN token TEXT NOT NULL");
    } catch (err) {
      console.warn('Session token update warn:', err.message);
    }

    poolConn.release();
    console.log('✅ Backend Tables verified/ready.');
  } catch (error) {
    console.log('❌ MySQL Init Error:', error.message);
    throw error;
  }
};

export default pool;