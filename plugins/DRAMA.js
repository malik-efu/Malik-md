const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "inline",
    alias: ["inl", "onlinemembers"],
    react: "💫",
    desc: "Show active (recently online) members in group",
    category: "group",
    use: ".inline",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) return reply("❌ This command only works in groups.");

        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants.map(p => p.id);

        // Fallback image if group has none
        const pp = await conn.profilePictureUrl(from, 'image').catch(() => 'https://files.catbox.moe/xr2m6u.jpg');

        // Get recent messages from chat memory
        const messages = conn.chats?.[from]?.messages
            ? Object.values(conn.chats[from].messages)
            : [];

        // Set time window (e.g. 10 minutes)
        const activeWindowMs = 10 * 60 * 1000; 
        const now = Date.now();

        // Find participants who recently sent messages
        const recentUsers = messages
            .filter(msg => msg.messageTimestamp && (now - msg.messageTimestamp * 1000) < activeWindowMs)
            .map(msg => msg.key.participant || msg.key.remoteJid)
            .filter(id => participants.includes(id))
            .filter((id, index, arr) => id && arr.indexOf(id) === index);

        if (recentUsers.length === 0) {
            return reply("🟡 No active members in the last 10 minutes.");
        }

        const text = recentUsers
            .map((id, i) => `*${i + 1}.* @${id.split("@")[0]}`)
            .join("\n");

        await conn.sendMessage(from, {
            image: { url: pp },
            caption: `💫 *Recently Active Members (Last 10 min)*\n\n${text}\n\n📊 *Total:* ${recentUsers.length}`,
            contextInfo: { mentionedJid: recentUsers }
        }, { quoted: m });

    } catch (err) {
        console.error("Inline Command Error:", err);
        reply(`⚠️ Error: ${err.message}`);
    }
});
