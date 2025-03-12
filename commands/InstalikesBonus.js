
const { keith } = require('../keizzah/keith');
const axios = require('axios');
const path = require('path');
const conf = require('../set');
const { Pool } = require('pg');

// Instagram URL validation regex
const INSTAGRAM_URL_REGEX = /https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/([^/?#&]+)/;

// YoYoMedia API Configuration
const API_URL = 'https://yoyomedia.in/api/v2';
const API_KEY = process.env.YOYOMEDIA_API_KEY || conf.YOYOMEDIA_API_KEY || 'fe5714fe99697f402b7ebffb1a04336b7b197336b0f1fc466097e0afdfddee86';

// Service ID and quantity for likes
const SERVICE_ID = 11105;
const QUANTITY = 15;

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize database table if it doesn't exist
const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS claimed_users (
        id SERIAL PRIMARY KEY,
        user_number TEXT NOT NULL,
        instagram_link TEXT NOT NULL,
        order_id TEXT NOT NULL,
        claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database table initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Initialize the database when the file is loaded
initDatabase();

// Helper function to check if a user has claimed likes
const hasUserClaimed = async (userNumber) => {
  try {
    const result = await pool.query(
      'SELECT * FROM claimed_users WHERE user_number = $1',
      [userNumber]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking claimed user:', error);
    return false;
  }
};

// Helper function to save a new claimed user
const saveClaimedUser = async (user) => {
  try {
    await pool.query(
      'INSERT INTO claimed_users(user_number, instagram_link, order_id) VALUES($1, $2, $3)',
      [user.number, user.link, user.orderId]
    );
    return true;
  } catch (error) {
    console.error('Error saving claimed user:', error);
    return false;
  }
};

// Helper function to get all claimed users
const getClaimedUsers = async () => {
  try {
    const result = await pool.query(
      'SELECT user_number as number, instagram_link as link, order_id as "orderId", claimed_at as date FROM claimed_users ORDER BY claimed_at DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting claimed users:', error);
    return [];
  }
};

// Main .instalikes command
keith({
  nomCom: 'instalikes',
  aliases: ['freelikes', 'instagramlikes'],
  categorie: 'Instagram',
  reaction: '❤️'
}, async (chatId, zk, context) => {
  const { ms, repondre, arg, auteurMessage } = context;
  
  // Get the user's phone number (sender)
  const userNumber = auteurMessage.split('@')[0];
  
  // Get the Instagram link from arguments
  if (!arg[0]) {
    return repondre(`*Usage:* .instalikes [Instagram post/reel URL]\n\nExample: .instalikes https://www.instagram.com/p/xxxxx`);
  }
  
  const instagramLink = arg[0];
  
  // Validate the Instagram URL format
  if (!INSTAGRAM_URL_REGEX.test(instagramLink)) {
    return repondre("*Invalid Instagram link.* Please provide a valid public Instagram post or reel link.\n\nNote: Make sure your account is set to public in Instagram settings.");
  }
  
  // Check if the user has already claimed the free likes
  const alreadyClaimed = await hasUserClaimed(userNumber);
  
  if (alreadyClaimed) {
    return repondre(`*You have already claimed your free likes bonus!* 🚫\n\nContact the owner at: wa.me/254704897825 for more information.`);
  }
  
  // Show processing message
  await repondre("*Processing your free likes request...* ⏳");
  
  try {
    // Place the order via YoYoMedia API
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);
    formData.append('action', 'add');
    formData.append('service', SERVICE_ID);
    formData.append('link', instagramLink);
    formData.append('quantity', QUANTITY);
    
    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const data = response.data;
    
    if (data.order) {
      // Save the user as claimed in the database
      await saveClaimedUser({
        number: userNumber,
        link: instagramLink,
        orderId: data.order
      });
      
      // Send success message
      await zk.sendMessage(chatId, {
        text: `*🎉 Congratulations! You have received your free Instagram likes!*\n\n✅ Order ID: ${data.order}\n👤 For your Instagram post: ${instagramLink}\n❤️ Quantity: ${QUANTITY} likes\n\nContact owner at: wa.me/254704897825 for more information.`,
        contextInfo: {
          externalAdReply: {
            title: "Instagram Free Likes",
            body: "BELTAH-MD BOT",
            thumbnailUrl: conf.URL,
            sourceUrl: conf.GURL,
            mediaType: 1,
            showAdAttribution: true
          }
        }
      }, { quoted: ms });
      
    } else if (data.error) {
      repondre(`*Error:* ${data.error}\n\nPlease try again or contact the owner.`);
    }
    
  } catch (error) {
    console.error("Error placing order:", error);
    repondre("*Error:* Failed to process your request. Please ensure your Instagram account is public and try again later.");
  }
});

// Command to view claimed users (owner only)
keith({
  nomCom: 'claimedusers',
  aliases: ['viewclaimed', 'freelikeusers'],
  categorie: 'Owner',
  reaction: '📋'
}, async (chatId, zk, context) => {
  const { ms, repondre, superUser } = context;
  
  // Only allow bot owner to use this command
  if (!superUser) {
    return repondre("*This command is restricted to the bot owner*");
  }
  
  try {
    const claimedUsers = await getClaimedUsers();
    
    if (claimedUsers.length === 0) {
      return repondre("*No users have claimed free likes yet.*");
    }
    
    // Format the list of claimed users
    let message = `*Users Who Claimed Free Instagram Likes*\n\n`;
    claimedUsers.forEach((user, index) => {
      message += `*${index + 1}. User:* ${user.number}\n`;
      message += `   *Link:* ${user.link}\n`;
      message += `   *Order ID:* ${user.orderId}\n`;
      message += `   *Date:* ${new Date(user.date).toLocaleString()}\n\n`;
    });
    
    message += `Total: ${claimedUsers.length} users`;
    
    // Send the formatted message
    await zk.sendMessage(chatId, {
      text: message,
      contextInfo: {
        externalAdReply: {
          title: "Instagram Free Likes - Claimed Users",
          body: "BELTAH-MD BOT",
          thumbnailUrl: conf.URL,
          sourceUrl: conf.GURL,
          mediaType: 1,
          showAdAttribution: true
        }
      }
    }, { quoted: ms });
    
  } catch (error) {
    console.error("Error processing claimed users:", error);
    repondre("*Error:* Failed to retrieve the list of claimed users.");
  }
});
