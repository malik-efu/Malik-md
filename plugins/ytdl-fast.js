const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { cmd } = require('../command');

cmd({
    pattern: "viewonce",
    alias: ["vo", "reveal", "showonce"],
    react: "👁️",
    desc: "Reveal view-once media",
    category: "media",
    use: ".viewonce (reply to view-once media)",
    filename: __filename
}, async (conn, mek, m, { from, quoted, reply }) => {
    try {
        if (!quoted) {
            return reply("❌ Please reply to a view-once image or video.");
        }

        const quotedImage = quoted.imageMessage;
        const quotedVideo = quoted.videoMessage;

        if (quotedImage && quotedImage.viewOnce) {
            await reply("🔄 Revealing view-once image...");
            
            const stream = await downloadContentFromMessage(quotedImage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            await conn.sendMessage(from, { 
                image: buffer, 
                fileName: 'revealed-image.jpg', 
                caption: quotedImage.caption || '👁️ *Revealed View-Once Image*' 
            }, { quoted: m });
            
        } else if (quotedVideo && quotedVideo.viewOnce) {
            await reply("🔄 Revealing view-once video...");
            
            const stream = await downloadContentFromMessage(quotedVideo, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            await conn.sendMessage(from, { 
                video: buffer, 
                fileName: 'revealed-video.mp4', 
                caption: quotedVideo.caption || '👁️ *Revealed View-Once Video*' 
            }, { quoted: m });
            
        } else {
            return reply("❌ The replied message is not a view-once media.\nPlease reply to a view-once image or video.");
        }

    } catch (error) {
        console.error('ViewOnce Command Error:', error);
        reply("❌ Failed to reveal view-once media. The media might have expired.");
    }
});
