const axios = require("axios");
const { keith } = require(__dirname + "/../keizzah/keith");
const { format } = require(__dirname + "/../keizzah/mesfonctions");
const os = require('os');
const moment = require("moment-timezone");
const settings = require(__dirname + "/../set");

const readMore = String.fromCharCode(8206).repeat(4001);

// Function to convert text to fancy uppercase font
const toFancyUppercaseFont = (text) => {
    const fonts = {
        'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌',
        'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙'
    };
    return text.split('').map(char => fonts[char.toUpperCase()] || char).join('');
};

// Function to convert text to fancy lowercase font
const toFancyLowercaseFont = (text) => {
    const fonts = {
        'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ', 'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ',
        'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ', 'q': 'ǫ', 'r': 'ʀ', 's': '𝚜', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x', 'y': 'ʏ', 'z': 'ᴢ'
    };
    return text.split('').map(char => fonts[char.toLowerCase()] || char).join('');
};

const formatUptime = (seconds) => {
    seconds = Number(seconds);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return [
        days > 0 ? `${days} ${days === 1 ? "day" : "days"}` : '',
        hours > 0 ? `${hours} ${hours === 1 ? "hour" : "hours"}` : '',
        minutes > 0 ? `${minutes} ${minutes === 1 ? "minute" : "minutes"}` : '',
        remainingSeconds > 0 ? `${remainingSeconds} ${remainingSeconds === 1 ? "second" : "seconds"}` : ''
    ].filter(Boolean).join(', ');
};

const fetchGitHubStats = async () => {
    try {
        const response = await axios.get("https://api.github.com/repos/Beltah254/X-BOT");
        const forksCount = response.data.forks_count;
        const starsCount = response.data.stargazers_count;
        const totalUsers = forksCount * 2 + starsCount * 2;
        return { forks: forksCount, stars: starsCount, totalUsers };
    } catch (error) {
        console.error("Error fetching GitHub stats:", error);
        return { forks: 0, stars: 0, totalUsers: 0 };
    }
};

// Random quotes array
const quotes = [
    "Dream big, work hard.",
    "Stay humble, hustle hard.",
    "Believe in yourself.",
    "Success is earned, not given.",
    "Actions speak louder than words.",
    "The best is yet to come.",
    "Keep pushing forward.",
    "Do more than just exist.",
    "Progress, not perfection.",
    "Stay positive, work hard.",
    "Be the change you seek.",
    "Never stop learning.",
    "Chase your dreams.",
    "Be your own hero.",
    "Life is what you make of it.",
    "Do it with passion or not at all.",
    "You are stronger than you think.",
    "Create your own path.",
    "Make today count.",
    "Embrace the journey.",
    "The best way out is always through.",
    "Strive for progress, not perfection.",
    "Don't wish for it, work for it.",
    "Live, laugh, love.",
    "Keep going, you're getting there.",
    "Don't stop until you're proud.",
    "Success is a journey, not a destination.",
    "Take the risk or lose the chance.",
    "It's never too late.",
    "Believe you can and you're halfway there.",
    "Small steps lead to big changes.",
    "Happiness depends on ourselves.",
    "Take chances, make mistakes.",
    "Be a voice, not an echo.",
    "The sky is the limit.",
    "You miss 100% of the shots you don't take.",
    "Start where you are, use what you have.",
    "The future belongs to those who believe.",
    "Don't count the days, make the days count.",
    "Success is not the key to happiness. Happiness is the key to success."
];

// Function to get a random quote
const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
};

