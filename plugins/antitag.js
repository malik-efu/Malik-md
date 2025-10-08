const { setAntitag, getAntitag, removeAntitag } = require('../lib/index');
const isAdmin = require('../lib/isAdmin');
const { cmd } = require('../command');

// Antitag Command
cmd({
    pattern: "antitag",
    alias: ["antitagall", "notag"],
    desc: "Prevent mass tagging in groups",
    category: "group",
    use: ".antitag on/off/set delete|kick",
    filename: __filename
}, async (conn, mek, m, { from, body, isCmd, command, args, q, isGroup, sender, isAdmins, reply }) => {
    try {
        if (!isGroup) {
            return reply("❌ This command can only be used in groups");
        }

        if (!isAdmins) {
            return reply("❌ For Group Admins Only!");
        }

        const prefix = '.';
        const argsList = body.slice(9).toLowerCase().trim().split(' ');
        const action = argsList[0];

        if (!action) {
            const usage = `ANTITAG SETUP\n\n${prefix}antitag on\n${prefix}antitag set delete | kick\n${prefix}antitag off`;
            return reply(usage);
        }

        switch (action) {
            case 'on':
                const existingConfig = await getAntitag(from, 'on');
                if (existingConfig?.enabled) {
                    return reply("*_Antitag is already on_*");
                }
                const result = await setAntitag(from, 'on', 'delete');
                return reply(result ? '*_Antitag has been turned ON_*' : '*_Failed to turn on Antitag_*');
                break;

            case 'off':
                await removeAntitag(from, 'on');
                return reply('*_Antitag has been turned OFF_*');
                break;

            case 'set':
                if (argsList.length < 2) {
                    return reply(`*_Please specify an action: ${prefix}antitag set delete | kick_*`);
                }
                const setAction = argsList[1];
                if (!['delete', 'kick'].includes(setAction)) {
                    return reply('*_Invalid action. Choose delete or kick._*');
                }
                const setResult = await setAntitag(from, 'on', setAction);
                return reply(setResult ? `*_Antitag action set to ${setAction}_*` : '*_Failed to set Antitag action_*');
                break;

            case 'get':
                const status = await getAntitag(from, 'on');
                const actionConfig = await getAntitag(from, 'on');
                return reply(`*_Antitag Configuration:_*\nStatus: ${status ? 'ON' : 'OFF'}\nAction: ${actionConfig ? actionConfig.action : 'Not set'}`);
                break;

            default:
                return reply(`*_Use ${prefix}antitag for usage._*`);
        }
    } catch (error) {
        console.error('Error in antitag command:', error);
        return reply('*_Error processing antitag command_*');
    }
});

// Tag Detection Handler (Keep this as is for the event handler)
async function handleTagDetection(sock, chatId, message, senderId) {
    try {
        const antitagSetting = await getAntitag(chatId, 'on');
        if (!antitagSetting || !antitagSetting.enabled) return;

        // Check if message contains mentions
        const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || 
                        message.message?.conversation?.match(/@\d+/g) ||
                        [];

        // Check if it's a group message and has multiple mentions
        if (mentions.length > 0 && mentions.length >= 3) {
            // Get group participants to check if it's tagging most/all members
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants || [];
            
            // If mentions are more than 50% of group members, consider it as tagall
            const mentionThreshold = Math.ceil(participants.length * 0.5);
            
            if (mentions.length >= mentionThreshold) {
                
                const action = antitagSetting.action || 'delete';
                
                if (action === 'delete') {
                    // Delete the message
                    await sock.sendMessage(chatId, {
                        delete: {
                            remoteJid: chatId,
                            fromMe: false,
                            id: message.key.id,
                            participant: senderId
                        }
                    });
                    
                    // Send warning
                    await sock.sendMessage(chatId, {
                        text: `⚠️ *Tagall Detected!*.`
                    }, { quoted: message });
                    
                } else if (action === 'kick') {
                    // First delete the message
                    await sock.sendMessage(chatId, {
                        delete: {
                            remoteJid: chatId,
                            fromMe: false,
                            id: message.key.id,
                            participant: senderId
                        }
                    });

                    // Then kick the user
                    await sock.groupParticipantsUpdate(chatId, [senderId], "remove");

                    // Send notification
                    const usernames = [`@${senderId.split('@')[0]}`];
                    await sock.sendMessage(chatId, {
                        text: `🚫 *Antitag Detected!*\n\n${usernames.join(', ')} has been kicked for tagging all members.`,
                        mentions: [senderId]
                    }, { quoted: message });
                }
            }
        }
    } catch (error) {
        console.error('Error in tag detection:', error);
    }
}

module.exports = {
    handleTagDetection
};
