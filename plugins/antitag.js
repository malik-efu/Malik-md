const config = require('../config');
const { cmd } = require('../command');

// Antitag Command - Simplified and Fixed
cmd({
    pattern: "antitag",
    alias: ["antimention"],
    react: "🚫",
    desc: "Prevent mass tagging in groups",
    category: "group",
    use: ".antitag on/off",
    filename: __filename,
}, 
async (conn, mek, m, { from, q, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        // Basic checks
        if (!isGroup) return reply("❌ This command only works in groups");
        if (!isAdmins) return reply("❌ Only group admins can use this command");
        if (!isBotAdmins) return reply("❌ Bot needs admin role");

        const action = q?.toLowerCase();

        if (!action) {
            return reply(`🚫 *Antitag System*\n\n.antitag on - Enable protection\n.antitag off - Disable protection`);
        }

        // Simple storage in memory (replace with your database later)
        global.antitag = global.antitag || {};
        
        if (action === 'on') {
            global.antitag[from] = { enabled: true, action: 'delete' };
            return reply("✅ *Antitag enabled!*\nBot will delete mass tagging messages.");
        }
        else if (action === 'off') {
            delete global.antitag[from];
            return reply("✅ *Antitag disabled*");
        }
        else if (action === 'status') {
            const status = global.antitag[from] ? 'Enabled' : 'Disabled';
            return reply(`📊 *Antitag Status:* ${status}`);
        }
        else {
            return reply("❌ Use: .antitag on/off");
        }

    } catch (error) {
        console.error('Antitag Command Error:', error);
        return reply("❌ Command failed. Try again.");
    }
});

// Simple tag detection handler
async function handleTagDetection(conn, from, m, sender) {
    try {
        if (!from.endsWith('@g.us')) return;

        // Check if antitag is enabled for this group
        if (!global.antitag || !global.antitag[from]) return;

        // Check for mentions
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        // If 3 or more people are tagged
        if (mentions.length >= 3) {
            try {
                // Delete the message
                await conn.sendMessage(from, {
                    delete: {
                        remoteJid: from,
                        fromMe: false,
                        id: m.key.id,
                        participant: sender
                    }
                });

                // Send warning
                await conn.sendMessage(from, {
                    text: `⚠️ *Mass Tagging Detected!*\nMessage deleted by antitag system.`
                });

            } catch (deleteError) {
                console.log('Delete failed, might not have permission');
            }
        }
    } catch (error) {
        console.error('Tag detection error:', error);
    }
}

module.exports = {
    handleTagDetection
};
