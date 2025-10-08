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
async (conn, mek, m, {
    from, l, quoted, body, isCmd, command, args, q, isGroup, sender, 
    senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, 
    groupMetadata, groupName, participants, isItzcp, groupAdmins, 
    isBotAdmins, isAdmins, reply 
}) => {
    try {
        if (!isGroup) {
            return reply("❌ This command only works in groups");
        }

        if (!isAdmins) {
            return reply("❌ Only group admins can use this command");
        }

        if (!isBotAdmins) {
            return reply("❌ Bot needs to be admin to use antitag");
        }

        const action = q?.toLowerCase().split(' ')[0];
        const subAction = q?.toLowerCase().split(' ')[1];

        if (!action) {
            return reply(`🚫 *Antitag System*\n\n• .antitag on - Enable antitag\n• .antitag set delete - Delete tagall messages\n• .antitag set kick - Kick users who tagall\n• .antitag off - Disable antitag\n• .antitag get - Check status`);
        }

        switch (action) {
            case 'on':
                const existingConfig = await getAntitag(from, 'on');
                if (existingConfig?.enabled) {
                    return reply("✅ Antitag is already enabled");
                }
                const result = await setAntitag(from, 'on', 'delete');
                await reply(result ? "✅ *Antitag has been enabled*\n\nDefault action: Delete messages" : "❌ Failed to enable antitag");
                break;

            case 'off':
                await removeAntitag(from, 'on');
                await reply("✅ *Antitag has been disabled*");
                break;

            case 'set':
                if (!subAction) {
                    return reply("❌ Please specify action: .antitag set delete | kick");
                }
                if (!['delete', 'kick'].includes(subAction)) {
                    return reply("❌ Invalid action. Choose: delete or kick");
                }
                const setResult = await setAntitag(from, 'on', subAction);
                await reply(setResult ? `✅ *Antitag action set to: ${subAction}*` : "❌ Failed to set antitag action");
                break;

            case 'get':
                const status = await getAntitag(from, 'on');
                const actionConfig = await getAntitag(from, 'on');
                await reply(`📊 *Antitag Status*\n\n• Enabled: ${status ? 'Yes' : 'No'}\n• Action: ${actionConfig?.action || 'Not set'}`);
                break;

            default:
                await reply("❌ Invalid option. Use .antitag for usage info");
        }
    } catch (error) {
        console.error('Antitag Command Error:', error);
        reply("❌ Error processing antitag command");
    }
});

// Tag Detection Handler (Add this to your main message handler)
async function handleTagDetection(conn, from, m, sender) {
    try {
        if (!from.endsWith('@g.us')) return; // Only in groups

        const antitagSetting = await getAntitag(from, 'on');
        if (!antitagSetting || !antitagSetting.enabled) return;

        // Check if message contains mentions
        const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        // Check if it's mass tagging (3 or more mentions)
        if (mentions.length >= 3) {
            const groupMetadata = await conn.groupMetadata(from);
            const participants = groupMetadata.participants || [];
            
            // If mentions are more than 50% of group members
            const mentionThreshold = Math.ceil(participants.length * 0.5);
            
            if (mentions.length >= mentionThreshold) {
                const action = antitagSetting.action || 'delete';
                
                if (action === 'delete') {
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
                    
                } else if (action === 'kick') {
                    // Delete message first
                    await conn.sendMessage(from, {
                        delete: {
                            remoteJid: from,
                            fromMe: false,
                            id: m.key.id,
                            participant: sender
                        }
                    });

                    // Kick the user
                    await conn.groupParticipantsUpdate(from, [sender], "remove");

                    // Send notification
                    await conn.sendMessage(from, {
                        text: `🚫 *Mass Tagging Detected!*\n\nUser has been kicked for tagging multiple members.`
                    });
                }
            }
        }
    } catch (error) {
        console.error('Tag Detection Error:', error);
    }
}

module.exports = {
    handleTagDetection
};
