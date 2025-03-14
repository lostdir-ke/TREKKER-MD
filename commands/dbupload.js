
const { keith } = require("../keizzah/keith");
const { pool } = require("../database/db");
const axios = require("axios");

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

  const url = arg[0] || 'https://raw.githubusercontent.com/Beltah254/BELTAH-MD/main/verified_contacts.txt';
  
  try {
    await repondre(`📥 Downloading contacts from:\n${url}`);
    
    const response = await axios.get(url, {
      headers: { 'Accept': 'application/json' }
    });
    const data = response.data;

    if (!data || typeof data !== 'object') {
      return repondre("❌ Invalid JSON format in downloaded file");
    }

    if (!data.contacts || !Array.isArray(data.contacts)) {
      return repondre("❌ Invalid format - missing contacts array");
    }

    await repondre(`📁 File downloaded successfully!\n📊 Found ${data.contacts.length} contacts\n⏳ Starting database upload...`);

    const dbClient = await pool.connect();
    try {
      // Process in batches of 100
      const BATCH_SIZE = 100;
      let processedCount = 0;
      let successCount = 0;

      // Clear existing data
      await dbClient.query('DELETE FROM broadcast_progress WHERE id = $1', ['current']);
      await dbClient.query('DELETE FROM contacts WHERE progress_id = $1', ['current']);

      // Insert new broadcast progress
      await dbClient.query(`
        INSERT INTO broadcast_progress (
          id, current_index, total_contacts, timestamp, is_active, is_paused,
          success_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'current',
        0,
        data.contacts.length,
        new Date(),
        false,
        false,
        0
      ]);

      // Process contacts in batches
      for (let i = 0; i < data.contacts.length; i += BATCH_SIZE) {
        const batch = data.contacts.slice(i, Math.min(i + BATCH_SIZE, data.contacts.length));
        
        await Promise.all(batch.map(contact => 
          dbClient.query(
            'INSERT INTO contacts (progress_id, name, phone_number, processed) VALUES ($1, $2, $3, $4)',
            ['current', contact.name || '', contact.phoneNumber, false]
          ).then(() => successCount++)
        ));

        processedCount += batch.length;
        
        // Progress update every batch
        if (processedCount % BATCH_SIZE === 0 || processedCount === data.contacts.length) {
          await repondre(`📊 Progress: ${processedCount}/${data.contacts.length} contacts\n✅ Successfully saved: ${successCount}`);
        }
      }

      await repondre(`✅ Upload completed!\n📊 Total contacts: ${data.contacts.length}\n✅ Successfully saved: ${successCount}\n\nDatabase is ready for broadcast using .dbcast command`);

    } finally {
      dbClient.release();
    }

  } catch (error) {
    console.error('Error uploading broadcast data:', error);
    return repondre("❌ Failed to upload: " + error.message);
  }
});
