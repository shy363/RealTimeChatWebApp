import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { createRequire } from 'module';

dotenv.config();
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const require = createRequire(import.meta.url);

let isSqlite = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('sqlite:');

// CRITICAL FIX FOR RENDER: If we're on render, but dotenv injected the local
// mysql://root@localhost URL, force fallback to SQLite.
if (process.env.RENDER === 'true' || process.env.NODE_ENV === 'production') {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')) {
    isSqlite = true;
  }
}

let sqliteDb;
let pool;

if (!isSqlite) {
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
      console.log('🛠️ Using better-sqlite3 for portability...');
      const Database = require('better-sqlite3');
      sqliteDb = new Database('./database.sqlite');

      // Enable WAL mode for better concurrency
      sqliteDb.pragma('journal_mode = WAL');

      sqliteDb.exec(`
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

      console.log('✅ SQLite tables verified/ready (better-sqlite3).');
      return;
    }

    console.log('Connecting to MySQL database...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    await connection.query('SELECT 1');
    await connection.end();

    const poolConn = await pool.getConnection();
    console.log('Successfully connected to MySQL database');

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

    poolConn.release();
    console.log('✅ MySQL tables verified/ready.');
  } catch (error) {
    console.error('❌ DB Init Error:', error.message);
    throw error;
  }
};

// Async-compatible adapter — keeps all controllers unchanged
const dbAdapter = {
  query: async (sql, params = []) => {
    if (isSqlite) {
      const stmt = sqliteDb.prepare(sql);
      const upper = sql.trim().toUpperCase();
      if (upper.startsWith('SELECT') || upper.startsWith('PRAGMA')) {
        const rows = stmt.all(...(Array.isArray(params) ? params : [params]));
        return [rows];
      }
      const result = stmt.run(...(Array.isArray(params) ? params : [params]));
      return [{ insertId: result.lastInsertRowid, affectedRows: result.changes }];
    }
    return pool.query(sql, params);
  },
  execute: async (sql, params = []) => {
    if (isSqlite) return dbAdapter.query(sql, params);
    return pool.execute(sql, params);
  },
};

export default dbAdapter;