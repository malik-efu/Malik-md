const { cmd } = require('../command');
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const Config = require('../config');

// Universal Sticker Creator and Taker

cmd(
    {
        pattern: 'sticker',
        alias: ['s', 'stickergif', 'take', 'rename', 'stake'], // Added 'take' aliases here
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
        let pack = Config.STICKER_NAME || "Default Pack Name"; // Default pack name from config

        // 2. Determine the new Pack Name (for 'take' functionality)
        if (q) {
            // If the user provides an argument (q), use it as the new pack name
            pack = q;
        }

        // 3. Media Type Check and Sticker Creation
        if (mime === "imageMessage" || mime === "videoMessage" || mime === "stickerMessage") {
            // Check if the file size is too large (e.g., for videos)
            // Note: wa-sticker-formatter handles video conversion (max 10s)
            
            // Download the media
            let media = await mek.quoted.download();
            
            // Set the sticker type based on media (video defaults to animated)
            let stickerType = mime === "videoMessage" ? StickerTypes.FULL : StickerTypes.FULL; 
            
            // Create the Sticker
            try {
                let sticker = new Sticker(media, {
                    pack: pack,
                    author: Config.OWNER_NAME || 'Your Bot Name', // Optional: You can also change the author name
                    type: stickerType,
                    categories: ["🤩", "🎉"],
                    id: "12345",
                    quality: 75,
                    background: 'transparent',
                });
                
                const buffer = await sticker.toBuffer();
                return conn.sendMessage(mek.chat, { sticker: buffer }, { quoted: mek });
                
            } catch (error) {
                console.error("Sticker creation error:", error);
                return reply(`*An error occurred while creating the sticker:*\n${error.message}`);
            }

        } else {
            // If the replied message is neither a photo, video, nor a sticker
            return reply("*Uhh, Please reply to an Image, Video, or an existing Sticker.*");
        }
    }
);
