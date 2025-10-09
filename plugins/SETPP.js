const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { cmd } = require('../command');

cmd({
    pattern: "setppp",
    alias: ["setprofile", "setpic"],
    react: "🖼️",
    desc: "Set bot profile picture (Owner only)",
    category: "owner",
    use: ".setpp (reply to image)",
    filename: __filename,
}, 
async (conn, mek, m, { from, quoted, isOwner, reply }) => {
    try {
        if (!isOwner) {
            return reply("❌ This command is only available for the owner!");
        }

        if (!quoted) {
            return reply("🖼️ *Set Profile Picture*\n\nReply to an image with .setpp to update bot profile picture");
        }

        const imageMessage = quoted.imageMessage || quoted.stickerMessage;
        if (!imageMessage) {
            return reply("❌ Please reply to an image or sticker only");
        }

        await reply("⏳ Updating profile picture...");

        // Create tmp directory
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // Download image
        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const imagePath = path.join(tmpDir, `profile_${Date.now()}.jpg`);
        
        // Save image
        fs.writeFileSync(imagePath, buffer);

        // Set profile picture
        await conn.updateProfilePicture(conn.user.id, { url: imagePath });

        // Clean up
        try {
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        } catch (cleanupError) {
            console.log('Cleanup warning:', cleanupError);
        }

        await reply("✅ Successfully updated bot profile picture!");

    } catch (error) {
        console.error('Set Profile Picture Error:', error);
        reply("❌ Failed to update profile picture. Try with a different image.");
    }
});
