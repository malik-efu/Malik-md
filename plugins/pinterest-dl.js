const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "pindl",
    alias: ["pinterestdl", "pin", "pins", "pindownload"],
    desc: "Download media from Pinterest as Document",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { args, quoted, from, reply }) => {
    try {
        // Make sure the user provided the Pinterest URL
        if (args.length < 1) {
            return reply('❎ Please provide the Pinterest URL to download from.');
        }

        // Extract Pinterest URL from the arguments
        const pinterestUrl = args[0];

        // Call your Pinterest download API
        const response = await axios.get(`https://api.giftedtech.web.id/api/download/pinterestdl?apikey=gifted&url=${encodeURIComponent(pinterestUrl)}`);

        if (!response.data.success) {
            return reply('❎ Failed to fetch data from Pinterest.');
        }

        const media = response.data.result.media;
        const description = response.data.result.description || 'No description available';
        const title = response.data.result.title || 'No title available';

        // Select the best video quality or you can choose based on size or type
        const downloadUrl = media.find(item => item.type.includes('720p'))?.download_url || media[0].download_url;

        // Prepare the caption
        const desc = `╭━━━〔 *DARKZONE-MD* 〕━━━┈⊷
┃▸╭───────────
┃▸┃๏ *PINS DOWNLOADER*
┃▸└───────────···๏
╰────────────────┈⊷
╭━━❐━⪼
┇๏ *Title* - ${title}
┇๏ *Media Type* - ${media[0].type}
┇๏ *Format* - Document
╰━━❑━⪼
> *𝐸𝑅𝐹𝒜𝒩 𝒜𝐻𝑀𝒜𝒟*`;

        // Download the media file
        const mediaResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        const mediaBuffer = Buffer.from(mediaResponse.data);

        // Determine file extension and name
        let fileName = `pinterest_${Date.now()}`;
        let mimeType = 'application/octet-stream';

        // Check media type and set appropriate file extension
        if (media[0].type.includes('video') || downloadUrl.includes('.mp4')) {
            fileName += '.mp4';
            mimeType = 'video/mp4';
        } else if (media[0].type.includes('image') || downloadUrl.includes('.jpg') || downloadUrl.includes('.png')) {
            fileName += '.jpg';
            mimeType = 'image/jpeg';
        } else {
            fileName += '.bin';
        }

        // Send as DOCUMENT
        await conn.sendMessage(from, { 
            document: mediaBuffer, 
            fileName: fileName,
            mimetype: mimeType,
            caption: desc
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (e) {
        console.error(e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply('❎ An error occurred while processing your request: ' + e.message);
    }
});
