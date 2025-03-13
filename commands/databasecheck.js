const { keith } = require('../keizzah/keith');
const { pool } = require('../database/db');

keith({
  nomCom: "databasecheck",
  categorie: "superuser"
}, async (origineMessage, superUser, client, arg) => {
  if (!superUser) return origineMessage.reply('This command is for superusers only');

  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      const dbUrl = "postgresql://admin:Otw6EXTII3nY7JbC0Y6tOGtLZvz4eCaD@dpg-cv86okd2ng1s73ecvd60-a.oregon-postgres.render.com/trekker2";

      // Mask the password for display
      const maskedUrl = maskDatabaseUrl(dbUrl);

      origineMessage.reply(`✅ Database connection successful!\nTime: ${result.rows[0].now}\nConnection: ${maskedUrl}`);
    } finally {
      client.release();
    }
  } catch (error) {
    origineMessage.reply(`❌ Database connection failed: ${error.message}`);
  }
});

// Function to mask sensitive parts of the database URL
function maskDatabaseUrl(url) {
  try {
    // Simple regex-based approach to mask the password
    return url.replace(/\/\/([^:]+):([^@]+)@/, '//\$1:****@');
  } catch (e) {
    return "Error masking URL";
  }
}