const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');
const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "stickera",
    alias: ["sa", "stickera"],
    react: "🎨",
    desc: "Create sticker from image/video",
    category: "sticker",
    use: ".sticker (reply to image/video)",
    filename: __filename,
}, 
async (conn, mek, m, { from, quoted, reply }) => {
    try {
        if (!quoted) {
            return reply("🎨 *Sticker Maker*\n\nReply to an image or video with .sticker to convert it to sticker");
        }

        let targetMessage = quoted;
        const mediaMessage = targetMessage.imageMessage || targetMessage.videoMessage || targetMessage.documentMessage;

        if (!mediaMessage) {
            return reply("❌ Please reply to an image or video only");
        }

        await reply("⏳ Creating sticker... Please wait!");

        const mediaBuffer = await downloadMediaMessage(targetMessage, 'buffer', {}, { 
            logger: undefined, 
            reuploadRequest: conn.updateMediaMessage 
        });

        if (!mediaBuffer) {
            return reply("❌ Failed to download media. Please try again.");
        }

        // Create temp directory
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // Generate temp file paths
        const tempInput = path.join(tmpDir, `temp_${Date.now()}`);
        const tempOutput = path.join(tmpDir, `sticker_${Date.now()}.webp`);

        // Write media to temp file
        fs.writeFileSync(tempInput, mediaBuffer);

        // Check if media is animated
        const isAnimated = mediaMessage.mimetype?.includes('gif') || 
                          mediaMessage.mimetype?.includes('video') || 
                          mediaMessage.seconds > 0;

        // Convert to WebP using ffmpeg
        const ffmpegCommand = isAnimated
            ? `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`
            : `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        // Read WebP file
        let webpBuffer = fs.readFileSync(tempOutput);

        // Add metadata
        const img = new webp.Image();
        await img.load(webpBuffer);

        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': config.STICKER_NAME || 'Knight Bot',
            'emojis': ['🤖']
        };

        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        img.exif = exif;
        let finalBuffer = await img.save(null);

        // Send sticker
        await conn.sendMessage(from, { 
            sticker: finalBuffer
        }, { quoted: m });

        // Cleanup
        setTimeout(() => {
            try {
                if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
            } catch (e) {}
        }, 30000);

    } catch (error) {
        console.error('Sticker Command Error:', error);
        reply("❌ Failed to create sticker. Try with different media.");
    }
});
