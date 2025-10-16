const { cmd } = require('../command');
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const Config = require('../config');
const fs = require('fs-extra'); // Make sure fs-extra is required if you use it for temp files

// Universal Sticker Creator and Taker

cmd(
    {
        pattern: 'sticker',
        alias: ['ssa', 'stickergif', 'take', 'rename', 'stake'],
        desc: 'Create a sticker from an image, video, or URL, or change the pack name of an existing sticker.',
        category: 'sticker',
        use: '<reply media or URL> [Optional: packname]',
        filename: __filename,
    },
    async (conn, mek, m, { quoted, args, q, reply, from }) => {
        // 1. Check for Quoted Message
        if (!mek.quoted) {
            return reply(`*Reply to an Image, Video, or Sticker to convert it.*`);
        }

        let mime = mek.quoted.mtype;
        let pack = Config.STICKER_NAME || "Your Sticker Pack"; // Default pack name
        let author = Config.OWNER_NAME || 'Your Bot Name'; // Default author name

        // 2. Determine the new Pack/Author Name (for 'take' functionality)
        if (q) {
            // If the user provides an argument (q), use it as the new pack name
            pack = q.split('|')[0] || pack;
            author = q.split('|')[1] || author;
        }

        // 3. Media Type Check and Sticker Creation
        if (mime === "imageMessage" || mime === "stickerMessage" || mime === "videoMessage") {
            
            await reply("*Processing... Please wait while I create your sticker.*");
            
            // Download the media
            let media = await mek.quoted.download();
            
            // Determine sticker type
            let stickerType = (mime === "videoMessage") ? StickerTypes.FULL : StickerTypes.FULL; 
            
            try {
                let sticker = new Sticker(media, {
                    pack: pack,
                    author: author, 
                    type: stickerType,
                    categories: ["🤩", "🎉"],
                    id: "12345",
                    quality: 75,
                    // Video conversion quality can be adjusted here if needed (e.g., fps, size)
                    background: 'transparent',
                });
                
                const buffer = await sticker.toBuffer();
                return conn.sendMessage(mek.chat, { sticker: buffer }, { quoted: mek });
                
            } catch (error) {
                console.error("Sticker creation error:", error);
                
                // Provide a specific message for video-related issues
                if (mime === "videoMessage") {
                    return reply(`*An error occurred while creating the video sticker. 😔*\n\n*Possible causes:*\n1. The video might be too long (must be under ~10 seconds).\n2. The video quality is too high.\n3. Server error during conversion.`);
                } else {
                     return reply(`*An error occurred while creating the sticker:*\n${error.message}`);
                }
            }

        } else {
            // If the replied message is neither a photo, video, nor a sticker
            return reply("*Uhh, Please reply to an Image, Video, or an existing Sticker.*");
        }
    }
);
