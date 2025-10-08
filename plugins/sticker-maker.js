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
    use: ".antitag on/off/set delete|kick/get",
    filename: __filename,
}, 
async (conn, mek, m, {
    from, quoted, body, isCmd, command, args, q, isGroup, sender, 
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
                const existingConfig = await getAntitag(from);
                if (existingConfig && existingConfig.enabled) {
                    return reply("✅ Antitag is already enabled");
                }
                const result = await setAntitag(from, true, 'delete');
                await reply(result ? "✅ *Antitag has been enabled*\n\nDefault action: Delete messages" : "❌ Failed to enable antitag");
                break;

            case 'off':
                await removeAntitag(from);
                await reply("✅ *Antitag has been disabled*");
                break;

            case 'set':
                if (!subAction) {
                    return reply("❌ Please specify action: .antitag set delete | kick");
                }
                if (!['delete', 'kick'].includes(subAction)) {
                    return reply("❌ Invalid action. Choose: delete or kick");
                }
                const currentConfig = await getAntitag(from);
                const setResult = await setAntitag(from, currentConfig?.enabled || true, subAction);
                await reply(setResult ? `✅ *Antitag action set to: ${subAction}*` : "❌ Failed to set antitag action");
                break;

            case 'get':
                const status = await getAntitag(from);
                await reply(`📊 *Antitag Status*\n\n• Enabled: ${status?.enabled ? 'Yes' : 'No'}\n• Action: ${status?.action || 'Not set'}`);
                break;

            default:
                await reply("❌ Invalid option. Use .antitag for usage info");
        }
    } catch (error) {
        console.error('Antitag Command Error:', error);
        reply("❌ Error processing antitag command");
    }
});

// Enhanced Tag Detection Handler
async function handleTagDetection(conn, from, m, sender) {
    try {
        if (!from.endsWith('@g.us')) return;

        const antitagSetting = await getAntitag(from);
        if (!antitagSetting || !antitagSetting.enabled) return;

        // Get mentions from different message types
        let mentions = [];
        
        // Check extended text message (reply with mentions)
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            mentions = m.message.extendedTextMessage.contextInfo.mentionedJid.filter(jid => jid !== '');
        }
        
        // Check conversation for @ mentions
        if (m.message?.conversation) {
            const textMentions = m.message.conversation.match(/@\d+/g);
            if (textMentions) {
                // Convert @mentions to proper JIDs
                mentions = [...mentions, ...textMentions.map(mention => mention + '@s.whatsapp.net')];
            }
        }

        // Remove duplicates and bot's own JID
        mentions = [...new Set(mentions)].filter(jid => jid !== conn.user.id);

        console.log(`Antitag Debug: Found ${mentions.length} mentions in message`);

        // Check if it's mass tagging (3 or more mentions)
        if (mentions.length >= 3) {
            const groupMetadata = await conn.groupMetadata(from);
            const participants = groupMetadata.participants || [];
            
            // Calculate threshold (50% of group members)
            const mentionThreshold = Math.max(3, Math.ceil(participants.length * 0.5));
            
            console.log(`Antitag Debug: Threshold is ${mentionThreshold}, Group size: ${participants.length}`);

            if (mentions.length >= mentionThreshold) {
                const action = antitagSetting.action || 'delete';
                const senderName = m.pushName || 'User';
                
                console.log(`Antitag Action: ${action} triggered by ${senderName}`);

                try {
                    // Delete the offending message
                    await conn.sendMessage(from, {
                        delete: {
                            remoteJid: from,
                            fromMe: false,
                            id: m.key.id,
                            participant: sender
                        }
                    });
                    
                    if (action === 'delete') {
                        // Send warning for delete action
                        await conn.sendMessage(from, {
                            text: `⚠️ *Mass Tagging Detected!*\n\nMessage from @${sender.split('@')[0]} was deleted.\nDon't tag multiple members!`,
                            mentions: [sender]
                        });
                        
                    } else if (action === 'kick') {
                        // Kick the user
                        await conn.groupParticipantsUpdate(from, [sender], "remove");
                        
                        // Send kick notification
                        await conn.sendMessage(from, {
                            text: `🚫 *Mass Tagging Detected!*\n\n@${sender.split('@')[0]} has been kicked for tagging multiple members.`,
                            mentions: [sender]
                        });
                    }
                    
                } catch (actionError) {
                    console.error('Antitag Action Error:', actionError);
                    // If deletion fails, at least send a warning
                    await conn.sendMessage(from, {
                        text: `⚠️ *Mass Tagging Warning!*\n\n@${sender.split('@')[0]} please avoid tagging multiple members.`,
                        mentions: [sender]
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
