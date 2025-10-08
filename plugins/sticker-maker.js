const { cmd } = require('../command');
const { Sticker, createSticker, StickerTypes } = require("wa-sticker-formatter");
const Config = require('../config');

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
        if (!quoted) return reply(`📌 *Reply to any image or video*\n\nUsage:\n.sticker - Default pack\n.sticker packname - Custom pack`);

        let mime = quoted.mtype;
        let packName = q || Config.STICKER_NAME || "Knight Bot";
        
        // Check if it's image, video, or sticker
        if (mime === "imageMessage" || mime === "videoMessage" || mime === "stickerMessage") {
            try {
                await reply("🔄 Creating sticker...");
                
                let media = await quoted.download();
                
                let stickerOptions = {
                    pack: packName, 
                    type: StickerTypes.FULL,
                    categories: ["🤩", "🎉"],
                    id: crypto.randomBytes(4).toString("hex"),
                    quality: 70,
                    background: 'transparent',
                };

                // Adjust quality for videos
                if (mime === "videoMessage") {
                    stickerOptions.quality = 50; // Lower quality for smoother video stickers
                }

                let sticker = new Sticker(media, stickerOptions);
                const buffer = await sticker.toBuffer();
                
                await conn.sendMessage(from, { 
                    sticker: buffer 
                }, { quoted: mek });
                
            } catch (error) {
                console.error('Sticker Error:', error);
                reply("❌ Failed to create sticker. Try with different media.");
            }
        } else {
            reply("❌ *Unsupported media type*\n\nPlease reply to an image or video only.");
        }
    }
);
