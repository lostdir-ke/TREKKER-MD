const fs = require('fs-extra');
const path = require('path');

// Function to check if there's an active broadcast to resume
async function checkActiveBroadcast() {
  const progressFiles = [
    'broadcast_progress.json',
    'attached_assets/broadcast_progress.json'
  ];

  // Check each progress file
  for (const file of progressFiles) {
    if (await fs.pathExists(file)) {
      try {
        const progressData = await fs.readJSON(file);
        // Check if broadcast is active and not completed
        if (progressData.isActive && progressData.currentIndex < progressData.totalContacts) {
          console.log(`Found active broadcast in ${file}, will resume automatically`);
          return true;
        }
      } catch (error) {
        console.error(`Error checking broadcast in ${file}:`, error);
      }
    }
  }

  return false;
}

// Function to automatically resume broadcast
async function autoBroadcastResume(client, context) {
  try {
    const isActive = await checkActiveBroadcast();

    if (isActive) {
      console.log("Auto-resuming broadcast after connection...");

      // Create a fake context object
      const fakeContext = {
        repondre: (msg) => console.log(`[AutoBroadcast] ${msg}`),
        superUser: true,
        msg: null // This indicates it's called programmatically
      };

      // Get the wabroadcastresume command function
      const wabroadcastresume = require('./commands/wabroadcastresume');

      // Call the command function directly
      await wabroadcastresume.keith.execution(null, client, fakeContext);

      return true;
    }
  } catch (error) {
    console.error("Error auto-resuming broadcast:", error);
  }

  return false;
}

module.exports = { autoBroadcastResume };