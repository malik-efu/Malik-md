const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "listonline",
    alias: ["online", "linea", "enlinea"],
    react: "🟢",
    desc: "Show online users in group",
    category: "group",
    use: ".listonline",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (!isGroup) {
            return reply("❌ This command only works in groups");
        }

        const pp = await conn.profilePictureUrl(from, 'image').catch((_) => 'https://files.catbox.moe/xr2m6u.jpg')
        
        // Safe way to get chat participants
        let participants = [];
        
        try {
            // Method 1: Try to get from group metadata
            const groupMetadata = await conn.groupMetadata(from);
            participants = groupMetadata.participants.map(p => p.id);
        } catch (error) {
            // Method 2: Try to get from chat messages (original method but safe)
            if (conn.chats && conn.chats[from] && conn.chats[from].messages) {
                const messages = conn.chats[from].messages;
                participants = Object.values(messages)
                    .map((item) => item.key?.participant)
                    .filter((value, index, self) => value && self.indexOf(value) === index);
            } else {
                // Method 3: Get from current message participants
                participants = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            }
        }

        // Filter and sort participants
        const participantesOrdenados = participants
            .filter(participante => participante && participante !== conn.user.id)
            .sort((a, b) => {
                if (a && b) {
                    return a.split("@")[0].localeCompare(b.split("@")[0])
                }
                return 0
            })
        
        const listaEnLinea = participantesOrdenados.length > 0
            ? participantesOrdenados.map((k) => `*●* @${k.split("@")[0]}`).join("\n")
            : "ꕥ No hay usuarios en línea en este momento."
        
        await conn.sendMessage(from, { 
            image: { url: pp }, 
            caption: `*❀ Lista de usuarios en línea:*\n\n${listaEnLinea}\n\n> Total: ${participantesOrdenados.length} usuarios\n> DARKZONE-MD`, 
            contextInfo: { 
                mentionedJid: participantesOrdenados 
            }
        }, { quoted: m })
        
    } catch (error) {
        console.error('Online List Error:', error)
        reply(`⚠️ A problem has occurred.\n\n${error.message}`)
    }
})
