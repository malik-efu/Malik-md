const axios = require('axios');
const { sticker } = require('../src/libraries/sticker.js');
const { cmd } = require('../command');

cmd({
    pattern: "stickerpack",
    alias: ["spack", "getpack"],
    react: "📦",
    desc: "Download sticker pack from getstickerpack.com",
    category: "download",
    use: ".stickerpack <url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(`❌ Please provide a sticker pack URL\nExample: .stickerpack https://getstickerpack.com/stickers/flork-memes-4-1`);
        }

        const url = q;
        const response = await axios.get(`https://api.akuari.my.id/downloader/stickerpack?link=${url}`);
        const json = response.data;

        if (!json.result && !Array.isArray(json)) {
            throw new Error('No sticker pack found');
        }

        const stickerData = json.result || json;
        
        for (const data of stickerData) {
            const stikers = await sticker(false, data, global.packname, global.author);
            await conn.sendFile(from, stikers, null, {
                asSticker: true
            }, m, true, {
                contextInfo: {
                    'forwardingScore': 200,
                    'isForwarded': true
                }
            }, {
                quoted: m
            });
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

    } catch (error) {
        console.error('Sticker Pack Error:', error);
        reply(`❌ Failed to download sticker pack. Please check the URL and try again.`);
    }
});
