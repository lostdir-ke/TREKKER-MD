
const { keith } = require("../keizzah/keith");
const { getBroadcastProgress, saveBroadcastProgress } = require("../keizzah/broadcastUtils");

keith({
  nomCom: 'dbresume',
  aliase: 'resumedbbroadcast',
  categorie: "Admin",
  reaction: '▶️'
}, async (bot, client, context) => {
  const { repondre, superUser } = context;

  if (!superUser && context.msg) {
    return repondre("You are not authorized to use this command");
  }

  const isAutomatic = !context.msg;
  const progressData = await getBroadcastProgress();

  if (progressData && (progressData.isPaused || progressData.isActive)) {
    progressData.isPaused = false;
    progressData.isActive = true;
    progressData.resumedTimestamp = new Date().toISOString();

    const success = await saveBroadcastProgress(progressData);

    if (success) {
      await repondre(`▶️ Database broadcast resumed from contact ${progressData.currentIndex + 1}/${progressData.totalContacts}`);
      
      // Execute dbcast command to continue
      const dbcastCommand = require('./dbcast');
      await dbcastCommand.keith.execution(bot, client, {
        ...context,
        arg: [progressData.currentIndex.toString()]
      });
    } else {
      await repondre("❌ Failed to resume the broadcast");
    }
  } else {
    await repondre("No paused database broadcast found to resume");
  }
});
