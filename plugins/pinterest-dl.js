const { cmd } = require('../command');

cmd({
    pattern: "listonline",
    alias: ["online", "linea", "enlinea"],
    react: "👥",
    desc: "Show online users in group",
    category: "group",
    use: ".listonline",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) {
            return reply("❌ This command only works in groups");
        }

        // Get group profile picture
        const pp = await conn.profilePictureUrl(from, 'image').catch((_) => null);
        
        // Get group participants
        const groupMetadata = await conn.groupMetadata(from);
        const participants = groupMetadata.participants || [];
        
        // Create sorted list of participants
        const sortedParticipants = participants
            .map(p => p.id)
            .filter(id => id)
            .sort((a, b) => a.split("@")[0].localeCompare(b.split("@")[0]));
        
        const onlineList = sortedParticipants
            .map((jid) => `• @${jid.split("@")[0]}`)
            .join("\n") || "❌ No users found in this group.";

        const caption = `👥 *Online Users List - ${groupMetadata.subject}*\n\n${onlineList}\n\nTotal Users: ${sortedParticipants.length}\n\n> _DARKZONE-MD_`;

        await conn.sendMessage(from, { 
            image: pp ? { url: pp } : undefined, 
            caption: caption, 
            contextInfo: { 
                mentionedJid: sortedParticipants 
            }
        }, { quoted: m });

    } catch (error) {
        console.error('Online List Error:', error);
        reply("❌ Failed to get online users list. Please try again.");
    }
})
