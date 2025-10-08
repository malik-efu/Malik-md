const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const config = require('../config');
const { cmd } = require('../command');

// Helper function to check group and admin status
async function ensureGroupAndAdmin(conn, from, sender, reply) {
    try {
        const isGroup = from.endsWith('@g.us');
        if (!isGroup) {
            reply('❌ This command can only be used in groups.');
            return { ok: false };
        }
        
        // Check admin status of sender and bot
        const isAdmin = require('../lib/isAdmin');
        const adminStatus = await isAdmin(conn, from, sender);
        
        if (!adminStatus.isBotAdmin) {
            reply('❌ Please make the bot an admin first.');
            return { ok: false };
        }
        if (!adminStatus.isSenderAdmin) {
            reply('❌ Only group admins can use this command.');
            return { ok: false };
        }
        return { ok: true };
    } catch (error) {
        console.error('Error in ensureGroupAndAdmin:', error);
        reply('❌ Error checking admin status.');
        return { ok: false };
    }
}

// Set Group Photo Command
cmd({
    pattern: "setgpp",
    alias: ["setgrouppp", "setgrouppic", "setgroupphoto"],
    react: "🖼️",
    desc: "Set group profile photo (Admin only - reply to image)",
    category: "group",
    use: ".setgpp (reply to image/sticker)",
    filename: __filename,
}, 
async (conn, mek, m, {
    from, l, quoted, body, isCmd, command, args, q, isGroup, sender, 
    senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, 
    groupMetadata, groupName, participants, isItzcp, groupAdmins, 
    isBotAdmins, isAdmins, reply 
}) => {
    try {
        // Check group and admin status
        const check = await ensureGroupAndAdmin(conn, from, sender, reply);
        if (!check.ok) return;

        // Check if there's a quoted message
        if (!quoted) {
            return reply('❌ Please reply to an image or sticker message with .setgpp');
        }

        // Check for image or sticker in quoted message
        const imageMessage = quoted.imageMessage || quoted.stickerMessage;
        if (!imageMessage) {
            return reply('❌ Please reply to an image or sticker message only.');
        }

        // Create temporary directory
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // Download and process the image
        const stream = await downloadContentFromMessage(imageMessage, 'image');
        let buffer = Buffer.from([]);
        
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        // Check if buffer has data
        if (buffer.length === 0) {
            return reply('❌ Failed to download image data.');
        }

        // Save temporary file
        const imgPath = path.join(tmpDir, `gpp_${Date.now()}.jpg`);
        fs.writeFileSync(imgPath, buffer);

        // Update group profile picture
        await conn.updateProfilePicture(from, { url: imgPath });
        
        // Clean up temporary file
        try {
            if (fs.existsSync(imgPath)) {
                fs.unlinkSync(imgPath);
            }
        } catch (cleanupError) {
            console.warn('Warning: Could not delete temp file:', cleanupError);
        }
        
        // Success message
        await reply('✅ Group profile photo updated successfully!');
        
    } catch (error) {
        console.error('❌ Error in setgpp command:', error);
        
        let errorMessage = '❌ Failed to update group profile photo. ';
        
        // Specific error handling
        if (error.message.includes('Not authorized')) {
            errorMessage += 'Bot does not have sufficient permissions.';
        } else if (error.message.includes('rate limit')) {
            errorMessage += 'Rate limit exceeded. Please try again later.';
        } else if (error.message.includes('downloadContentFromMessage')) {
            errorMessage += 'Failed to process the image.';
        } else if (error.message.includes('updateProfilePicture')) {
            errorMessage += 'Could not update profile picture.';
        } else {
            errorMessage += 'Please try again with a different image.';
        }
        
        await reply(errorMessage);
    }
});
