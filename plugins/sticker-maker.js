const { cmd } = require('../command');
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const Config = require('../config');
const crypto = require('crypto');

// Combined sticker command for images, videos, and custom pack names
cmd(
    {
        pattern: 'sticker',
        alias: ['s', 'take', 'stickergif', 'rename'],
        desc: 'Create sticker from image/video with custom pack name',
        category: 'sticker',
        use: '<reply media> or .sticker packname <reply media>',
        filename: __filename,
    },
    async (conn, mek, m, { quoted, args, q, reply, from }) => {
        if (!quoted) {
            return reply(`📌 *Sticker Maker*\n\nUsage:\n• .sticker (reply to image/video) - Default pack\n• .sticker packname (reply to image/video) - Custom pack\n• .take packname (reply to image/video) - Custom pack`);
        }

        let mime = quoted.mtype;
        let packName = q || Config.STICKER_NAME || "Knight Bot";
        
        // Check supported media types
        const supportedTypes = ["imageMessage", "videoMessage", "stickerMessage"];
        
        if (!supportedTypes.includes(mime)) {
            return reply("❌ *Unsupported media type*\n\nPlease reply to:\n• Image (jpg, png)\n• Video (mp4, gif)\n• Sticker (to change pack name)");
        }

        try {
            await reply("🔄 Creating sticker... Please wait!");
            
            let media = await quoted.download();
            
            let stickerOptions = {
                pack: packName, 
                author: "Knight Bot",
                type: StickerTypes.FULL,
                categories: ["🎨", "✨"],
                id: crypto.randomBytes(4).toString("hex"),
                quality: 70,
                background: 'transparent',
            };

            // Adjust settings based on media type
            if (mime === "videoMessage") {
                stickerOptions.quality = 50; // Better for videos
                stickerOptions.type = StickerTypes.FULL; // Or use CROPPED for better video stickers
            } else if (mime === "stickerMessage") {
                stickerOptions.quality = 80; // Higher quality for existing stickers
            }

            let sticker = new Sticker(media, stickerOptions);
            const buffer = await sticker.toBuffer();
            
            await conn.sendMessage(from, { 
                sticker: buffer 
            }, { quoted: mek });
            
        } catch (error) {
            console.error('Sticker Creation Error:', error);
            
            if (error.message.includes('download')) {
                reply("❌ Failed to download media. Try again.");
            } else if (error.message.includes('buffer')) {
                reply("❌ Failed to process media. Try with different file.");
            } else {
                reply("❌ Sticker creation failed. Please try again.");
            }
        }
    }
);
