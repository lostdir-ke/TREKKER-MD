const { keith } = require("../keizzah/keith");
const { resetBroadcastLogs, getBroadcastStats } = require("../keizzah/broadcastUtils");

// Register resetlist command
keith({
  nomCom: 'resetlist',
  aliase: 'clearbroadcastlogs',
  categorie: "Admin",
  reaction: '🗑️'
}, async (bot, client, context) => {
  const { repondre, superUser, arg } = context;

  if (!superUser) {
    return repondre("You are not authorized to use this command");
  }

  try {
    // Get count before deletion
    const stats = await getBroadcastStats();
    const count = stats.totalMessaged || 0;

    // Confirm deletion if requested
    if (arg[0] === "confirm") {
      // Delete all records
      const success = await resetBroadcastLogs();

      if (success) {
        await repondre(`✅ Successfully cleared broadcast logs!\n📊 Removed ${count} contact(s) from the database.\n\nFuture broadcasts will now send messages to all contacts.`);
      } else {
        await repondre(`❌ Failed to clear broadcast logs from database.`);
      }
    } else {
      // Ask for confirmation
      await repondre(`⚠️ WARNING: You are about to clear ${count} contact(s) from the broadcast logs.\n\nThis means future broadcasts will send messages to these contacts again.\n\nTo confirm, type: .resetlist confirm`);
    }
  } catch (error) {
    console.error("Error resetting broadcast logs:", error);
    repondre(`An error occurred: ${error.message}`);
  }
});