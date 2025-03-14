
const { keith } = require("../keizzah/keith");
const { pool } = require("../database/db");

keith({
  nomCom: 'dbpause',
  aliase: 'pausedbbroadcast',
  categorie: "Admin",
  reaction: '⏸️'
}, async (bot, client, context) => {
  const { repondre, superUser } = context;

  if (!superUser) {
    return repondre("You are not authorized to use this command");
  }

  const dbClient = await pool.connect();
  try {
    // Get current progress
    const progressResult = await dbClient.query(
      'SELECT * FROM broadcast_progress WHERE id = $1',
      ['current']
    );

    if (progressResult.rows.length === 0) {
      return repondre("No broadcast in progress");
    }

    const progress = progressResult.rows[0];

    if (!progress.is_active) {
      return repondre("No active broadcast to pause");
    }

    if (progress.is_paused) {
      return repondre("Broadcast is already paused");
    }

    // Update pause state
    await dbClient.query(`
      UPDATE broadcast_progress 
      SET is_paused = true,
          timestamp = CURRENT_TIMESTAMP
      WHERE id = 'current'
    `);

    await repondre("⏸️ Database broadcast paused. Use .dbresume to continue");

  } catch (error) {
    console.error('Error in pause broadcast:', error);
    await repondre("❌ Error pausing broadcast: " + error.message);
  } finally {
    dbClient.release();
  }
});
