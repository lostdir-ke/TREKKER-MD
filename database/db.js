
const { Pool } = require('pg');

// PostgreSQL connection configuration
const pool = new Pool({
  connectionString: 'postgresql://admin:Otw6EXTII3nY7JbC0Y6tOGtLZvz4eCaD@dpg-cv86okd2ng1s73ecvd60-a.oregon-postgres.render.com/trekker2',
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize database tables if they don't exist
async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create broadcast_logs table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS broadcast_logs (
        phone_number TEXT PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create broadcast_progress table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS broadcast_progress (
        id TEXT PRIMARY KEY DEFAULT 'current',
        current_index INTEGER DEFAULT 0,
        total_contacts INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT FALSE,
        is_paused BOOLEAN DEFAULT FALSE,
        success_count INTEGER DEFAULT 0,
        registered_count INTEGER DEFAULT 0,
        not_registered_count INTEGER DEFAULT 0,
        already_messaged_count INTEGER DEFAULT 0,
        start_timestamp TIMESTAMP,
        paused_timestamp TIMESTAMP,
        resumed_timestamp TIMESTAMP
      );
    `);
    
    // Create contacts table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        progress_id TEXT REFERENCES broadcast_progress(id),
        name TEXT,
        phone_number TEXT NOT NULL,
        processed BOOLEAN DEFAULT FALSE
      );
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    client.release();
  }
}

// Initialize database on module load
initDatabase().catch(console.error);

module.exports = {
  pool,
  initDatabase
};
