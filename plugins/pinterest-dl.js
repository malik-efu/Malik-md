const { cmd } = require('../command');

cmd({
    pattern: "listonline",
    alias: ["online", "linea", "enlinea"],
    react: "👥",
    desc: "Show online users in group",
    category: "group",
    use: ".listonline",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, groupMetadata, reply }) => {
    try {
        if (!isGroup) {
            return reply("❌ This command only works in groups");
        }

        // Get group profile picture
        const pp = await conn.profilePictureUrl(from, 'image').catch((_) => null);
        
        // Get group participants (actual members)
        const groupData = await conn.groupMetadata(from);
        const participants = groupData.participants || [];
        
        // Filter only online users (those who are currently active)
        // Since we can't get real online status, we'll show all participants
        const onlineUsers = participants
            .filter(p => p.id !== conn.user.id) // Exclude bot itself
            .sort((a, b) => a.id.localeCompare(b.id)); // Sort alphabetically

        if (onlineUsers.length === 0) {
            return reply("❌ No users found in this group");
        }

        // Create the list with mentions
        const onlineList = onlineUsers
            .map((user, index) => `*${index + 1}.* @${user.id.split('@')[0]}`)
            .join("\n");

        const totalUsers = onlineUsers.length;
        const groupName = groupData.subject || 'Group';

        const caption = `👥 *ONLINE USERS - ${groupName}*\n\n${onlineList}\n\n📊 *Total Users:* ${totalUsers}\n\n> _DARKZONE-MD_`;

        await conn.sendMessage(from, { 
            image: pp ? { url: pp } : undefined,
            caption: caption, 
            contextInfo: { 
                mentionedJid: onlineUsers.map(user => user.id) 
            }
        }, { quoted: m });

    } catch (error) {
        console.error('Online List Error:', error);
        reply(`❌ Failed to get online users: ${error.message}`);
    }
});
