import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config(); // Root .env
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') }); // Backend .env

const isSqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('sqlite:');
let db;
let pool;

if (isSqlite) {
  console.log("🛠️ Using SQLite Storage for Portability...");
} else {
  pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 150,
    queueLimit: 0,
  });
}

export const initDatabase = async () => {
  try {
    if (isSqlite) {
      db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
      });

      await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          emojiPattern TEXT,
          phoneNumber TEXT,
          inviteCode TEXT UNIQUE,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          contactId TEXT NOT NULL,
          status TEXT CHECK(status IN ('pending', 'sent', 'accepted', 'blocked')) DEFAULT 'accepted',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (userId, contactId),
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (contactId) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          content TEXT NOT NULL,
          userId TEXT NOT NULL,
          username TEXT NOT NULL,
          recipientId TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS user_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          fingerprint TEXT NOT NULL,
          token TEXT NOT NULL,
          lastSeen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
      console.log('✅ SQLite Tables verified/ready.');
      return;
    }

    console.log("Connecting to Railway MySQL...");
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    await connection.query('SELECT 1');
    await connection.end();

    const poolConn = await pool.getConnection();
    console.log(`Successfully connected to Railway database`);

    // Create tables (MySQL syntax)
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

    // ... (rest of MySQL table creation)
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

    poolConn.release();
    console.log('✅ Backend Tables verified/ready.');
  } catch (error) {
    console.log('❌ DB Init Error:', error.message);
    throw error;
  }
};

// Polyfill query method for pool to support both
const dbAdapter = {
  query: async (sql, params) => {
    if (isSqlite) {
      // Convert MySQL ? to SQLite ? or named params if necessary
      // Simple ? replacement works for both in basic queries
      if (sql.includes('SELECT') || sql.includes('SHOW')) {
        return [await db.all(sql, params)];
      }
      const result = await db.run(sql, params);
      return [{ insertId: result.lastID, affectedRows: result.changes }];
    }
    return pool.query(sql, params);
  },
  execute: async (sql, params) => {
    if (isSqlite) return dbAdapter.query(sql, params);
    return pool.execute(sql, params);
  }
};

export default dbAdapter;