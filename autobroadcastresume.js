const fs = require('fs-extra');
const { getBroadcastProgress, saveBroadcastProgress } = require('./keizzah/broadcastUtils');

// Hard-coded database URL
const DATABASE_URL = 'postgresql://admin:Otw6EXTII3nY7JbC0Y6tOGtLZvz4eCaD@dpg-cv86okd2ng1s73ecvd60-a.oregon-postgres.render.com/trekker2';

// Function to automatically resume broadcast
async function autoBroadcastResume(client) {
  try {
    console.log("Checking for paused or interrupted broadcasts to resume...");

    // Get current progress
    const progressData = await getBroadcastProgress();

    if (progressData && progressData.isActive && !progressData.isPaused) {
      console.log("Found active broadcast that was interrupted. Preparing to resume...");

      // Create a fake context object
      const fakeContext = {
        repondre: (msg) => console.log(`[AutoBroadcast] ${msg}`),
        superUser: true,
        msg: null // This indicates it's called programmatically
      };

      // Get the castresume command module
      const resumeCommand = require('./commands/dbresume');

      // Execute the command
      await resumeCommand.keith.execution(null, client, fakeContext);

      console.log("Auto-resumed broadcast successfully!");
      return true;
    } else if (progressData && progressData.isPaused) {
      console.log("Found a paused broadcast. Will not auto-resume as it was manually paused with .castpause");
    } else {
      console.log("No active broadcast found to resume");
    }
  } catch (error) {
    console.error("Error auto-resuming broadcast:", error);
  }

  return false;
}

module.exports = { autoBroadcastResume };