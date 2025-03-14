
const { keith } = require("../keizzah/keith");
const { pool } = require("../database/db");
const axios = require("axios");

// Register dbupload command
keith({
  nomCom: 'dbupload',
  aliase: 'uploadbroadcastdata',
  categorie: "Admin",
  reaction: '📊'
}, async (bot, client, context) => {
  const { repondre, arg, superUser } = context;

  if (!superUser) {
    return repondre("You are not authorized to use this command");
  }

  if (!arg[0]) {
    return repondre("Please provide the URL to download the broadcast data from\nUsage: .dbupload <url>");
  }

  try {
    // Download the JSON file from URL
    const response = await axios.get(arg[0]);
    const progressData = response.data;

    // Validate the data structure
    if (!progressData || typeof progressData !== 'object') {
      return repondre("Invalid data format in the downloaded file");
    }

    const client = await pool.connect();
    try {
      // First clear existing data
      await client.query('DELETE FROM broadcast_progress WHERE id = $1', ['current']);
      await client.query('DELETE FROM contacts WHERE progress_id = $1', ['current']);

      // Insert new broadcast progress
      await client.query(`
        INSERT INTO broadcast_progress (
          id, current_index, total_contacts, timestamp, is_active, is_paused,
          success_count, registered_count, not_registered_count, already_messaged_count,
          start_timestamp, paused_timestamp, resumed_timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        'current',
        progressData.currentIndex || 0,
        progressData.contacts?.length || 0,
        new Date(),
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

      // Insert contacts if present
      if (progressData.contacts && Array.isArray(progressData.contacts)) {
        for (const contact of progressData.contacts) {
          await client.query(
            'INSERT INTO contacts (progress_id, name, phone_number, processed) VALUES ($1, $2, $3, $4)',
            ['current', contact.name, contact.phoneNumber, false]
          );
        }
      }

      await repondre(`✅ Successfully uploaded broadcast data to database\n\nContacts: ${progressData.contacts?.length || 0}\nCurrent Index: ${progressData.currentIndex || 0}\nStatus: ${progressData.isActive ? 'Active' : 'Inactive'}${progressData.isPaused ? ' (Paused)' : ''}`);

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error uploading broadcast data:', error);
    return repondre("❌ Failed to upload broadcast data: " + error.message);
  }
});
