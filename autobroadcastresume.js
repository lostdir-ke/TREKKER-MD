
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
        // Check if broadcast is active and not paused
        if (progressData.isActive && !progressData.isPaused) {
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
async function autoBroadcastResume(client) {
  const isActive = await checkActiveBroadcast();
  
  if (isActive) {
    console.log("Auto-resuming broadcast...");
    // Simulate the wabroadcastresume command
    const wabroadcastresume = require('./commands/wabroadcastresume');
    
    // Create a context object similar to what the command expects
    const fakeContext = {
      repondre: (msg) => console.log(`[AutoBroadcast] ${msg}`),
      superUser: true,
      arg: ""
    };
    
    // Execute the command function
    try {
      // Import the wabroadcastresume command
      const { keith } = require('./keizzah/keith');
      
      // Find the command in the commands collection
      const commands = keith.getCommands();
      const resumeCommand = commands.find(cmd => 
        cmd.name === 'wabroadcastresume' || 
        (cmd.aliase && cmd.aliase.includes('resumebroadcast'))
      );
      
      if (resumeCommand && resumeCommand.execution) {
        await resumeCommand.execution(null, client, fakeContext);
        return true;
      }
    } catch (error) {
      console.error("Error auto-resuming broadcast:", error);
    }
  }
  
  return false;
}

module.exports = { autoBroadcastResume };
