const { setAntitag, getAntitag, removeAntitag } = require('../lib/index');
const config = require('../config');
const { cmd } = require('../command');

// Antitag Command
cmd({
    pattern: "antitag",
    alias: ["antimention", "notag"],
    react: "🚫",
    desc: "Prevent mass tagging in groups",
    category: "group",
    use: ".antitag on/off/set delete|kick",
    filename: __filename,
}, 
async (conn, mek, m, { from, q, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command only works in groups");
        if (!isAdmins) return reply("❌ Only group admins can use this command");
        if (!isBotAdmins) return reply("❌ Bot needs to be admin");

        const args = q ? q.toLowerCase().split(' ') : [];
        const action = args[0];

        if (!action) {
            return reply(`🚫 *Antitag System*\n\n• .antitag on\n• .antitag set delete\n• .antitag set kick\n• .antitag off\n• .antitag get`);
        }

        switch (action) {
            case 'on':
                await setAntitag(from, 'on', 'delete');
                await reply("✅ *Antitag Enabled*\nAction: Delete messages");
                break;

            case 'off':
                await removeAntitag(from);
                await reply("✅ *Antitag Disabled*");
                break;

            case 'set':
                const setAction = args[1];
                if (!setAction) return reply("❌ Use: .antitag set delete | kick");
                if (!['delete', 'kick'].includes(setAction)) return reply("❌ Choose: delete or kick");
                
                await setAntitag(from, 'on', setAction);
                await reply(`✅ *Action set to:* ${setAction}`);
                break;

            case 'get':
                const status = await getAntitag(from);
                if (status) {
                    await reply(`📊 *Antitag Status*\nEnabled: Yes\nAction: ${status.action || 'delete'}`);
                } else {
                    await reply("📊 *Antitag Status*\nEnabled: No");
                }
                break;

            default:
                await reply("❌ Invalid option");
        }
    } catch (error) {
        console.error('Antitag Error:', error);
        reply("❌ Command failed");
    }
});

// Tag Detection - Add this to your main message handler
async function handleTagDetection(conn, from, m, sender) {
    try {
        if (!from.endsWith('@g.us')) return;

        const antitag = await getAntitag(from);
        if (!antitag || !antitag.enabled) return;

        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        if (mentions.length >= 3) {
            const group = await conn.groupMetadata(from);
            const threshold = Math.ceil(group.participants.length * 0.5);
            
            if (mentions.length >= threshold) {
                const action = antitag.action || 'delete';
                
                // Delete the message
                await conn.sendMessage(from, {
                    delete: {
                        remoteJid: from,
                        fromMe: false,
                        id: m.key.id,
                        participant: sender
                    }
                });

                if (action === 'kick') {
                    await conn.groupParticipantsUpdate(from, [sender], "remove");
                    await conn.sendMessage(from, {
                        text: `🚫 User kicked for mass tagging`
                    });
                } else {
                    await conn.sendMessage(from, {
                        text: `⚠️ Mass tagging detected - message deleted`
                    });
                }
            }
        }
    } catch (error) {
        console.error('Detection Error:', error);
    }
}

module.exports = {
    handleTagDetection
};
