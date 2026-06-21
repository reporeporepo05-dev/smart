import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export const getPool = () => {
  if (!pool) {
    // Railway provides MYSQL_URL
    const dbUrl = process.env.MYSQL_URL;
    if (dbUrl) {
      pool = mysql.createPool(dbUrl);
    } else {
      // Fallback if env variables are set directly instead of URL
      pool = mysql.createPool({
        host: process.env.MYSQLHOST || 'localhost',
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD || '',
        database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'sms_db',
        port: parseInt(process.env.MYSQLPORT || '3306', 10),
      });
    }
  }
  return pool;
};

export const setupDatabase = async () => {
  const db = getPool();
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS settings (
      setting_key VARCHAR(255) PRIMARY KEY,
      setting_value TEXT
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      total_messages INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      campaign_id INT NULL,
      dest_addr VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      request_id VARCHAR(255),
      status VARCHAR(50) DEFAULT 'QUEUED',
      cost INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
    )
  `);
};
