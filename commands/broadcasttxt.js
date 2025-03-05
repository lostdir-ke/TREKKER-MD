
const { keith } = require("../keizzah/keith");
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');
const s = require("../set");
const GitHubAPI = require("../keizzah/github");

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_API || "";
const GITHUB_OWNER = "Beltah254";
const GITHUB_REPO = "BELTAH-MD";
const GITHUB_BRANCH = "main";

// Initialize GitHub API
const github = new GitHubAPI(GITHUB_TOKEN);

// Local storage for broadcast logs
const BROADCAST_LOGS_FILE = 'broadcast_logs.json';

// Initialize broadcast logs file if it doesn't exist
async function initBroadcastLogs() {
  try {
    if (!await fs.pathExists(BROADCAST_LOGS_FILE)) {
      await fs.writeJSON(BROADCAST_LOGS_FILE, []);
    }
    
    // Try to sync with GitHub
    await syncWithGitHub();
    
    console.log("Broadcast logs initialized");
    return true;
  } catch (error) {
    console.error("Error initializing broadcast logs:", error);
    return false;
  }
}

// Sync local broadcast logs with GitHub
async function syncWithGitHub() {
  try {
    // Sync broadcast logs
    const count = await github.syncBroadcastLogs(GITHUB_OWNER, GITHUB_REPO, BROADCAST_LOGS_FILE, GITHUB_BRANCH);
    if (count >= 0) {
      console.log(`Synced ${count} broadcast logs with GitHub`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error syncing with GitHub:", error);
    return false;
  }
}

// Check if a number has already been messaged
async function hasBeenMessaged(phoneNumber) {
  try {
    if (!await fs.pathExists(BROADCAST_LOGS_FILE)) {
      return false;
    }
    
    const logs = await fs.readJSON(BROADCAST_LOGS_FILE);
    return logs.some(log => log.phone_number === phoneNumber);
  } catch (error) {
    console.error("Error checking if number has been messaged:", error);
    return true; // Assume it's been messaged to prevent duplicates in case of error
  }
}

// Log a number as having been messaged
async function logMessaged(phoneNumber) {
  try {
    let logs = [];
    if (await fs.pathExists(BROADCAST_LOGS_FILE)) {
      logs = await fs.readJSON(BROADCAST_LOGS_FILE);
    }
    
    // Add new log
    logs.push({
      phone_number: phoneNumber,
      timestamp: new Date().toISOString()
    });
    
    // Save locally
    await fs.writeJSON(BROADCAST_LOGS_FILE, logs);
    
    // Update on GitHub
    await github.updateFile(
      GITHUB_OWNER,
      GITHUB_REPO,
      BROADCAST_LOGS_FILE,
      JSON.stringify(logs, null, 2),
      `Add ${phoneNumber} to broadcast logs`,
      GITHUB_BRANCH
    );
    
    return true;
  } catch (error) {
    console.error("Error logging messaged number:", error);
    return false;
  }
}

// Download file from GitHub
async function downloadFromGitHub(filename) {
  try {
    return await github.downloadFile(GITHUB_OWNER, GITHUB_REPO, filename, filename, GITHUB_BRANCH);
  } catch (error) {
    console.error(`Error downloading ${filename}:`, error);
    return false;
  }
}

// Upload file to GitHub
async function uploadToGitHub(filename, message) {
  try {
    if (!await fs.pathExists(filename)) {
      console.error(`File ${filename} does not exist locally`);
      return false;
    }
    
    const content = await fs.readFile(filename, 'utf8');
    const result = await github.updateFile(
      GITHUB_OWNER,
      GITHUB_REPO,
      filename,
      content,
      message,
      GITHUB_BRANCH
    );
    
    return !!result;
  } catch (error) {
    console.error(`Error uploading ${filename}:`, error);
    return false;
  }
}

// Parse contacts.txt
function parseContacts(content) {
  const lines = content.split('\n');
  const contacts = [];
  
  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (!line) continue;
    
    const lastComma = line.lastIndexOf(',');
    if (lastComma !== -1) {
      const name = line.substring(0, lastComma).trim();
      let phoneNumber = line.substring(lastComma + 1).trim();
      
      // Clean phone number
      phoneNumber = phoneNumber.replace(/\+/g, '').replace(/\s+/g, '');
      
      if (phoneNumber) {
        contacts.push({ name, phoneNumber });
      }
    }
  }
  
  return contacts;
}

// Check if number is registered on WhatsApp
async function isRegisteredOnWhatsApp(client, phoneNumber) {
  try {
    const [result] = await client.onWhatsApp(phoneNumber + "@s.whatsapp.net");
    return result && result.exists;
  } catch (error) {
    console.error(`Error checking if ${phoneNumber} is registered:`, error);
    return false;
  }
}

// Get random interval between messages
function getRandomInterval() {
  // Random interval between 30 seconds and 1.8 minutes (108 seconds)
  return Math.floor(Math.random() * (108000 - 30000 + 1) + 30000);
}

// Save progress state locally and to GitHub
async function saveProgress(currentIndex, contacts, stats = {}) {
  try {
    const progressData = {
      currentIndex,
      timestamp: new Date().toISOString(),
      totalContacts: contacts.length,
      stats: stats,
      isActive: true
    };
    
    // Save locally
    await fs.writeJSON('broadcast_progress.json', progressData);
    
    // Also save to GitHub repository structure
    await fs.ensureDir('attached_assets');
    await fs.writeJSON('attached_assets/broadcast_progress.json', progressData);
    
    // Attempt to upload to GitHub
    // uploadToGitHub('attached_assets/broadcast_progress.json', 'Update broadcast progress');
    
    return true;
  } catch (error) {
    console.error("Error saving progress:", error);
    return false;
  }
}

// Read progress state, prioritizing GitHub version if available
async function readProgress() {
  try {
    // Try to download latest progress from GitHub
    const downloaded = await downloadFromGitHub('attached_assets/broadcast_progress.json');
    
    // Check for local file
    if (await fs.pathExists('broadcast_progress.json')) {
      return await fs.readJSON('broadcast_progress.json');
    }
    
    // Check for file in attached_assets
    if (await fs.pathExists('attached_assets/broadcast_progress.json')) {
      return await fs.readJSON('attached_assets/broadcast_progress.json');
    }
    
    return null;
  } catch (error) {
    console.error("Error reading progress:", error);
    return null;
  }
}

// Sync contacts from GitHub verified contacts
async function syncGitHubContactsToVerified() {
  try {
    // Try to download verified_contacts.txt from GitHub
    const downloaded = await downloadFromGitHub('verified_contacts.txt');
    if (!downloaded) {
      console.log("No verified_contacts.txt found on GitHub");
      return 0;
    }
    
    if (!(await fs.pathExists('verified_contacts.txt'))) {
      console.log("Failed to download verified_contacts.txt");
      return 0;
    }
    
    const fileContent = await fs.readFile('verified_contacts.txt', 'utf8');
    const contacts = parseContacts(fileContent);
    
    let syncCount = 0;
    for (const contact of contacts) {
      // Only add if not already logged
      if (!(await hasBeenMessaged(contact.phoneNumber))) {
        await logMessaged(contact.phoneNumber);
        syncCount++;
      }
    }
    
    // Update logs on GitHub
    await syncWithGitHub();
    
    console.log(`Synced ${syncCount} contacts from GitHub to verified list`);
    return syncCount;
  } catch (error) {
    console.error("Error syncing contacts:", error);
    return 0;
  }
}

// Initialize broadcast logs
initBroadcastLogs();

// Register broadcast2 command
keith({
  nomCom: 'broadcast2',
  aliase: 'txtsend',
  categorie: "Group",
  reaction: '📢'
}, async (bot, client, context) => {
  const { repondre, superUser, arg } = context;

  if (!superUser) {
    return repondre("You are not authorized to use this command");
  }
  
  await repondre("🔄 Initializing broadcast...");
  
  // Check for and process any GitHub progress
  await repondre("🔍 Checking for existing progress on GitHub...");
  
  // Sync contacts from GitHub to verified list
  const syncedCount = await syncGitHubContactsToVerified();
  if (syncedCount > 0) {
    await repondre(`✅ Synced ${syncedCount} verified contacts from GitHub to database`);
  }
  
  // Check if there's a progress file
  const progress = await readProgress();
  if (progress && progress.isActive && !arg.includes("restart")) {
    await repondre(`📝 Found an active broadcast in progress from ${new Date(progress.timestamp).toLocaleString()}.\n\nResuming from contact ${progress.currentIndex + 1}/${progress.totalContacts}\n\nTo restart instead, use: .broadcast2 restart`);
    
    // Resume broadcast...
    try {
      // Download contacts.txt from GitHub
      await repondre("📥 Downloading latest contacts from GitHub...");
      const downloadedContacts = await downloadFromGitHub('contacts.txt');
      
      if (!downloadedContacts) {
        return repondre("❌ Failed to download contacts.txt from GitHub. Please check the repository.");
      }
      
      // Process contacts and resume from saved index
      const fileContent = await fs.readFile('contacts.txt', 'utf8');
      const contacts = parseContacts(fileContent);
      
      if (contacts.length === 0) {
        return repondre("❌ No valid contacts found in the file.");
      }
      
      // Make sure the index is valid
      if (progress.currentIndex >= contacts.length) {
        return repondre(`❌ Saved progress index (${progress.currentIndex}) is invalid for contact list with ${contacts.length} contacts.\n\nPlease use .broadcast2 restart to start over.`);
      }
      
      await repondre(`📊 Resuming broadcast from contact ${progress.currentIndex + 1}/${contacts.length}...`);
      
      // Initialize stats
      let successCount = progress.stats?.successCount || 0;
      let registeredCount = progress.stats?.registeredCount || 0;
      let notRegisteredCount = progress.stats?.notRegisteredCount || 0;
      let alreadyMessagedCount = progress.stats?.alreadyMessagedCount || 0;
      
      // Resume from the saved index
      for (let i = progress.currentIndex; i < contacts.length; i++) {
        const contact = contacts[i];
        
        // Check if already messaged
        const alreadyMessaged = await hasBeenMessaged(contact.phoneNumber);
        if (alreadyMessaged) {
          alreadyMessagedCount++;
          console.log(`Skipping ${contact.phoneNumber} - already messaged`);
          
          // Progress update every 20 contacts
          if ((i + 1) % 20 === 0 || i === contacts.length - 1) {
            await repondre(`📊 Progress: ${i + 1}/${contacts.length} contacts processed\n` +
                        `✅ Successful: ${successCount}\n` +
                        `📱 Registered on WhatsApp: ${registeredCount}\n` +
                        `❌ Not registered: ${notRegisteredCount}\n` +
                        `⏭️ Already messaged: ${alreadyMessagedCount}`);
          }
          continue;
        }
        
        // Check if registered on WhatsApp
        const isRegistered = await isRegisteredOnWhatsApp(client, contact.phoneNumber);
        
        if (isRegistered) {
          registeredCount++;
          
          // Format name properly (first name or full name)
          const firstName = contact.name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
          const displayName = firstName || contact.name || "there";
          
          // Compose message
          const message = `Hello ${displayName}! I'm NICHOLAS, another status viewer. Can we be friends? Please save my number. Your contact is already saved in my phone.`;
          
          try {
            // Send message
            await client.sendMessage(contact.phoneNumber + "@s.whatsapp.net", { text: message });
            successCount++;
            
            // Log as messaged
            await logMessaged(contact.phoneNumber);
            
            console.log(`Message sent to ${contact.phoneNumber} (${contact.name})`);
          } catch (error) {
            console.error(`Failed to send message to ${contact.phoneNumber}:`, error);
          }
        } else {
          notRegisteredCount++;
          console.log(`${contact.phoneNumber} is not registered on WhatsApp`);
        }
        
        // Save progress after each contact with updated stats
        const stats = {
          successCount,
          registeredCount,
          notRegisteredCount,
          alreadyMessagedCount
        };
        await saveProgress(i + 1, contacts, stats);
        
        // Progress update every 20 contacts
        if ((i + 1) % 20 === 0 || i === contacts.length - 1) {
          await repondre(`📊 Progress: ${i + 1}/${contacts.length} contacts processed\n` +
                        `✅ Successful: ${successCount}\n` +
                        `📱 Registered on WhatsApp: ${registeredCount}\n` +
                        `❌ Not registered: ${notRegisteredCount}\n` +
                        `⏭️ Already messaged: ${alreadyMessagedCount}`);
        }
        
        // Random delay before next message
        if (i < contacts.length - 1) {
          const interval = getRandomInterval();
          await repondre(`⏱️ Waiting ${Math.round(interval/1000)} seconds before next message...`);
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      }
      
      // Final report
      await repondre(`🎉 Broadcast completed!\n` +
                    `📊 Total contacts: ${contacts.length}\n` +
                    `✅ Successfully sent: ${successCount}\n` +
                    `📱 Registered on WhatsApp: ${registeredCount}\n` +
                    `❌ Not registered: ${notRegisteredCount}\n` +
                    `⏭️ Already messaged: ${alreadyMessagedCount}`);
      
      // Mark as inactive
      const finalProgressData = {
        currentIndex: contacts.length,
        timestamp: new Date().toISOString(),
        totalContacts: contacts.length,
        stats: {
          successCount,
          registeredCount,
          notRegisteredCount,
          alreadyMessagedCount
        },
        isActive: false
      };
      
      await fs.writeJSON('broadcast_progress.json', finalProgressData);
      await fs.ensureDir('attached_assets');
      await fs.writeJSON('attached_assets/broadcast_progress.json', finalProgressData);
      
    } catch (error) {
      console.error('Error resuming broadcast:', error);
      repondre(`❌ An error occurred while resuming: ${error.message}`);
    }
    
    return;
  }
  
  // Start new broadcast
  await repondre("🔍 Checking for contacts.txt file...");
  
  // Download contacts.txt from GitHub
  const downloaded = await downloadFromGitHub('contacts.txt');
  if (!downloaded) {
    return repondre("❌ Failed to download contacts.txt from GitHub. Please check the repository.");
  }
  
  await repondre("✅ File is available! Now processing contacts...");
  
  try {
    const fileContent = await fs.readFile('contacts.txt', 'utf8');
    const contacts = parseContacts(fileContent);
    
    if (contacts.length === 0) {
      return repondre("❌ No valid contacts found in the file.");
    }
    
    await repondre(`📊 Found ${contacts.length} contacts. Starting new broadcast process...`);
    
    // Initialize empty progress
    await saveProgress(0, contacts, {
      successCount: 0,
      registeredCount: 0,
      notRegisteredCount: 0,
      alreadyMessagedCount: 0
    });
    
    let successCount = 0;
    let registeredCount = 0;
    let notRegisteredCount = 0;
    let alreadyMessagedCount = 0;
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      
      // Check if already messaged
      const alreadyMessaged = await hasBeenMessaged(contact.phoneNumber);
      if (alreadyMessaged) {
        alreadyMessagedCount++;
        console.log(`Skipping ${contact.phoneNumber} - already messaged`);
        
        // Progress update every 20 contacts
        if ((i + 1) % 20 === 0 || i === contacts.length - 1) {
          await repondre(`📊 Progress: ${i + 1}/${contacts.length} contacts processed\n` +
                        `✅ Successful: ${successCount}\n` +
                        `📱 Registered on WhatsApp: ${registeredCount}\n` +
                        `❌ Not registered: ${notRegisteredCount}\n` +
                        `⏭️ Already messaged: ${alreadyMessagedCount}`);
        }
        continue;
      }
      
      // Check if registered on WhatsApp
      const isRegistered = await isRegisteredOnWhatsApp(client, contact.phoneNumber);
      
      if (isRegistered) {
        registeredCount++;
        
        // Format name properly (first name or full name)
        const firstName = contact.name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
        const displayName = firstName || contact.name || "there";
        
        // Compose message
        const message = `Hello ${displayName}! I'm NICHOLAS, another status viewer. Can we be friends? Please save my number. Your contact is already saved in my phone.`;
        
        try {
          // Send message
          await client.sendMessage(contact.phoneNumber + "@s.whatsapp.net", { text: message });
          successCount++;
          
          // Log as messaged
          await logMessaged(contact.phoneNumber);
          
          console.log(`Message sent to ${contact.phoneNumber} (${contact.name})`);
        } catch (error) {
          console.error(`Failed to send message to ${contact.phoneNumber}:`, error);
        }
      } else {
        notRegisteredCount++;
        console.log(`${contact.phoneNumber} is not registered on WhatsApp`);
      }
      
      // Save progress after each contact with updated stats
      const stats = {
        successCount,
        registeredCount,
        notRegisteredCount,
        alreadyMessagedCount
      };
      await saveProgress(i + 1, contacts, stats);
      
      // Progress update every 20 contacts
      if ((i + 1) % 20 === 0 || i === contacts.length - 1) {
        await repondre(`📊 Progress: ${i + 1}/${contacts.length} contacts processed\n` +
                      `✅ Successful: ${successCount}\n` +
                      `📱 Registered on WhatsApp: ${registeredCount}\n` +
                      `❌ Not registered: ${notRegisteredCount}\n` +
                      `⏭️ Already messaged: ${alreadyMessagedCount}`);
      }
      
      // Random delay before next message
      if (i < contacts.length - 1) {
        const interval = getRandomInterval();
        await repondre(`⏱️ Waiting ${Math.round(interval/1000)} seconds before next message...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    // Final report
    await repondre(`🎉 Broadcast completed!\n` +
                  `📊 Total contacts: ${contacts.length}\n` +
                  `✅ Successfully sent: ${successCount}\n` +
                  `📱 Registered on WhatsApp: ${registeredCount}\n` +
                  `❌ Not registered: ${notRegisteredCount}\n` +
                  `⏭️ Already messaged: ${alreadyMessagedCount}`);
    
    // Mark as inactive in progress file
    const finalProgressData = {
      currentIndex: contacts.length,
      timestamp: new Date().toISOString(),
      totalContacts: contacts.length,
      stats: {
        successCount,
        registeredCount,
        notRegisteredCount,
        alreadyMessagedCount
      },
      isActive: false
    };
    
    await fs.writeJSON('broadcast_progress.json', finalProgressData);
    await fs.ensureDir('attached_assets');
    await fs.writeJSON('attached_assets/broadcast_progress.json', finalProgressData);
    
  } catch (error) {
    console.error('Error processing contacts:', error);
    repondre(`❌ An error occurred: ${error.message}`);
  }
});
