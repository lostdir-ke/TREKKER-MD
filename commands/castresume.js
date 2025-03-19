const { keith } = require("../keizzah/keith");
const { getBroadcastProgress, saveBroadcastProgress } = require("../keizzah/broadcastUtils");

// Register command to resume paused broadcast
const resumeCommand = keith({
  nomCom: 'castresume',
  aliase: 'resumebroadcast',
  categorie: "Admin",
  reaction: '▶️'
}, async (bot, client, context) => {
  const { repondre, superUser } = context;

  // Skip superUser check if called programmatically
  if (!superUser && context.msg) {
    return repondre("You are not authorized to use this command");
  }

  // Check if this is a programmatic call
  const isAutomatic = !context.msg;
  const logMessage = isAutomatic ? 
    (msg) => console.log(`[AutoBroadcast] ${msg}`) : 
    repondre;

  // Get current progress
  const progressData = await getBroadcastProgress();

  if (progressData && (progressData.isPaused || progressData.isActive)) {
    // Update progress data to resume
    progressData.isPaused = false;
    progressData.isActive = true;
    progressData.resumedTimestamp = new Date().toISOString();

    // Save the updated progress data
    const success = await saveBroadcastProgress(progressData);

    if (success) {
      await logMessage(`▶️ ${isAutomatic ? 'Automatically resumed' : 'Resumed'} the broadcast. Current progress: ${progressData.currentIndex + 1}/${progressData.totalContacts} contacts.`);

      // Execute the broadcast command to continue sending
      if (isAutomatic) {
        const broadcastCommand = require('./broadcasttxt');
        await broadcastCommand.keith.execution(bot, client, context);
      } else {
        await logMessage(`Use \`.broadcast2\` to continue sending messages.`);
      }
    } else {
      await logMessage("❌ Failed to resume the broadcast. Please try again.");
    }
  } else {
    await logMessage("No paused or active broadcasts found to resume.");
  }
});

module.exports = resumeCommand;