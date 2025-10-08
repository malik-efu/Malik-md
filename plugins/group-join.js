const config = require('../config')
const { cmd, commands } = require('../command')
const { isUrl } = require('../lib/functions')

cmd({
    pattern: "join",
    react: "📬",
    alias: ["joinme", "fjoin"],
    desc: "Join group using invite link",
    category: "group",
    use: '.join <whatsapp-group-link>',
    filename: __filename
}, async (conn, mek, m, { from, quoted, q, reply, isCreator }) => {
    try {
        // Only bot owner can use this command for security
        if (!isCreator) {
            return reply("❌ This command can only be used by bot owner");
        }

        if (!q && !quoted) {
            return reply("📝 *Usage:*\n.join <whatsapp-group-link>\nOr reply to a group link with .join");
        }

        let inviteCode;

        // Extract invite code from different sources
        if (quoted && quoted.text) {
            const text = quoted.text;
            if (text.includes('chat.whatsapp.com/')) {
                inviteCode = text.split('chat.whatsapp.com/')[1];
            } else if (text.length === 22) {
                // Direct invite code
                inviteCode = text;
            }
        } else if (q) {
            if (q.includes('chat.whatsapp.com/')) {
                inviteCode = q.split('chat.whatsapp.com/')[1];
            } else if (q.length === 22) {
                // Direct invite code
                inviteCode = q;
            }
        }

        if (!inviteCode) {
            return reply("❌ *Invalid Link Format*\n\nPlease provide a valid WhatsApp group invite link\nExample: https://chat.whatsapp.com/INVITE_CODE");
        }

        // Clean the invite code (remove any extra parameters)
        inviteCode = inviteCode.split('?')[0].split('/')[0].trim();

        if (inviteCode.length !== 22) {
            return reply("❌ *Invalid Invite Code*\n\nInvite code should be 22 characters long");
        }

        await reply("🔄 *Joining group...*");

        // Use the correct method to join group
        await conn.groupAcceptInvite(inviteCode);
        
        await reply("✅ *Successfully joined the group!*");

    } catch (error) {
        console.log('Join Command Error:', error);
        
        let errorMessage = "❌ *Failed to join group*";
        
        if (error.message?.includes('already')) {
            errorMessage = "❌ *Bot is already in this group*";
        } else if (error.message?.includes('invalid') || error.message?.includes('not found')) {
            errorMessage = "❌ *Invalid or expired group link*";
        } else if (error.message?.includes('limit')) {
            errorMessage = "❌ *Group join limit reached*";
        } else if (error.message?.includes('rejected')) {
            errorMessage = "❌ *Group join request was rejected*";
        } else if (error.message?.includes('banned')) {
            errorMessage = "❌ *Bot is banned from this group*";
        }
        
        reply(errorMessage);
    }
});
