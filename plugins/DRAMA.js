const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "pindl",
    alias: ["pinterestdl", "pin", "pins", "pindownload"],
    desc: "Download media from Pinterest (debug mode)",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { args, quoted, from, reply }) => {
    try {
        if (args.length < 1) {
            return reply('❎ Please provide a Pinterest URL to download from.');
        }

        const pinterestUrl = args[0];
        const apiUrl = `https://api.giftedtech.web.id/api/download/pinterestdl?apikey=gifted&url=${encodeURIComponent(pinterestUrl)}`;

        console.log('📡 Fetching:', apiUrl);

        const response = await axios.get(apiUrl);
        console.log('📦 API response data:', response.data);

        // ✅ Check if success key exists and contains a result
        if (!response.data || !response.data.result) {
            return reply('❎ API did not return a valid result. Check console for details.');
        }

        const media = response.data.result.media || [];
        if (!media.length) {
            return reply('❎ No media found in API response.');
        }

        const title = response.data.result.title || 'Pinterest_Media';
        const videoUrl = media[0].download_url;
        const desc = `📎 *Pinterest Download*
> *Title:* ${title}`;

        // Send as document
        await conn.sendMessage(from, {
            document: { url: videoUrl },
            mimetype: "video/mp4",
            fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`,
            caption: desc
        }, { quoted: mek });

    } catch (e) {
        console.error('❌ DEBUG ERROR:', e);
        reply('❎ An error occurred while processing your request. Check console for logs.');
    }
});
