const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "pindl",
    alias: ["pinterestdl", "pin", "pins", "pindownload"],
    desc: "Download media from Pinterest",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { args, quoted, from, reply }) => {
    try {
        if (args.length < 1) {
            return reply('❎ Please provide the Pinterest URL to download from.');
        }

        const pinterestUrl = args[0];
        const response = await axios.get(`https://api.giftedtech.web.id/api/download/pinterestdl?apikey=gifted&url=${encodeURIComponent(pinterestUrl)}`);

        if (!response.data.success) {
            return reply('❎ Failed to fetch data from Pinterest.');
        }

        const media = response.data.result.media;
        const title = response.data.result.title || 'Pinterest Video';

        const videoUrl = media.find(item => item.type.includes('720p'))?.download_url || media[0].download_url;

        const desc = `╭━━━〔 *PINTEREST DOWNLOAD* 〕━━━┈⊷
┃▸ *Title* - ${title}
┃▸ *Media Type* - ${media[0].type}
╰────────────────┈⊷`;

        // CHANGED: Send as DOCUMENT instead of video
        if (videoUrl) {
            await conn.sendMessage(from, { 
                document: { url: videoUrl }, 
                fileName: `${title}.mp4`,
                mimetype: 'video/mp4',
                caption: desc 
            }, { quoted: mek });
        } else {
            const imageUrl = media.find(item => item.type === 'Thumbnail')?.download_url;
            await conn.sendMessage(from, { 
                document: { url: imageUrl }, 
                fileName: `${title}.jpg`,
                mimetype: 'image/jpeg',
                caption: desc 
            }, { quoted: mek });
        }

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('❎ An error occurred while processing your request.');
    }
});
