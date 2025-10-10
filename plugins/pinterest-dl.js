const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "pindl",
    alias: ["pinterestdl", "pin", "pins", "pindownload"],
    desc: "Download Pinterest media as Document",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { args, from, reply }) => {
    try {
        if (!args[0]) return reply('❎ Please provide Pinterest URL');

        const pinterestUrl = args[0];
        const response = await axios.get(`https://api.giftedtech.web.id/api/download/pinterestdl?apikey=gifted&url=${encodeURIComponent(pinterestUrl)}`);

        if (!response.data.success) {
            return reply('❎ Failed to fetch from Pinterest');
        }

        const media = response.data.result.media;
        const downloadUrl = media.find(item => item.type.includes('720p'))?.download_url || media[0].download_url;
        const title = response.data.result.title || 'Pinterest Media';

        // Download media
        const mediaResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        const mediaBuffer = Buffer.from(mediaResponse.data);

        // Create filename
        const isVideo = media[0].type.includes('video');
        const fileName = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}${isVideo ? '.mp4' : '.jpg'}`;
        const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';

        // Send as document
        await conn.sendMessage(from, { 
            document: mediaBuffer,
            fileName: fileName,
            mimetype: mimeType,
            caption: `📥 *Pinterest Download*\n\n📛 Title: ${title}\n📦 Format: Document\n🎬 Type: ${media[0].type}\n\n✅ Downloaded via DARKZONE-MD`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error(error);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('❎ Error: ' + error.message);
    }
});
