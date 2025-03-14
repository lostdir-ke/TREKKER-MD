
const { keith } = require("../keizzah/keith");
const { getBroadcastProgress, saveBroadcastProgress } = require("../keizzah/broadcastUtils");

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

  const progressData = await getBroadcastProgress();

  if (progressData && progressData.isActive && !progressData.isPaused) {
    progressData.isPaused = true;
    progressData.pausedTimestamp = new Date().toISOString();

    const success = await saveBroadcastProgress(progressData);

    if (success) {
      await repondre(`⏸️ Database broadcast paused at contact ${progressData.currentIndex + 1}/${progressData.totalContacts}\nUse .dbresume to continue`);
    } else {
      await repondre("❌ Failed to pause the broadcast");
    }
  } else {
    await repondre("No active database broadcast found to pause");
  }
});
