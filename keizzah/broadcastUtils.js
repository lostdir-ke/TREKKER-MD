
const { Pool } = require('pg');

// Hard-coded database URL
const DATABASE_URL = 'postgresql://admin:Otw6EXTII3nY7JbC0Y6tOGtLZvz4eCaD@dpg-cv86okd2ng1s73ecvd60-a.oregon-postgres.render.com/trekker2';

// Hardcoded database connection
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
const fs = require('fs-extra');

// Check if a number has been messaged before
async function hasBeenMessaged(phoneNumber) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM broadcast_logs WHERE phone_number = $1',
        [phoneNumber]
      );
      return result.rows.length > 0;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error checking if number has been messaged:', error);
    return false;
  }
}

// Log a number as messaged
async function logMessaged(phoneNumber) {
  try {
    const client = await pool.connect();
    try {
      await client.query(
        'INSERT INTO broadcast_logs (phone_number) VALUES ($1) ON CONFLICT (phone_number) DO NOTHING',
        [phoneNumber]
      );
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error logging messaged number:', error);
    return false;
  }
}

// Save broadcast progress with GitHub sync
async function saveBroadcastProgress(progressData) {
  try {
    // Save to database
    const client = await pool.connect();
    try {
      // First update the progress record with message history
      await client.query(`
        INSERT INTO broadcast_progress 
        (id, current_index, total_contacts, timestamp, is_active, is_paused,
        success_count, registered_count, not_registered_count, already_messaged_count,
        start_timestamp, paused_timestamp, resumed_timestamp, last_numbers)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
        current_index = $2,
        total_contacts = $3,
        timestamp = $4,
        is_active = $5,
        is_paused = $6,
        success_count = $7,
        registered_count = $8,
        not_registered_count = $9,
        already_messaged_count = $10,
        start_timestamp = $11,
        paused_timestamp = $12,
        resumed_timestamp = $13
      `, [
        'current',
        progressData.currentIndex || 0,
        progressData.totalContacts || 0,
        progressData.timestamp || new Date(),
        progressData.isActive || false,
        progressData.isPaused || false,
        progressData.stats?.successCount || 0,
        progressData.stats?.registeredCount || 0,
        progressData.stats?.notRegisteredCount || 0,
        progressData.stats?.alreadyMessagedCount || 0,
        progressData.startTimestamp || null,
        progressData.pausedTimestamp || null,
        progressData.resumedTimestamp || null
      ]);
      
      // If contacts are provided, store them
      if (progressData.savedContacts && progressData.savedContacts.length > 0) {
        // Clear existing contacts
        await client.query('DELETE FROM contacts WHERE progress_id = $1', ['current']);
        
        // Add new contacts
        for (const contact of progressData.savedContacts) {
          await client.query(
            'INSERT INTO contacts (progress_id, name, phone_number, processed) VALUES ($1, $2, $3, $4)',
            ['current', contact.name, contact.phoneNumber, 
             progressData.currentIndex > progressData.savedContacts.indexOf(contact)]
          );
        }
      }
      
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saving broadcast progress:', error);
    
    // Fallback to file system if database fails
    try {
      await fs.writeJSON('broadcast_progress.json', progressData);
      return true;
    } catch (fsError) {
      console.error('Error saving progress to file system:', fsError);
      return false;
    }
  }
}

// Get broadcast progress
async function getBroadcastProgress() {
  try {
    const client = await pool.connect();
    try {
      // Get the progress data
      const progressResult = await client.query(
        'SELECT * FROM broadcast_progress WHERE id = $1',
        ['current']
      );
      
      if (progressResult.rows.length === 0) {
        return null;
      }
      
      const progressData = progressResult.rows[0];
      
      // Get the contacts
      const contactsResult = await client.query(
        'SELECT * FROM contacts WHERE progress_id = $1 ORDER BY id',
        ['current']
      );
      
      // Format the response to match the previous JSON structure
      return {
        currentIndex: progressData.current_index,
        totalContacts: progressData.total_contacts,
        timestamp: progressData.timestamp,
        isActive: progressData.is_active,
        isPaused: progressData.is_paused,
        stats: {
          successCount: progressData.success_count,
          registeredCount: progressData.registered_count,
          notRegisteredCount: progressData.not_registered_count,
          alreadyMessagedCount: progressData.already_messaged_count
        },
        startTimestamp: progressData.start_timestamp,
        pausedTimestamp: progressData.paused_timestamp,
        resumedTimestamp: progressData.resumed_timestamp,
        savedContacts: contactsResult.rows.map(row => ({
          name: row.name,
          phoneNumber: row.phone_number
        }))
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting broadcast progress:', error);
    
    // Fallback to file system if database fails
    try {
      if (await fs.pathExists('broadcast_progress.json')) {
        return await fs.readJSON('broadcast_progress.json');
      } else if (await fs.pathExists('attached_assets/broadcast_progress.json')) {
        return await fs.readJSON('attached_assets/broadcast_progress.json');
      }
    } catch (fsError) {
      console.error('Error reading progress from file system:', fsError);
    }
    
    return null;
  }
}

// Reset broadcast progress
async function resetBroadcastProgress() {
  try {
    const client = await pool.connect();
    try {
      // Delete contacts first (due to foreign key constraint)
      await client.query('DELETE FROM contacts WHERE progress_id = $1', ['current']);
      
      // Then delete the progress record
      await client.query('DELETE FROM broadcast_progress WHERE id = $1', ['current']);
      
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error resetting broadcast progress:', error);
    return false;
  }
}

// Reset broadcast logs
async function resetBroadcastLogs() {
  try {
    const client = await pool.connect();
    try {
      await client.query('TRUNCATE TABLE broadcast_logs');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error resetting broadcast logs:', error);
    return false;
  }
}

// Get broadcast stats
async function getBroadcastStats() {
  try {
    const client = await pool.connect();
    try {
      const logsCount = await client.query('SELECT COUNT(*) FROM broadcast_logs');
      return {
        totalMessaged: parseInt(logsCount.rows[0].count)
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting broadcast stats:', error);
    return { totalMessaged: 0 };
  }
}

module.exports = {
  hasBeenMessaged,
  logMessaged,
  saveBroadcastProgress,
  getBroadcastProgress,
  resetBroadcastProgress,
  resetBroadcastLogs,
  getBroadcastStats
};
