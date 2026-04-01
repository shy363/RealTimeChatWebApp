-- Real-Time Chat Application Database Schema
-- MySQL Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS chatapp;
USE chatapp;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    content TEXT NOT NULL,
    userId VARCHAR(36) NOT NULL,
    username VARCHAR(50) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_createdAt (createdAt),
    INDEX idx_userId (userId)
);

-- Insert sample data (optional)
-- INSERT INTO users (username, email, password) VALUES 
-- ('admin', 'admin@chatapp.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6QJw/2Ej7W'); -- password: Admin123

-- INSERT INTO messages (content, userId, username) VALUES 
-- ('Welcome to the chat application!', 'admin-id', 'admin'),
-- ('This is a sample message.', 'admin-id', 'admin');
