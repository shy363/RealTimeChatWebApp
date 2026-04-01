import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'chatapp',
};

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 150,
  queueLimit: 0,
});

export const initDatabase = async () => {
  try {
    console.log(`Connecting to MySQL at ${dbConfig.host}:${dbConfig.port}...`);
    
    // 1. Create connection without DB first to ensure it exists
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
    await connection.end();

    // 2. Test the pool
    const poolConn = await pool.getConnection();
    console.log(`Successfully connected to database "${dbConfig.database}"`);
    
    // 3. Stable table check (No more dropping)
    // await poolConn.query(`SET FOREIGN_KEY_CHECKS = 0`);
    // await poolConn.query(`DROP TABLE IF EXISTS messages`);
    // await poolConn.query(`DROP TABLE IF EXISTS users`);
    // await poolConn.query(`SET FOREIGN_KEY_CHECKS = 1`);

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

    // Ensure emojiPattern exists (schema update)
    try {
      await poolConn.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS emojiPattern VARCHAR(255)');
    } catch (e) {
      // In case ADD COLUMN IF NOT EXISTS is not supported in this MySQL version
      try {
        await poolConn.query('ALTER TABLE users ADD COLUMN emojiPattern VARCHAR(255)');
      } catch (err: any) {
        if (err.errno !== 1060) throw err; // 1060 is duplicate column
      }
    }

    // Ensure 'sent' status exists in ENUM
    try {
      await poolConn.query("ALTER TABLE contacts MODIFY COLUMN status ENUM('pending', 'sent', 'accepted', 'blocked') DEFAULT 'accepted'");
    } catch (err: any) {
      console.warn('Enum status update warn:', err.message);
    }

    // Fix session token truncation issues
    try {
      await poolConn.query("ALTER TABLE user_sessions MODIFY COLUMN token TEXT NOT NULL");
    } catch (err: any) {
      console.warn('Session token update warn:', err.message);
    }

    poolConn.release();
    console.log('Backend Tables verified/ready.');
  } catch (error: any) {
    console.error('MySQL Init Error:', error.message);
    console.error('Ensure MySQL is running on port 3306.');
    throw error;
  }
};

export default pool;
