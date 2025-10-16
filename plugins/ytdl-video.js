const { cmd } = require('../command');
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const Config = require('../config');
const fetch = require('node-fetch');
const Crypto = require("crypto");

cmd(
    {
        pattern: 'tg',
        alias: ['tpack', 'tgsticker', 'tgpack'],
        desc: 'Download Telegram sticker pack',
        category: 'sticker',
        use: '<telegram_sticker_url>',
        filename: __filename,
    },
    async (conn, mek, m, { quoted, args, q, reply, from }) => {
        try {
            if (!q) {
                return reply(`📦 *Telegram Sticker Download*\n\nUsage: .tg <url>\nExample: .tg https://t.me/addstickers/blueemojii`);
            }

            // Extract pack name from URL
            let packName = q.replace("https://t.me/addstickers/", "").trim();
            if (!packName) {
                return reply('❌ *Invalid pack name!* Please check the URL.');
            }

            // Remove any extra parameters
            packName = packName.split('?')[0];

            await reply(`🔍 *Searching for:* ${packName}\n⏳ *Please wait...*`);

            // Use your bot token
            const botToken = '7801479976:AAGuPL0a7kXXBYz6XUSR_ll2SR5V_W6oHl4'; // Ensure this token is valid

            try {
                const response = await fetch(
                    `https://api.telegram.org/bot${botToken}/getStickerSet?name=${encodeURIComponent(packName)}`,
                    {
                        method: 'GET',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        },
                        timeout: 30000
                    }
                );

                if (!response.ok) {
                    return reply(`❌ *API Error!* HTTP ${response.status}\n\n💡 Check if:\n• Bot token is valid\n• Sticker pack exists\n• Pack is public`);
                }

                const data = await response.json();
                
                if (!data.ok || !data.result) {
                    return reply(`❌ *Sticker pack not found!*\n\n📛 *Pack:* ${packName}\n🔍 *Error:* ${data.description || 'Unknown error'}\n\n💡 Make sure the sticker pack exists and is public.`);
                }

                const stickerSet = data.result;
                const totalStickers = stickerSet.stickers.length;
                
                if (totalStickers === 0) {
                    return reply('❌ *Empty sticker pack!* No stickers found.');
                }

                // Send pack info
                await reply(`📦 *Sticker Pack Found!*\n\n✨ *Title:* ${stickerSet.title}\n📊 *Stickers:* ${totalStickers}\n🎨 *Type:* ${stickerSet.is_animated ? 'Animated (TGS)' : (stickerSet.is_video ? 'Video (WEBM)' : 'Static')}\n⏳ *Downloading...* Please wait!`);

                let successCount = 0;

                // Process each sticker
                for (let i = 0; i < totalStickers; i++) {
                    try {
                        const sticker = stickerSet.stickers[i];
                        
                        // Get file path
                        const fileResponse = await fetch(
                            `https://api.telegram.org/bot${botToken}/getFile?file_id=${sticker.file_id}`,
                            { timeout: 15000 }
                        );
                        
                        if (!fileResponse.ok) {
                            console.log(`Failed to get file path for sticker ${i + 1}`);
                            continue;
                        }
                        
                        const fileData = await fileResponse.json();
                        if (!fileData.ok || !fileData.result.file_path) {
                            console.log(`No file path for sticker ${i + 1}`);
                            continue;
                        }

                        const filePath = fileData.result.file_path;

                        // Download sticker
                        const stickerResponse = await fetch(
                            `https://api.telegram.org/file/bot${botToken}/${filePath}`,
                            { timeout: 30000 } // Increased timeout for potentially larger video files
                        );
                        
                        if (!stickerResponse.ok) {
                            console.log(`Failed to download sticker ${i + 1}`);
                            continue;
                        }

                        const stickerBuffer = await stickerResponse.buffer();

                        // --- Core Fix: Determine Sticker Type and Conversion ---
                        
                        let stickerType = StickerTypes.FULL;
                        let quality = 70;

                        // Check for Animated (TGS) or Video (WEBM) stickers
                        if (sticker.is_animated || sticker.is_video) {
                            // Video/Animated stickers need to be converted to animated WEBP.
                            // The wa-sticker-formatter handles this by using FFmpeg internally.
                            // We set the type to full and decrease quality for smaller files.
                            stickerType = StickerTypes.FULL; 
                            quality = 50; // Use lower quality for animated stickers
                        }
                        // --- End Core Fix ---

                        // Create WhatsApp sticker using your existing formatter
                        const waSticker = new Sticker(stickerBuffer, {
                            pack: stickerSet.title || Config.STICKER_NAME || "Telegram Pack",
                            author: "via Telegram",
                            type: stickerType,
                            categories: sticker.emoji ? [sticker.emoji] : ["❤️"],
                            id: Crypto.randomBytes(4).toString('hex'),
                            quality: quality, // Quality based on sticker type
                            background: 'transparent'
                        });

                        const finalBuffer = await waSticker.toBuffer();

                        // Send sticker
                        await conn.sendMessage(mek.chat, { 
                            sticker: finalBuffer 
                        }, { quoted: mek });

                        successCount++;

                        // Progress updates every 5 stickers
                        if ((i + 1) % 5 === 0) {
                            await reply(`📥 *Progress:* ${i + 1}/${totalStickers} stickers`);
                        }

                        // Delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 1500));

                    } catch (error) {
                        console.error(`Error processing sticker ${i + 1}:`, error);
                        // Send a specific error message for failed video/animated stickers
                        if (error.message && error.message.includes('FFmpeg')) {
                            await reply(`⚠️ *Sticker ${i + 1} Failed!* (Animated/Video)\nReason: **FFmpeg required.** Make sure it is installed and accessible in your environment.`);
                        } else {
                            await reply(`❌ *Sticker ${i + 1} Failed!* Error: ${error.message.substring(0, 50)}...`);
                        }
                        continue;
                    }
                }

                // Final result
                const resultMessage = `✅ *Download Complete!*\n\n📦 *Pack:* ${stickerSet.title}\n✅ *Success:* ${successCount}/${totalStickers} stickers\n✨ *Thank you for using!*`;

                await reply(resultMessage);

            } catch (error) {
                console.error('Telegram API error:', error);
                
                if (error.name === 'TimeoutError' || error.type === 'request-timeout') {
                    return reply('❌ *Request timeout!* Telegram API is slow. Try again later.');
                }
                
                return reply(`❌ *API Connection Failed!*\n\nError: ${error.message.substring(0, 100)}...\n\n💡 Check your internet connection and bot token.`);
            }

        } catch (error) {
            console.error('Telegram command error:', error);
            await reply('❌ *Unexpected error!* Please try again with a different sticker pack.');
        }
    }
);