// Array of themes for menu display
const menuThemes = [
    // Theme 1: Classic
    (commands, categorizedCommands, botInfo) => {
        let menu = `
 ${botInfo.greeting}, *${botInfo.username || "User"}*

╭━❮  ${settings.BOT}  ❯━╮ 
┃ *👤ʙᴏᴛ ᴏᴡɴᴇʀ:* ${settings.OWNER_NAME}
┃ *🥏ᴘʀᴇғɪx:* *[ ${settings.PREFIXE} ]*
┃ *🕒ᴛɪᴍᴇ:* ${botInfo.time}
┃ *🛸ᴄᴏᴍᴍᴀɴᴅꜱ:* ${commands.length} 
┃ *📆ᴅᴀᴛᴇ:* ${botInfo.date}
┃ *🧑‍💻ᴍᴏᴅᴇ:* ${botInfo.mode}
┃ *📼ʀᴀᴍ:* ${botInfo.ram}
┃ *⏳ᴜᴘᴛɪᴍᴇ:* ${botInfo.uptime}
╰─────────────━┈⊷
> *${botInfo.quote}*\n`;

        let commandsList = "";
        const sortedCategories = Object.keys(categorizedCommands).sort();

        for (const category of sortedCategories) {
            commandsList += `\n*╭━❮ ${toFancyUppercaseFont(category)} ❯━╮*`;
            const sortedCommands = categorizedCommands[category].sort();
            for (const command of sortedCommands) {
                commandsList += `\n┃✰ ${toFancyLowercaseFont(command)}`;
            }
            commandsList += "\n╰─────────────━┈⊷";
        }

        return menu + commandsList;
    },

    // Theme 2: Modern
    (commands, categorizedCommands, botInfo) => {
        let menu = `
 ${botInfo.greeting}, *${botInfo.username || "User"}*

╭━━━ 〔 ${settings.BOT} 〕━━━┈⊷
┃╭──────────────
┃│▸ *ʙᴏᴛ ᴏᴡɴᴇʀ:* ${settings.OWNER_NAME}
┃│▸ *ᴘʀᴇғɪx:* *[ ${settings.PREFIXE} ]*
┃│▸ *ᴛɪᴍᴇ:* ${botInfo.time}
┃│▸ *ᴄᴏᴍᴍᴀɴᴅꜱ:* ${commands.length} 
┃│▸ *ᴅᴀᴛᴇ:* ${botInfo.date}
┃│▸ *ᴍᴏᴅᴇ:* ${botInfo.mode}
┃│▸ *ᴛɪᴍᴇ ᴢᴏɴᴇ:* Africa/Nairobi
┃│▸ *ᴛᴏᴛᴀʟ ᴜsᴇʀs:* ${botInfo.totalUsers} users
┃│▸ *ʀᴀᴍ:* ${botInfo.ram}
┃│▸ *ᴜᴘᴛɪᴍᴇ:* ${botInfo.uptime}
┃╰──────────────
╰━━━━━━━━━━━━━━━┈⊷
> *${botInfo.quote}*\n`;

        let commandsList = "*𝐓𝐑𝐄𝐊𝐊𝐄𝐑 𝐌𝐃 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒*\n";
        const sortedCategories = Object.keys(categorizedCommands).sort();
        let commandIndex = 1;

        for (const category of sortedCategories) {
            commandsList += `\n*╭─────「 ${toFancyUppercaseFont(category)} 」──┈⊷*\n│◦│╭───────────────`;
            const sortedCommands = categorizedCommands[category].sort();
            for (const command of sortedCommands) {
                commandsList += `\n│◦│ ${commandIndex++}. ${toFancyLowercaseFont(command)}`;
            }
            commandsList += "\n│◦╰─────────────\n╰──────────────┈⊷\n";
        }

        return menu + commandsList;
    },

    // Theme 3: Minimalist
    (commands, categorizedCommands, botInfo) => {
        let menu = `
◈ ━━━━━━ ◆ ━━━━━━ ◈
  *${settings.BOT}*  
◈ ━━━━━━ ◆ ━━━━━━ ◈

${botInfo.greeting}, *${botInfo.username || "User"}*

⦿ OWNER: ${settings.OWNER_NAME}
⦿ PREFIX: ${settings.PREFIXE}
⦿ TIME: ${botInfo.time}
⦿ DATE: ${botInfo.date}
⦿ COMMANDS: ${commands.length}
⦿ MODE: ${botInfo.mode}
⦿ UPTIME: ${botInfo.uptime}

"${botInfo.quote}"\n\n`;

        let commandsList = "❖ 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 𝐋𝐈𝐒𝐓 ❖\n\n";
        const sortedCategories = Object.keys(categorizedCommands).sort();

        for (const category of sortedCategories) {
            commandsList += `┌─「 ${toFancyUppercaseFont(category)} 」\n`;
            const sortedCommands = categorizedCommands[category].sort();
            for (const command of sortedCommands) {
                commandsList += `│ ❑ ${toFancyLowercaseFont(command)}\n`;
            }
            commandsList += `└────────────\n\n`;
        }

        return menu + commandsList;
    },

    // Theme 4: Futuristic
    (commands, categorizedCommands, botInfo) => {
        let menu = `
⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯
    ${settings.BOT} SYSTEM
⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯⟦⟯

${botInfo.greeting}, *${botInfo.username || "User"}*

▣ SYSTEM INFO ▣
┊↳ OWNER: ${settings.OWNER_NAME}
┊↳ PREFIX: ${settings.PREFIXE}
┊↳ TIME: ${botInfo.time}
┊↳ DATE: ${botInfo.date}
┊↳ COMMANDS: ${commands.length}
┊↳ MODE: ${botInfo.mode}
┊↳ UPTIME: ${botInfo.uptime}
┊↳ RAM: ${botInfo.ram}

▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰
"${botInfo.quote}"
▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰\n\n`;

        let commandsList = "⚡ 𝐓𝐑𝐄𝐊𝐊𝐄𝐑 𝐌𝐃 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 ⚡\n\n";
        const sortedCategories = Object.keys(categorizedCommands).sort();

        for (const category of sortedCategories) {
            commandsList += `╔══❰ ${toFancyUppercaseFont(category)} ❱══╗\n`;
            const sortedCommands = categorizedCommands[category].sort();
            for (const command of sortedCommands) {
                commandsList += `║ ◉ ${toFancyLowercaseFont(command)}\n`;
            }
            commandsList += `╚════════════╝\n\n`;
        }

        return menu + commandsList;
    },

    // Theme 5: Elegant
    (commands, categorizedCommands, botInfo) => {
        let menu = `
┏━━━━━━❀❀❀━━━━━━┓
   *${settings.BOT}*  
┗━━━━━━❀❀❀━━━━━━┛

${botInfo.greeting}, *${botInfo.username || "User"}*

❀ BOT OWNER: ${settings.OWNER_NAME}
❀ PREFIX: ${settings.PREFIXE}
❀ TIME: ${botInfo.time}
❀ DATE: ${botInfo.date}
❀ COMMANDS: ${commands.length}
❀ MODE: ${botInfo.mode}
❀ UPTIME: ${botInfo.uptime}

"${botInfo.quote}"\n\n`;

        let commandsList = "✿ 𝐓𝐑𝐄𝐊𝐊𝐄𝐑 𝐌𝐃 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 ✿\n\n";
        const sortedCategories = Object.keys(categorizedCommands).sort();

        for (const category of sortedCategories) {
            commandsList += `┌───❀ ${toFancyUppercaseFont(category)} ❀───┐\n`;
            const sortedCommands = categorizedCommands[category].sort();
            for (const command of sortedCommands) {
                commandsList += `│ ❁ ${toFancyLowercaseFont(command)}\n`;
            }
            commandsList += `└─────────────────┘\n\n`;
        }

        return menu + commandsList;
    }
];

