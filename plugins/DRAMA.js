const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "pindl1",
    alias: ["pinterestdl", "pin", "pins", "pindownload"],
    desc: "Download media from Pinterest",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { args, quoted, from, reply }) => {
    try {
        // Ensure user provided a Pinterest URL
        if (args.length < 1) {
            return reply('❎ Please provide a Pinterest URL to download from.');
        }

        // Extract the Pinterest URL
        const pinterestUrl = args[0];

        // Call the Pinterest downloader API
        const response = await axios.get(`https://api.giftedtech.web.id/api/download/pinterestdl?apikey=gifted&url=${encodeURIComponent(pinterestUrl)}`);

        if (!response.data.success) {
            return reply('❎ Failed to fetch data from Pinterest.');
        }

        const media = response.data.result.media;
        const description = response.data.result.description || 'No description available';
        const title = response.data.result.title || 'No title available';

        // Select the best available video quality
        const videoUrl = media.find(item => item.type.includes('720p'))?.download_url || media[0].download_url;

        // Caption message
        const desc = `╭━━━〔 *DARKZONE-MD* 〕━━━┈⊷
┃▸╭───────────
┃▸┃๏ *PINS DOWNLOADER*
┃▸└───────────···๏
╰────────────────┈⊷
╭━━❐━⪼
┇๏ *Title* - ${title}
┇๏ *Media Type* - ${media[0].type}
╰━━❑━⪼
> *𝐸𝑅𝐹𝒜𝒩 𝒜𝐻𝑀𝒜𝒟*`;

        // Send as DOCUMENT instead of VIDEO
        if (videoUrl) {
            await conn.sendMessage(
                from,
                {
                    document: { url: videoUrl },
                    mimetype: "video/mp4",
                    fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_') || 'PinterestVideo'}.mp4`,
                    caption: desc
                },
                { quoted: mek }
            );
        } else {
            // Fallback: send image as document if video not found
            const imageUrl = media.find(item => item.type === 'Thumbnail')?.download_url;
            await conn.sendMessage(
                from,
                {
                    document: { url: imageUrl },
                    mimetype: "image/jpeg",
                    fileName: `${title.replace(/[^a-zA-Z0-9]/g, '_') || 'PinterestImage'}.jpg`,
                    caption: desc
                },
                { quoted: mek }
            );
        }

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('❎ An error occurred while processing your request.');
    }
});
