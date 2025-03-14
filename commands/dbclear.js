
const { keith } = require("../keizzah/keith");
const { pool } = require("../database/db");

keith({
  nomCom: 'dbclear',
  aliase: 'clearbroadcastdata',
  categorie: "Admin",
  reaction: '🗑️'
}, async (bot, client, context) => {
  const { repondre, superUser } = context;

  if (!superUser) {
    return repondre("You are not authorized to use this command");
  }

  try {
    const dbClient = await pool.connect();
    try {
      await dbClient.query('DELETE FROM contacts WHERE progress_id = $1', ['current']);
      await dbClient.query('DELETE FROM broadcast_progress WHERE id = $1', ['current']);
      
      await repondre("✅ All broadcast contacts and progress data cleared from database");
    } finally {
      dbClient.release();
    }
  } catch (error) {
    console.error('Error clearing database:', error);
    return repondre("❌ Error clearing database: " + error.message);
  }
});
