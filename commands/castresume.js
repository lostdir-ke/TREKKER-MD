const { keith } = require("../keizzah/keith");
const { getBroadcastProgress, saveBroadcastProgress } = require("../keizzah/broadcastUtils");

// Register command to resume paused broadcast
keith({
  nomCom: 'castresume',
  aliase: 'resumebroadcast',
  categorie: "Admin",
  reaction: '▶️'
}, async (bot, client, context) => {
  const { repondre, superUser } = context;

  if (!superUser) {
    return repondre("You are not authorized to use this command");
  }

  // Get current progress
  const progressData = await getBroadcastProgress();

  if (progressData && progressData.isPaused) {
    // Update progress data
    progressData.isPaused = false;
    progressData.isActive = true;
    progressData.resumedTimestamp = new Date().toISOString();

    // Save the updated progress data
    const success = await saveBroadcastProgress(progressData);

    if (success) {
      await repondre(`▶️ Resumed the paused broadcast. Use \`.broadcast2\` to continue sending messages.`);
    } else {
      await repondre("❌ Failed to resume the broadcast. Please try again.");
    }
  } else {
    await repondre("No paused broadcasts found to resume.");
  }
});