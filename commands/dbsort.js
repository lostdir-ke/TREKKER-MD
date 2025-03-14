
const { keith } = require("../keizzah/keith");
const { pool } = require("../database/db");

keith({
  nomCom: 'dbsort',
  aliase: 'sortdatabase',
  categorie: "Admin",
  reaction: '📊'
}, async (bot, client, context) => {
  const { repondre, superUser } = context;

  if (!superUser) {
    return repondre("You are not authorized to use this command");
  }

  const dbClient = await pool.connect();
  try {
    await repondre("🔄 Starting database reindexing...");

    // Get total contacts count
    const countResult = await dbClient.query('SELECT COUNT(*) FROM contacts WHERE progress_id = $1', ['current']);
    const totalContacts = parseInt(countResult.rows[0].count);

    // Create temporary sequence
    await dbClient.query('CREATE TEMPORARY SEQUENCE temp_id_seq START 1');
    
    // Update IDs sequentially
    await dbClient.query(`
      WITH numbered_rows AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS new_id
        FROM contacts
        WHERE progress_id = 'current'
      )
      UPDATE contacts c
      SET id = n.new_id
      FROM numbered_rows n
      WHERE c.id = n.id AND c.progress_id = 'current'
    `);

    // Drop temporary sequence
    await dbClient.query('DROP SEQUENCE temp_id_seq');

    // Reset the actual sequence
    await dbClient.query('ALTER SEQUENCE contacts_id_seq RESTART WITH ' + (totalContacts + 1));

    await repondre(`✅ Database reindexing completed!\n📊 Total contacts reindexed: ${totalContacts}\n🔢 IDs now start from 1 and are sequential`);

  } catch (error) {
    console.error('Error sorting database:', error);
    await repondre("❌ Error occurred while reindexing: " + error.message);
  } finally {
    dbClient.release();
  }
});
