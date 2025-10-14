const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "inline",
    alias: ["inl", "onlinemembers"],
    react: "💫",
    desc: "Show online members in group",
    category: "group",
    use: ".inline",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) {
            return reply("❌ This command only works in groups.");
        }

        // Get group profile picture
        const pp = await conn.profilePictureUrl(from, 'image').catch(() => 'https://files.catbox.moe/xr2m6u.jpg');

        // Get group participants safely
        let participants = [];
        try {
            const groupMetadata = await conn.groupMetadata(from);
            participants = groupMetadata.participants;
        } catch (err) {
            return reply("⚠️ Unable to fetch group participant list.");
        }

        // Filter online participants
        const onlineMembers = participants
            .filter(p => p.id && p.isOnline)
            .map(p => p.id);

        // If no direct online data, fallback to all participants
        if (onlineMembers.length === 0) {
            return reply("📴 No members appear to be online right now.");
        }

        // Sort alphabetically by username/number
        const sortedOnline = onlineMembers.sort((a, b) => a.localeCompare(b));

        // Format message
        const messageText = sortedOnline
            .map((id, index) => `*${index + 1}.* @${id.split("@")[0]}`)
            .join("\n");

        // Send message
        await conn.sendMessage(from, {
            image: { url: pp },
            caption: `💫 *Online Members List*\n\n${messageText}\n\n📊 *Total Online:* ${sortedOnline.length}`,
            contextInfo: {
                mentionedJid: sortedOnline
            }
        }, { quoted: m });

    } catch (error) {
        console.error("Inline Command Error:", error);
        reply(`⚠️ Something went wrong.\n\n${error.message}`);
    }
});
