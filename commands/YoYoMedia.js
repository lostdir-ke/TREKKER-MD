
const { keith } = require('../keizzah/keith');
const axios = require('axios');
const conf = require('../set');

// YoYoMedia API Configuration
const API_URL = 'https://yoyomedia.in/api/v2';
const API_KEY = process.env.YOYOMEDIA_API_KEY || conf.YOYOMEDIA_API_KEY || 'fe5714fe99697f402b7ebffb1a04336b7b197336b0f1fc466097e0afdfddee86';

// Check YoYoMedia account balance
keith({
  nomCom: 'yoyobalance',
  aliases: ['yoyo-balance', 'balance'],
  categorie: 'YoYoMedia',
  reaction: '💰'
}, async (chatId, zk, context) => {
  const { ms, repondre, superUser } = context;
  
  // Only allow bot owner to use this command
  if (!superUser) {
    return repondre("*This command is restricted to the bot owner*");
  }
  
  try {
    // Log API key being used (for debugging)
    console.log(`Using API key: ${API_KEY.substring(0, 10)}...`);
    
    // Log the request for debugging
    console.log("Sending request to:", API_URL);
    console.log("Request data:", { key: API_KEY.substring(0, 10) + "...", action: 'balance' });
    
    // Try with form-data format instead of JSON
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);
    formData.append('action', 'balance');
    
    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const data = response.data;
    console.log("API response:", JSON.stringify(data));
    
    // Handle different response formats
    if (data.status === false && data.error) {
      return repondre(`*Error:* ${data.error}`);
    }
    
    // Check if response contains balance
    if (!data || (data.balance === undefined && !data.error)) {
      return repondre("*API Response:* " + JSON.stringify(data).substring(0, 200) + "\n\nPlease check API key or contact provider.");
    }
    
    // Set currency to default value if not provided
    const currency = data.currency || "INR";
    
    await zk.sendMessage(chatId, {
      text: `*YoYoMedia Account Balance*\n\n💰 Balance: ${data.balance} ${currency}`,
      contextInfo: {
        externalAdReply: {
          title: "YoYoMedia API",
          body: "BELTAH-MD BOT",
          thumbnailUrl: conf.URL,
          sourceUrl: conf.GURL,
          mediaType: 1,
          showAdAttribution: true
        }
      }
    }, { quoted: ms });
    
  } catch (error) {
    console.error("Error fetching balance:", error.response?.data || error.message);
    
    // Provide more detailed error message
    if (error.response) {
      repondre(`*API Error:* Status ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      repondre("*Network Error:* No response received from API server. Check your internet connection.");
    } else {
      repondre(`*Error:* ${error.message}. Failed to fetch account balance.`);
    }
  }
});

// Get YoYoMedia services list
keith({
  nomCom: 'yoyoservices',
  aliases: ['yoyo-services', 'services'],
  categorie: 'YoYoMedia',
  reaction: '📋'
}, async (chatId, zk, context) => {
  const { ms, repondre, superUser, arg } = context;
  
  // Only allow bot owner to use this command
  if (!superUser) {
    return repondre("*This command is restricted to the bot owner*");
  }
  
  try {
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);
    formData.append('action', 'services');
    
    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const data = response.data;
    
    // Filter by category if provided
    const categoryFilter = arg.length > 0 ? arg.join(' ').toLowerCase() : null;
    let filteredServices = data;
    
    if (categoryFilter) {
      filteredServices = data.filter(service => 
        service.Category && service.Category.toLowerCase().includes(categoryFilter)
      );
      
      if (filteredServices.length === 0) {
        return repondre(`No services found for category: *${categoryFilter}*`);
      }
    }
    
    // Only show first 10 services to avoid message too long
    const servicesToShow = filteredServices.slice(0, 10);
    
    let servicesText = `*YoYoMedia Services*\n${categoryFilter ? `Category Filter: *${categoryFilter}*\n` : ''}${filteredServices.length > 10 ? `Showing 10/${filteredServices.length} services\n` : ''}\n`;
    
    servicesToShow.forEach((service, index) => {
      servicesText += `*${index + 1}. ${service.name}*\n`;
      servicesText += `   ID: ${service.service || service.services}\n`;
      servicesText += `   Rate: $${service.rate}\n`;
      servicesText += `   Min: ${service.min} | Max: ${service.max}\n`;
      servicesText += `   Type: ${service.type}\n\n`;
    });
    
    if (filteredServices.length > 10) {
      servicesText += `\n_Use '.yoyoservices [category]' to filter services by category_`;
    }
    
    await zk.sendMessage(chatId, {
      text: servicesText,
      contextInfo: {
        externalAdReply: {
          title: "YoYoMedia API",
          body: "BELTAH-MD BOT",
          thumbnailUrl: conf.URL,
          sourceUrl: conf.GURL,
          mediaType: 1,
          showAdAttribution: true
        }
      }
    }, { quoted: ms });
    
  } catch (error) {
    console.error("Error fetching services:", error);
    repondre("*Error:* Failed to fetch services list. Please try again later.");
  }
});

// Add new YoYoMedia order
keith({
  nomCom: 'yoyoorder',
  aliases: ['order', 'yoyo-order'],
  categorie: 'YoYoMedia',
  reaction: '🛒'
}, async (chatId, zk, context) => {
  const { ms, repondre, superUser, arg } = context;
  
  // Only allow bot owner to use this command
  if (!superUser) {
    return repondre("*This command is restricted to the bot owner*");
  }
  
  if (arg.length < 3) {
    return repondre(`*Usage:* .yoyoorder [service_id] [link] [quantity]\n\nExample: .yoyoorder 1 https://instagram.com/username 1000`);
  }
  
  const serviceId = arg[0];
  const link = arg[1];
  const quantity = arg[2];
  
  if (isNaN(serviceId) || isNaN(quantity)) {
    return repondre("Service ID and quantity must be numbers");
  }
  
  try {
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);
    formData.append('action', 'add');
    formData.append('service', serviceId);
    formData.append('link', link);
    formData.append('quantity', quantity);
    
    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const data = response.data;
    
    if (data.order) {
      await zk.sendMessage(chatId, {
        text: `*Order Placed Successfully*\n\n🛒 Order ID: *${data.order}*\n📦 Service: ${serviceId}\n🔗 Link: ${link}\n📊 Quantity: ${quantity}\n\n_Use '.yoyostatus ${data.order}' to check order status_`,
        contextInfo: {
          externalAdReply: {
            title: "YoYoMedia API",
            body: "BELTAH-MD BOT",
            thumbnailUrl: conf.URL,
            sourceUrl: conf.GURL,
            mediaType: 1,
            showAdAttribution: true
          }
        }
      }, { quoted: ms });
    } else if (data.error) {
      repondre(`*Error:* ${data.error}`);
    }
    
  } catch (error) {
    console.error("Error placing order:", error);
    repondre("*Error:* Failed to place order. Please check your parameters and try again.");
  }
});

