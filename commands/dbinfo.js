
const { keith } = require("../keizzah/keith");
const { pool } = require("../database/db");

keith({
  nomCom: 'dbinfo',
  aliase: 'broadcaststats',
  categorie: "Admin",
  reaction: '📊'
}, async (bot, client, context) => {
  const { repondre, superUser } = context;

  if (!superUser) {
    return repondre("You are not authorized to use this command");
  }

  try {
    const dbClient = await pool.connect();
    try {
      const progressResult = await dbClient.query(
        'SELECT * FROM broadcast_progress WHERE id = $1',
        ['current']
      );

      const contactsCount = await dbClient.query(
        'SELECT COUNT(*) FROM contacts WHERE progress_id = $1',
        ['current']
      );

      const processedCount = await dbClient.query(
        'SELECT COUNT(*) FROM contacts WHERE progress_id = $1 AND processed = true',
        ['current']
      );

      const progress = progressResult.rows[0] || {};
      const total = parseInt(contactsCount.rows[0].count) || 0;
      const sent = parseInt(processedCount.rows[0].count) || 0;
      const remaining = total - sent;

      let message = "*📊 BROADCAST DATABASE INFO 📊*\n\n";
      message += `Total Contacts: ${total}\n`;
      message += `Messages Sent: ${sent}\n`;
      message += `Remaining: ${remaining}\n`;
      message += `Success Count: ${progress.success_count || 0}\n`;
      message += `Status: ${progress.is_active ? (progress.is_paused ? '⏸️ Paused' : '▶️ Active') : '⏹️ Inactive'}\n`;

      await repondre(message);
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error('Error getting database info:', error);
    return repondre("❌ Error fetching info: " + error.message);
  }
});
