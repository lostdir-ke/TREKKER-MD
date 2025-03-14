
const { keith } = require("../keizzah/keith");
const { pool } = require("../database/db");
const { delay } = require("../keizzah/utils");

// Register dbcast command
keith({
  nomCom: 'dbcast',
  aliase: 'dbbroadcast',
  categorie: "Admin", 
  reaction: '📊'
}, async (bot, client, context) => {
  const { repondre, superUser, arg } = context;

  if (!superUser) {
    return repondre("You are not authorized to use this command");
  }

  try {
    const dbClient = await pool.connect();
    try {
      // Get broadcast progress
      const progressResult = await dbClient.query(
        'SELECT * FROM broadcast_progress WHERE id = $1',
        ['current']
      );

      if (progressResult.rows.length === 0) {
        return repondre("No broadcast data found in database. Use .dbupload first");
      }

      const progress = progressResult.rows[0];

      if (!progress.is_active) {
        return repondre("Broadcast is not active. Current status: Inactive");
      }

      if (progress.is_paused) {
        return repondre("Broadcast is paused. Use .castresume to continue");
      }

      // Get starting index from argument or default to 0
      const startIndex = arg[0] ? parseInt(arg[0]) : 0;

      // Get contacts from specified index
      const contactsResult = await dbClient.query(
        'SELECT * FROM contacts WHERE progress_id = $1 ORDER BY id OFFSET $2',
        ['current', startIndex]
      );

      if (contactsResult.rows.length === 0) {
        return repondre("No contacts found from the specified index");
      }

      await repondre(`📊 Starting broadcast from contact index ${startIndex}\nRemaining contacts: ${contactsResult.rows.length}`);

      // Process contacts
      for (const contact of contactsResult.rows) {
        try {
          // Send message
          await client.sendMessage(contact.phone_number + "@s.whatsapp.net", { text: "Hello from database broadcast!" });
          
          // Mark as processed
          await dbClient.query(
            'UPDATE contacts SET processed = true WHERE id = $1',
            [contact.id]
          );

          // Update stats
          await dbClient.query(`
            UPDATE broadcast_progress 
            SET success_count = success_count + 1,
                current_index = current_index + 1
            WHERE id = 'current'
          `);

          // Random delay between messages
          await delay(Math.floor(Math.random() * 5000) + 2000);

        } catch (err) {
          console.error(`Error sending to ${contact.phone_number}:`, err);
          continue;
        }
      }

      await repondre("✅ Database broadcast completed");

    } finally {
      dbClient.release();
    }

  } catch (error) {
    console.error('Error in database broadcast:', error);
    return repondre("❌ Error during broadcast: " + error.message);
  }
});
