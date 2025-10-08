const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions')

cmd({
    pattern: "join",
    react: "📬",
    alias: ["joinme", "f_join"],
    desc: "To Join a Group from Invite link",
    category: "group",
    use: '.join < Group Link >',
    filename: __filename
}, async (conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator, isDev, isAdmins, reply }) => {
    try {
        if (!q && !quoted) return reply("*Please provide the Group Link* 🖇️\n\nExample: .join https://chat.whatsapp.com/abc123");

        let groupLink;

        // Extract group invite code from various formats
        if (quoted && quoted.text && isUrl(quoted.text)) {
            groupLink = quoted.text.split('https://chat.whatsapp.com/')[1];
        } else if (q && isUrl(q)) {
            groupLink = q.split('https://chat.whatsapp.com/')[1];
        } else if (q) {
            // If just the invite code is provided
            groupLink = q;
        }

        if (!groupLink) return reply("❌ *Invalid Group Link*\n\nPlease provide a valid WhatsApp group invite link");

        await reply("⏳ Joining group...");

        // Accept the group invite
        await conn.groupAcceptInvite(groupLink.trim());
        
        await reply("✅ *Successfully Joined the Group!*");

    } catch (e) {
        console.log('Join Error:', e);
        
        let errorMsg = "❌ *Failed to join group*";
        
        if (e.message.includes('already')) {
            errorMsg = "❌ *Already in this group*";
        } else if (e.message.includes('invalid') || e.message.includes('not found')) {
            errorMsg = "❌ *Invalid or expired group link*";
        } else if (e.message.includes('limit')) {
            errorMsg = "❌ *Group join limit reached*";
        }
        
        reply(errorMsg);
    }
});