// Check YoYoMedia order status
keith({
  nomCom: 'yoyostatus',
  aliases: ['order-status', 'yoyo-status'],
  categorie: 'YoYoMedia',
  reaction: '🔍'
}, async (chatId, zk, context) => {
  const { ms, repondre, superUser, arg } = context;
  
  // Only allow bot owner to use this command
  if (!superUser) {
    return repondre("*This command is restricted to the bot owner*");
  }
  
  if (arg.length < 1) {
    return repondre(`*Usage:* .yoyostatus [order_id]\n\nExample: .yoyostatus 1000000\nYou can also check multiple orders by separating IDs with commas: .yoyostatus 1000000,1000001`);
  }
  
  const orderId = arg[0];
  
  try {
    const formData = new URLSearchParams();
    formData.append('key', API_KEY);
    formData.append('action', 'status');
    formData.append('order', orderId);
    
    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const data = response.data;
    
    // Check if it's a multiple orders response or single order
    if (typeof data === 'object' && !data.status && !data.error) {
      // Multiple orders response
      let statusText = `*Multiple Orders Status*\n\n`;
      
      for (const [id, status] of Object.entries(data)) {
        if (status.error) {
          statusText += `*Order #${id}*: ${status.error}\n\n`;
        } else {
          statusText += `*Order #${id}*\n`;
          statusText += `Status: ${status.status}\n`;
          statusText += `Charge: ${status.charge} ${status.currency}\n`;
          statusText += `Start Count: ${status.start_count}\n`;
          statusText += `Remains: ${status.remains}\n\n`;
        }
      }
      
      await zk.sendMessage(chatId, {
        text: statusText,
        contextInfo: {
          externalAdReply: {
            title: "YoYoMedia API",
            body: "BELTAH-MD BOT",
            thumbnailUrl: conf.URL,
            sourceUrl: conf.GURL,
            mediaType: 1,
            showAdAttribution: true
          }
        }
      }, { quoted: ms });
      
    } else if (data.status) {
      // Single order response
      await zk.sendMessage(chatId, {
        text: `*Order #${orderId} Status*\n\n` +
          `Status: *${data.status}*\n` +
          `Charge: ${data.charge} ${data.currency}\n` +
          `Start Count: ${data.start_count}\n` +
          `Remains: ${data.remains}`,
        contextInfo: {
          externalAdReply: {
            title: "YoYoMedia API",
            body: "BELTAH-MD BOT",
            thumbnailUrl: conf.URL,
            sourceUrl: conf.GURL,
            mediaType: 1,
            showAdAttribution: true
          }
        }
      }, { quoted: ms });
    } else if (data.error) {
      repondre(`*Error:* ${data.error}`);
    }
    
  } catch (error) {
    console.error("Error checking order status:", error);
    repondre("*Error:* Failed to check order status. Please verify the order ID and try again.");
  }
});

// YoYoMedia help command
keith({
  nomCom: 'yoyo',
  aliases: ['yoyohelp', 'yoyo-help'],
  categorie: 'YoYoMedia',
  reaction: '📚'
}, async (chatId, zk, context) => {
  const { ms, repondre, superUser } = context;
  
  // Only allow bot owner to use this command
  if (!superUser) {
    return repondre("*This command is restricted to the bot owner*");
  }
  
  const helpText = `*YoYoMedia API Commands*\n\n` +
    `⚡ *.yoyobalance* - Check account balance\n\n` +
    `⚡ *.yoyoservices* [category] - List available services\n\n` +
    `⚡ *.yoyoorder* [service_id] [link] [quantity] - Place new order\n\n` +
    `⚡ *.yoyostatus* [order_id] - Check order status\n\n` +
    `Example usage:\n` +
    `- .yoyobalance\n` +
    `- .yoyoservices Instagram\n` +
    `- .yoyoorder 1 https://instagram.com/username 1000\n` +
    `- .yoyostatus 1000000`;
  
  await zk.sendMessage(chatId, {
    text: helpText,
    contextInfo: {
      externalAdReply: {
        title: "YoYoMedia API Integration",
        body: "BELTAH-MD BOT",
        thumbnailUrl: conf.URL,
        sourceUrl: conf.GURL,
        mediaType: 1,
        showAdAttribution: true
      }
    }
  }, { quoted: ms });
});
