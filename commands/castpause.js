const { keith } = require("../keizzah/keith");
const { getBroadcastProgress, saveBroadcastProgress } = require("../keizzah/broadcastUtils");

// Register command to pause broadcast
keith({
  nomCom: 'castpause',
  aliase: 'pausebroadcast',
  categorie: "Admin",
  reaction: '⏸️'
}, async (bot, client, context) => {
  const { repondre, superUser } = context;

  if (!superUser) {
    return repondre("You are not authorized to use this command");
  }

  // Get current progress
  const progressData = await getBroadcastProgress();

  if (progressData && progressData.isActive && !progressData.isPaused) {
    // Update progress data
    progressData.isPaused = true;
    progressData.pausedTimestamp = new Date().toISOString();

    // Save the updated progress data
    const success = await saveBroadcastProgress(progressData);

    if (success) {
      await repondre(`⏸️ Paused the active broadcast. Use \`.castresume\` to continue the broadcast.`);
    } else {
      await repondre("❌ Failed to pause the broadcast. Please try again.");
    }
  } else {
    await repondre("No active broadcasts found to pause.");
  }
});