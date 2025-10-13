const axios = require('axios');
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

        const pp = await conn.profilePictureUrl(from, 'image').catch((_) => 'https://files.catbox.moe/xr2m6u.jpg')
        
        let id = from;
        
        // Safe access to chat data
        let participantesUnicos = [];
        if (conn.chats && conn.chats[id] && conn.chats[id].messages) {
            participantesUnicos = Object.values(conn.chats[id].messages)
                .map((item) => item.key?.participant)
                .filter(participant => participant && typeof participant === 'string')
                .filter((value, index, self) => self.indexOf(value) === index);
        }

        const participantesOrdenados = participantesUnicos
            .filter(participante => participante)
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
            caption: `*❀ Lista de usuarios en línea:*\n\n${listaEnLinea}\n\n> Knight Bot`, 
            contextInfo: { mentionedJid: participantesOrdenados }
        }, { quoted: m })

    } catch (error) {
        console.error('Online List Error:', error);
        
        // Fallback: Show basic group participants
        try {
            const groupMetadata = await conn.groupMetadata(from);
            const participants = groupMetadata.participants || [];
            
            const participantList = participants
                .map(p => `*●* @${p.id.split('@')[0]}`)
                .join('\n');
                
            await conn.sendMessage(from, {
                text: `*❀ Usuarios del grupo:*\n\n${participantList}\n\n> Total: ${participants.length} usuarios`
            }, { quoted: m });
            
        } catch (fallbackError) {
            reply(`⚠️ Error showing users. Try again later.`);
        }
    }
})
