
const { keith } = require(__dirname + "/../keizzah/keith");
const fs = require('fs-extra');
const path = require('path');

keith({ nomCom: "owner", categorie: "GENERAL" }, async (origineMessage, zk, commandeOptions) => {
    const { repondre, ms, mybotpic } = commandeOptions;

    try {
        const vcard = 'BEGIN:VCARD\n' +
              'VERSION:3.0\n' +
              'FN:TREKKER2\n' +
              'ORG:TREKKER Team;\n' +
              'TEL;type=CELL;type=VOICE;waid=254704897825:+254704897825\n' +
              'END:VCARD';

        await zk.sendMessage(origineMessage, {
            contacts: { displayName: "TREKKER2", contacts: [{ vcard }] },
            contextInfo: {
                externalAdReply: {
                    title: "𝐓𝐑𝐄𝐊𝐊𝐄𝐑 𝐌𝐃",
                    body: "ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴛʀᴇᴋᴋᴇʀ ᴛᴇᴀᴍ",
                    thumbnailUrl: "https://i.postimg.cc/GhvmRfJt/IMG-20250306-033010-020.jpg",
                    sourceUrl: 'https://wa.me/254704897825?text=Hi+TREKKER2',
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });
    } catch (error) {
        console.error("Owner command error:", error);
        repondre("Error processing owner command: " + error);
    }
});
