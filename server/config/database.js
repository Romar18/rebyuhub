const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const useSsl =
  !connectionString.includes("localhost") &&
  !connectionString.includes("127.0.0.1");

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function initializeReviewerTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS reviewers (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      subject TEXT,
      category TEXT,
      file_url TEXT,
      file_path TEXT,
      file_size INTEGER,
      uploaded_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    ALTER TABLE reviewers
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS subject TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT,
    ADD COLUMN IF NOT EXISTS file_url TEXT,
    ADD COLUMN IF NOT EXISTS file_path TEXT,
    ADD COLUMN IF NOT EXISTS file_size INTEGER,
    ADD COLUMN IF NOT EXISTS uploaded_by INTEGER,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `);
}

module.exports = {
  pool,
  query,
  initializeReviewerTable,
};