// Store the last used theme index
let lastThemeIndex = -1;

// Function to get the next theme
const getNextTheme = () => {
    lastThemeIndex = (lastThemeIndex + 1) % menuThemes.length;
    return menuThemes[lastThemeIndex];
};

keith({ nomCom: "menu", aliases: ["liste", "helplist", "commandlist"], categorie: "SYSTEM" }, async (message, client, config) => {
    const { ms, respond, prefix, nomAuteurMessage } = config;
    const commands = require(__dirname + "/../keizzah/keith").cm;
    const categorizedCommands = {};
    const mode = settings.MODE.toLowerCase() !== "public" ? "Private" : "Public";

    // Organize commands into categories
    commands.forEach(command => {
        const category = command.categorie.toUpperCase();
        if (!categorizedCommands[category]) {
            categorizedCommands[category] = [];
        }
        categorizedCommands[category].push(command.nomCom);
    });

    moment.tz.setDefault("Africa/Nairobi");
    const currentTime = moment();
    const formattedTime = currentTime.format("HH:mm:ss");
    const formattedDate = currentTime.format("DD/MM/YYYY");
    const currentHour = currentTime.hour();

    const greetings = ["Good Morning 🌄", "Good Afternoon 🌃", "Good Evening ⛅", "Good Night 🌙"];
    const greeting = currentHour < 12 ? greetings[0] : currentHour < 17 ? greetings[1] : currentHour < 21 ? greetings[2] : greetings[3];

    const { totalUsers } = await fetchGitHubStats();
    const formattedTotalUsers = totalUsers.toLocaleString();

    const randomQuote = getRandomQuote();

    // Prepare bot info for the theme
    const botInfo = {
        username: nomAuteurMessage,
        greeting: greeting,
        time: formattedTime,
        date: formattedDate,
        mode: mode,
        ram: `${format(os.totalmem() - os.freemem())}/${format(os.totalmem())}`,
        uptime: formatUptime(process.uptime()),
        totalUsers: formattedTotalUsers,
        quote: randomQuote
    };

    // Get the next theme and generate the menu
    const themeGenerator = getNextTheme();
    const menuOutput = themeGenerator(commands, categorizedCommands, botInfo);

    // Add read more and footer
    const finalOutput = menuOutput + readMore + "\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴛʀᴇᴋᴋᴇʀ ᴛᴇᴀᴍ\n";

    try {
        const senderName = message.sender || message.from;
        await client.sendMessage(message, {
            text: finalOutput,
            contextInfo: {
                mentionedJid: [senderName],
                externalAdReply: {
                    title: "𝐓𝐑𝐄𝐊𝐊𝐄𝐑 𝐌𝐃" ,
                    body: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴛʀᴇᴋᴋᴇʀ ᴛᴇᴀᴍ" ,
                    thumbnailUrl: "https://i.postimg.cc/GhvmRfJt/IMG-20250306-033010-020.jpg" ,
                    sourceUrl:'https://whatsapp.com/channel/0029VaRHDBKKmCPKp9B2uH2F' ,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });
    } catch (error) {
        console.error("Menu error: ", error);
        respond("🥵🥵 Menu error: " + error);
    }
});

keith({ nomCom: "list", aliases: ["liste", "helplist", "commandlist"], categorie: "SYSTEM" }, async (message, client, config) => {
    const { ms, respond, prefix, nomAuteurMessage } = config;
    const commands = require(__dirname + "/../keizzah/keith").cm;
    const categorizedCommands = {};
    const mode = settings.MODE.toLowerCase() !== "public" ? "Private" : "Public";

    // Organize commands into categories
    commands.forEach(command => {
        const category = command.categorie.toUpperCase();
        if (!categorizedCommands[category]) {
            categorizedCommands[category] = [];
        }
        categorizedCommands[category].push(command.nomCom);
    });

    moment.tz.setDefault("Africa/Nairobi");
    const currentTime = moment();
    const formattedTime = currentTime.format("HH:mm:ss");
    const formattedDate = currentTime.format("DD/MM/YYYY");
    const currentHour = currentTime.hour();

    const greetings = ["Good Morning 🌄", "Good Afternoon 🌃", "Good Evening ⛅", "Good Night 🌙"];
    const greeting = currentHour < 12 ? greetings[0] : currentHour < 17 ? greetings[1] : currentHour < 21 ? greetings[2] : greetings[3];

    const { totalUsers } = await fetchGitHubStats();
    const formattedTotalUsers = totalUsers.toLocaleString();

    const randomQuote = getRandomQuote();

    // Prepare bot info for the theme
    const botInfo = {
        username: nomAuteurMessage,
        greeting: greeting,
        time: formattedTime,
        date: formattedDate,
        mode: mode,
        ram: `${format(os.totalmem() - os.freemem())}/${format(os.totalmem())}`,
        uptime: formatUptime(process.uptime()),
        totalUsers: formattedTotalUsers,
        quote: randomQuote
    };

    // Get the next theme and generate the menu
    const themeGenerator = getNextTheme();
    const menuOutput = themeGenerator(commands, categorizedCommands, botInfo);

    // Add read more and footer
    const finalOutput = menuOutput + readMore + "\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴛʀᴇᴋᴋᴇʀ ᴛᴇᴀᴍ\n";

    try {
        const senderName = message.sender || message.from;
        await client.sendMessage(message, {
            text: finalOutput,
            contextInfo: {
                mentionedJid: [senderName],
                externalAdReply: {
                    title: "𝐓𝐑𝐄𝐊𝐊𝐄𝐑 𝐌𝐃" ,
                    body: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴛʀᴇᴋᴋᴇʀ ᴛᴇᴀᴍ" ,
                    thumbnailUrl: "https://i.postimg.cc/GhvmRfJt/IMG-20250306-033010-020.jpg" ,
                    sourceUrl:'https://whatsapp.com/channel/0029VaRHDBKKmCPKp9B2uH2F' ,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });
    } catch (error) {
        console.error("Menu error: ", error);
        respond("🥵🥵 Menu error: " + error);
    }
});

keith({ nomCom: "allcmd", aliases: ["liste", "helplist", "commandlist"], categorie: "SYSTEM" }, async (message, client, config) => {
    const { ms, respond, prefix, nomAuteurMessage } = config;
    const commands = require(__dirname + "/../keizzah/keith").cm;
    const categorizedCommands = {};
    const mode = settings.MODE.toLowerCase() !== "public" ? "Private" : "Public";

    // Organize commands into categories
    commands.forEach(command => {
        const category = command.categorie.toUpperCase();
        if (!categorizedCommands[category]) {
            categorizedCommands[category] = [];
        }
        categorizedCommands[category].push(command.nomCom);
    });

    moment.tz.setDefault("Africa/Nairobi");
    const currentTime = moment();
    const formattedTime = currentTime.format("HH:mm:ss");
    const formattedDate = currentTime.format("DD/MM/YYYY");
    const currentHour = currentTime.hour();

    const greetings = ["Good Morning 🌄", "Good Afternoon 🌃", "Good Evening ⛅", "Good Night 🌙"];
    const greeting = currentHour < 12 ? greetings[0] : currentHour < 17 ? greetings[1] : currentHour < 21 ? greetings[2] : greetings[3];

    const { totalUsers } = await fetchGitHubStats();
    const formattedTotalUsers = totalUsers.toLocaleString();

    const randomQuote = getRandomQuote();

    // Prepare bot info for the theme
    const botInfo = {
        username: nomAuteurMessage,
        greeting: greeting,
        time: formattedTime,
        date: formattedDate,
        mode: mode,
        ram: `${format(os.totalmem() - os.freemem())}/${format(os.totalmem())}`,
        uptime: formatUptime(process.uptime()),
        totalUsers: formattedTotalUsers,
        quote: randomQuote
    };

    // Get the next theme and generate the menu
    const themeGenerator = getNextTheme();
    const menuOutput = themeGenerator(commands, categorizedCommands, botInfo);

    // Add read more and footer
    const finalOutput = menuOutput + readMore + "\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴛʀᴇᴋᴋᴇʀ ᴛᴇᴀᴍ\n";

    try {
        const senderName = message.sender || message.from;
        await client.sendMessage(message, {
            text: finalOutput,
            contextInfo: {
                mentionedJid: [senderName],
                externalAdReply: {
                    title: "𝐓𝐑𝐄𝐊𝐊𝐄𝐑 𝐌𝐃" ,
                    body: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴛʀᴇᴋᴋᴇʀ ᴛᴇᴀᴍ" ,
                    thumbnailUrl: "https://i.postimg.cc/GhvmRfJt/IMG-20250306-033010-020.jpg" ,
                    sourceUrl:'https://whatsapp.com/channel/0029VaRHDBKKmCPKp9B2uH2F' ,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });
    } catch (error) {
        console.error("Menu error: ", error);
        respond("🥵🥵 Menu error: " + error);
    }
});

keith({ nomCom: "help", aliases: ["liste", "helplist", "commandlist"], categorie: "SYSTEM" }, async (message, client, config) => {
    const { ms, respond, prefix, nomAuteurMessage } = config;
    const commands = require(__dirname + "/../keizzah/keith").cm;
    const categorizedCommands = {};
    const mode = settings.MODE.toLowerCase() !== "public" ? "Private" : "Public";

    // Organize commands into categories
    commands.forEach(command => {
        const category = command.categorie.toUpperCase();
        if (!categorizedCommands[category]) {
            categorizedCommands[category] = [];
        }
        categorizedCommands[category].push(command.nomCom);
    });

    moment.tz.setDefault("Africa/Nairobi");
    const currentTime = moment();
    const formattedTime = currentTime.format("HH:mm:ss");
    const formattedDate = currentTime.format("DD/MM/YYYY");
    const currentHour = currentTime.hour();

    const greetings = ["Good Morning 🌄", "Good Afternoon 🌃", "Good Evening ⛅", "Good Night 🌙"];
    const greeting = currentHour < 12 ? greetings[0] : currentHour < 17 ? greetings[1] : currentHour < 21 ? greetings[2] : greetings[3];

    const { totalUsers } = await fetchGitHubStats();
    const formattedTotalUsers = totalUsers.toLocaleString();

    const randomQuote = getRandomQuote();

    // Prepare bot info for the theme
    const botInfo = {
        username: nomAuteurMessage,
        greeting: greeting,
        time: formattedTime,
        date: formattedDate,
        mode: mode,
        ram: `${format(os.totalmem() - os.freemem())}/${format(os.totalmem())}`,
        uptime: formatUptime(process.uptime()),
        totalUsers: formattedTotalUsers,
        quote: randomQuote
    };

    // Get the next theme and generate the menu
    const themeGenerator = getNextTheme();
    const menuOutput = themeGenerator(commands, categorizedCommands, botInfo);

    // Add read more and footer
    const finalOutput = menuOutput + readMore + "\n> ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴛʀᴇᴋᴋᴇʀ ᴛᴇᴀᴍ\n";

    try {
        const senderName = message.sender || message.from;
        await client.sendMessage(message, {
            text: finalOutput,
            contextInfo: {
                mentionedJid: [senderName],
                externalAdReply: {
                    title: "𝐓𝐑𝐄𝐊𝐊𝐄𝐑 𝐌𝐃" ,
                    body: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴛʀᴇᴋᴋᴇʀ ᴛᴇᴀᴍ" ,
                    thumbnailUrl: "https://i.postimg.cc/GhvmRfJt/IMG-20250306-033010-020.jpg" ,
                    sourceUrl:'https://whatsapp.com/channel/0029VaRHDBKKmCPKp9B2uH2F' ,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });
    } catch (error) {
        console.error("Menu error: ", error);
        respond("🥵🥵 Menu error: " + error);
    }
});