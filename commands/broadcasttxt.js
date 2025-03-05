
const { keith } = require("../keizzah/keith");
const { Pool } = require("pg");
const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');
const s = require("../set");

// Database configuration
const dbUrl = s.DATABASE_URL ? s.DATABASE_URL : "postgresql://flashmd_user:JlUe2Vs0UuBGh0sXz7rxONTeXSOra9XP@dpg-cqbd04tumphs73d2706g-a/flashmd";
const proConfig = {
  connectionString: dbUrl,
  ssl: {
    rejectUnauthorized: false,
  },
};

const pool = new Pool(proConfig);

// Create broadcast logs table if it doesn't exist
async function createBroadcastLogsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS broadcast_logs (
        id SERIAL PRIMARY KEY,
        phone_number TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Broadcast logs table created or already exists");
  } catch (error) {
    console.error("Error creating broadcast logs table:", error);
  } finally {
    client.release();
  }
}

// Check if a number has already been messaged
async function hasBeenMessaged(phoneNumber) {
  const client = await pool.connect();
  try {
    const query = "SELECT EXISTS (SELECT 1 FROM broadcast_logs WHERE phone_number = $1)";
    const result = await client.query(query, [phoneNumber]);
    return result.rows[0].exists;
  } catch (error) {
    console.error("Error checking if number has been messaged:", error);
    return true; // Assume it's been messaged to prevent duplicates in case of error
  } finally {
    client.release();
  }
}

// Log a number as having been messaged
async function logMessaged(phoneNumber) {
  const client = await pool.connect();
  try {
    const query = "INSERT INTO broadcast_logs (phone_number) VALUES ($1)";
    await client.query(query, [phoneNumber]);
  } catch (error) {
    console.error("Error logging messaged number:", error);
  } finally {
    client.release();
  }
}

// Download contacts.txt from GitHub
async function downloadContactsTxt() {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/Beltah254/BELTAH-MD/main/contacts.txt');
    await fs.writeFile('contacts.txt', response.data);
    return true;
  } catch (error) {
    console.error('Error downloading contacts.txt:', error);
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

// Initialize table
createBroadcastLogsTable();

// Register broadcast2 command
keith({
  nomCom: 'broadcast2',
  aliase: 'txtsend',
  categorie: "Group",
  reaction: '📢'
}, async (bot, client, context) => {
  const { repondre, superUser } = context;

  if (!superUser) {
    return repondre("You are not authorized to use this command");
  }

  await repondre("Checking for contacts.txt file...");
  
  // Download contacts.txt from GitHub
  const downloaded = await downloadContactsTxt();
  if (!downloaded) {
    return repondre("Failed to download contacts.txt from GitHub. Please check the repository.");
  }
  
  await repondre("File is available! Now processing contacts...");
  
  try {
    const fileContent = await fs.readFile('contacts.txt', 'utf8');
    const contacts = parseContacts(fileContent);
    
    if (contacts.length === 0) {
      return repondre("No valid contacts found in the file.");
    }
    
    await repondre(`Found ${contacts.length} contacts. Starting broadcast process...`);
    
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
          await repondre(`Progress: ${i + 1}/${contacts.length} contacts processed\n` +
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
      
      // Progress update every 20 contacts
      if ((i + 1) % 20 === 0 || i === contacts.length - 1) {
        await repondre(`Progress: ${i + 1}/${contacts.length} contacts processed\n` +
                      `✅ Successful: ${successCount}\n` +
                      `📱 Registered on WhatsApp: ${registeredCount}\n` +
                      `❌ Not registered: ${notRegisteredCount}\n` +
                      `⏭️ Already messaged: ${alreadyMessagedCount}`);
      }
      
      // Random delay before next message
      if (i < contacts.length - 1) {
        const interval = getRandomInterval();
        await repondre(`Waiting ${Math.round(interval/1000)} seconds before next message...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    // Final report
    await repondre(`Broadcast completed!\n` +
                  `📊 Total contacts: ${contacts.length}\n` +
                  `✅ Successfully sent: ${successCount}\n` +
                  `📱 Registered on WhatsApp: ${registeredCount}\n` +
                  `❌ Not registered: ${notRegisteredCount}\n` +
                  `⏭️ Already messaged: ${alreadyMessagedCount}`);
                  
  } catch (error) {
    console.error('Error processing contacts:', error);
    repondre(`An error occurred: ${error.message}`);
  }
});
