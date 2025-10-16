const { cmd } = require('../command');
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const Config = require('../config');
const fs = require('fs-extra'); // Used for file system operations

// Universal Sticker Creator and Taker

cmd(
    {
        pattern: 'sticker',
        alias: ['sd', 'stickergif', 'take', 'rename', 'stake'],
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
        let media;
        let stickerBuffer;

        // 2. Determine the new Pack/Author Name (for 'take' functionality)
        if (q) {
            // If the user provides an argument (q), use it as the new pack name and author
            pack = q.split('|')[0] || pack;
            author = q.split('|')[1] || author;
        }
        
        // 3. Media Type Check and Sticker Creation
        if (mime === "imageMessage" || mime === "stickerMessage") {
            // Processing for Images and existing Stickers (Direct Buffer processing is fast and reliable)
            await reply("*Processing Image/Sticker...*");
            
            try {
                media = await mek.quoted.download();
                
                let sticker = new Sticker(media, {
                    pack: pack,
                    author: author, 
                    type: StickerTypes.FULL,
                    categories: ["🤩", "🎉"],
                    quality: 75,
                    background: 'transparent',
                });
                
                stickerBuffer = await sticker.toBuffer();
                
            } catch (error) {
                console.error("Image/Sticker creation error:", error);
                return reply(`*An error occurred while processing the Image/Sticker:*\n${error.message}`);
            }

            // Send the resulting sticker
            return conn.sendMessage(mek.chat, { sticker: stickerBuffer }, { quoted: mek });

        } else if (mime === "videoMessage") {
            // Processing for Videos (Requires temporary file for robust conversion)
            await reply("*Processing Video... This may take up to 10 seconds.*");

            // Generate a unique temporary path for the video
            const tempFilePath = `./temp_vid_${Date.now()}.mp4`; 
            
            try {
                // Download the video buffer
                media = await mek.quoted.download();
                
                // 1. Save the video buffer to a temporary file
                await fs.writeFileSync(tempFilePath, media);
                
                // 2. Create sticker using the file path (more reliable for FFmpeg/video conversion)
                let sticker = new Sticker(tempFilePath, {
                    pack: pack,
                    author: author, 
                    type: StickerTypes.FULL, // Full for animated sticker
                    categories: ["🤩", "🎉"],
                    quality: 75,
                    // Note: Video duration must be under ~10 seconds for conversion to work.
                    background: 'transparent',
                });
                
                stickerBuffer = await sticker.toBuffer();
                
                // 3. Send the sticker
                await conn.sendMessage(mek.chat, { sticker: stickerBuffer }, { quoted: mek });
                
            } catch (error) {
                console.error("Video Sticker creation error:", error);
                return reply(`*An error occurred while creating the video sticker. 😔*\n\n*Possible causes:*\n1. The video might be too long (must be under ~10 seconds).\n2. The video quality is too high, causing conversion failure.\n\n*Error details:*\n${error.message}`);
            } finally {
                // 4. GUARANTEED Cleanup of the temporary file
                if (fs.existsSync(tempFilePath)) {
                    await fs.remove(tempFilePath); // Use fs-extra's remove for better reliability
                }
            }
        } else {
            // If the replied message is an unsupported media type
            return reply("*Uhh, Please reply to an Image, Video, or an existing Sticker.*");
        }
    }
);
