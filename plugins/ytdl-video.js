const axios = require('axios');
const { cmd } = require('../command');

cmd({
    pattern: "pinterestdl",
    alias: ["pinterestdownload", "pindl"],
    react: "📌",
    desc: "Download Pinterest videos and images",
    category: "download",
    use: ".pinterestdl <pinterest-url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(`📌 Please enter a Pinterest URL!\n\nExample:\n.pinterestdl https://pin.it/4CVodSq`);
        }

        await reply("⏳ Downloading from Pinterest...");

        const api = await axios.get(`https://api.botcahx.eu.org/api/download/pinterest?url=${q}&apikey=${global.btc}`);
        const res = api.data;
        
        let { media_type, image, title } = res.result.data;
        
        if (media_type === 'video/mp4') {
            await conn.sendMessage(from, { 
                video: { url: image },
                caption: `📌 *Pinterest Video*\n\n*Title:* ${title || 'Pinterest Video'}\n*Source:* ${image}`
            }, { quoted: m });
        } else {
            await conn.sendMessage(from, { 
                image: { url: image },
                caption: `📌 *Pinterest Image*\n\n*Title:* ${title || 'Pinterest Image'}\n*Source:* ${image}`
            }, { quoted: m });
        }

    } catch (error) {
        console.error('Pinterest Download Error:', error);
        
        if (error.response?.status === 404) {
            reply("❌ Pinterest URL not found or invalid.");
        } else if (error.response?.status === 400) {
            reply("❌ Invalid Pinterest URL format.");
        } else {
            reply("❌ Failed to download from Pinterest. Please check the URL and try again.");
        }
    }
});
