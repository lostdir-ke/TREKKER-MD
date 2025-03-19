require("dotenv").config();
const { Pool } = require("pg");

// Hard-coded database URL - not dependent on environment variables
const DATABASE_URL = 'postgresql://admin:Otw6EXTII3nY7JbC0Y6tOGtLZvz4eCaD@dpg-cv86okd2ng1s73ecvd60-a.oregon-postgres.render.com/trekker2';

const proConfig = {
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
};

const pool = new Pool(proConfig);


async function createTablecron() {
    const client = await pool.connect();
    try {
      // Exécutez une requête SQL pour créer la table "cron" si elle n'existe pas déjà
      await client.query(`
        CREATE TABLE IF NOT EXISTS cron (
          group_id text PRIMARY KEY,
          mute_at text default null,
          unmute_at text default null
        );
      `);
      console.log("La table 'cron' a été créée avec succès.");
    } catch (error) {
      console.error("Une erreur est survenue lors de la création de la table 'cron':", error);
    } finally {
      client.release();
    }
} ;

createTablecron();


async function getCron() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM cron');
    return result.rows;
  } catch (error) {
    console.error('Erreur lors de la récupération des données de la table "cron":', error);
  } finally {
    client.release();
  }
}  ;


async function addCron(group_id, rows, value) {
  const client = await pool.connect();

  try {
    
    let response = await client.query(`
      SELECT * FROM cron WHERE group_id = $1`, [group_id]);
      let exist = response.rows.length > 0 ;
if (exist) {

    await client.query(`
    UPDATE cron SET ${rows} = $1 WHERE group_id = $2 `, [value, group_id])

} else {
    const query = `
      INSERT INTO cron (group_id, ${rows}) 
      VALUES ($1, $2)`;

    await client.query(query, [group_id, value]);
  }
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la donnée dans la table "cron":', error);
  } finally {
    client.release();
  }
}


async function getCronById(group_id) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM cron WHERE group_id = $1', [group_id]);
    return result.rows[0];
  } catch (error) {
    console.error('Erreur lors de la récupération des données de la table "cron":', error);
  } finally {
    client.release();
  }
}

async function delCron(group_id) {
   const client = await pool.connect();
  try {
    await client.query('DELETE FROM cron WHERE group_id = $1', [group_id]);
  } catch (error) {
    console.error('Erreur lors de la suppression de la donnée dans la table "cron":', error);
  } finally {
    client.release();
  }
}

module.exports = {
          getCron,
          addCron,
          delCron,
          getCronById, }