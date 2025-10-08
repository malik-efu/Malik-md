const { cmd } = require('../command');

// Simple storage for antitag settings
let antitagSettings = new Map();

cmd({
    pattern: "antitag",
    alias: ["antimention", "notag"],
    react: "🚫",
    desc: "Prevent mass tagging in groups",
    category: "group",
    use: ".antitag on/off",
    filename: __filename,
}, 
async (conn, mek, m, { from, isGroup, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ Group command only");
        if (!isAdmins) return reply("❌ Admins only");

        let action = m.body.split(' ')[1];

        if (!action) {
            return reply(`🚫 *Antitag System*\n\n.antitag on - Enable\n.antitag off - Disable`);
        }

        if (action === 'on') {
            antitagSettings.set(from, true);
            reply("✅ *Antitag Enabled*\n\nNow deleting messages with 3+ mentions");
        } 
        else if (action === 'off') {
            antitagSettings.delete(from);
            reply("✅ Antitag Disabled");
        }
        else {
            reply("❌ Use: .antitag on/off");
        }

    } catch (error) {
        console.error(error);
        reply("❌ Command error");
    }
});

// Tag Detection Handler - Add this to your main message handler
async function handleAntitag(conn, m) {
    try {
        let from = m.key.remoteJid;
        if (!from.endsWith('@g.us')) return;

        // Check if antitag is enabled for this group
        if (!antitagSettings.get(from)) return;

        // Get mentions from message
        let mentions = [];
        
        // Check for mentions in quoted/reply messages
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            mentions = m.message.extendedTextMessage.contextInfo.mentionedJid;
        }
        
        // Check for @mentions in text
        if (m.message?.conversation?.includes('@')) {
            let textMentions = m.message.conversation.match(/@\d+/g);
            if (textMentions) {
                mentions = [...mentions, ...textMentions.map(m => m + '@s.whatsapp.net')];
            }
        }

        // Remove duplicates and empty values
        mentions = [...new Set(mentions)].filter(jid => jid && jid !== conn.user.id);

        // If 3 or more mentions, delete the message
        if (mentions.length >= 3) {
            try {
                // Delete the message
                await conn.sendMessage(from, {
                    delete: {
                        remoteJid: from,
                        fromMe: false,
                        id: m.key.id,
                        participant: m.key.participant || m.key.remoteJid
                    }
                });

                // Send warning
                await conn.sendMessage(from, {
                    text: `⚠️ *Mass Tagging Detected!*\n\nMessage deleted. Don't tag multiple members!`
                });

            } catch (deleteError) {
                console.log('Delete failed, sending warning only');
                await conn.sendMessage(from, {
                    text: `⚠️ *Warning: Mass Tagging!*\n\nPlease avoid tagging multiple members.`
                });
            }
        }

    } catch (error) {
        console.error('Antitag handler error:', error);
    }
}

// Add this to your main message event
// conn.ev.on('messages.upsert', async ({ messages }) => {
//     let m = messages[0];
//     await handleAntitag(conn, m);
// });

module.exports = {
    handleAntitag
};
