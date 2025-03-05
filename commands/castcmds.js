
const { keith } = require("../keizzah/keith");

// Register castcmds command
keith({
  nomCom: 'castcmds',
  aliase: 'broadcastcommands',
  categorie: "Admin",
  reaction: '📜'
}, async (bot, client, context) => {
  const { repondre } = context;
  
  const message = `*📢 BROADCAST COMMANDS 📢*

*1. .broadcast2* or *.txtsend*
   Downloads contacts from GitHub contacts.txt
   Sends messages with random delays
   Logs sent numbers to prevent duplicate messages
   
*2. .broadcast*
   Original broadcast command for sending messages
   
*3. .wabroadcastresume* or *.resumebroadcast*
   Resumes a broadcast that was interrupted
   Continues from where it left off
   
*4. .resetlist* or *.clearbroadcastlogs*
   Clears the database of already messaged contacts
   Use with caution - requires confirmation
   
*5. .urlcontacts* or *.importcontacts*
   Imports verified contacts from URL
   Adds them to the "already messaged" list
   
*6. .databasecheck* or *.dbcheck*
   Checks if database connection is working
   Provides report on tables and saved data
   Shows broadcast statistics
   
These commands help manage mass message sending while avoiding duplicate messages and server overload.`;

  await repondre(message);
});
