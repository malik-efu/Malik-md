const axios = require('axios');
const { lookup } = require('mime-types');
const { cmd } = require('../command');

cmd({
    pattern: "mediafire1",
    alias: ["mf"],
    react: "📥",
    desc: "Download files from MediaFire",
    category: "download",
    use: ".mediafire <url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
    try {
        if (!q) return reply('❌ You forgot the MediaFire link.');
        
        if (!/^https:\/\/www\.mediafire\.com\//i.test(q)) {
            return reply('❌ Invalid MediaFire link.');
        }

        await reply("🕒 Downloading from MediaFire...");

        const res = await axios.get(`https://api.delirius.xyz/download/mediafire?url=${encodeURIComponent(q)}`);
        const json = res.data;
        const data = json.data;
        
        if (!json.status || !data?.filename || !data?.link) {
            throw new Error('❌ Could not get file from MediaFire.');
        }

        const filename = data.filename;
        const filesize = data.size || 'unknown';
        const mimetype = data.mime || lookup(data.extension?.toLowerCase()) || 'application/octet-stream';
        const dl_url = data.link.includes('u=') ? decodeURIComponent(data.link.split('u=')[1]) : data.link;
        
        const caption = `乂 MEDIAFIRE - DOWNLOAD 乂\n\n✩ Name » ${filename}\n✩ Size » ${filesize}\n✩ MimeType » ${mimetype}\n✩ Link » ${q}`;

        await conn.sendMessage(from, {
            document: { url: dl_url },
            fileName: filename,
            mimetype: mimetype,
            caption: caption
        }, { quoted: m });

    } catch (error) {
        console.error('MediaFire Download Error:', error);
        
        if (error.response?.status === 404) {
            reply('❌ File not found or link is invalid.');
        } else if (error.message.includes('Could not get file')) {
            reply('❌ Could not download file. File may be deleted or private.');
        } else {
            reply(`⚠️ A problem occurred.\n\n${error.message}`);
        }
    }
});
