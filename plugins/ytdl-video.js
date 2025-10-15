
const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');

// Pinterest API configuration
const pinterestAPI = {
    baseURL: "https://api.privatezia.biz.id/api/downloader/pinterestdl"
};

cmd({
    pattern: "pins",
    alias: ["pinterest", "pint"],
    react: "📌",
    desc: "Download video from Pinterest as document",
    category: "download",
    use: ".pins <pinterest_url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a Pinterest URL!");
        
        // Validate Pinterest URL
        if (!q.includes('pinterest.com') && !q.includes('pin.it')) {
            return await reply("❌ Please provide a valid Pinterest URL!");
        }

        // ⏳ React - processing
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        // Get Pinterest download link from API
        const apiUrl = `${pinterestAPI.baseURL}?url=${encodeURIComponent(q)}`;
        
        const res = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'accept': '*/*'
            }
        });

        if (!res.data || !res.data.status || !res.data.data || !res.data.data.medias) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return await reply("❌ Failed to download from Pinterest API.");
        }

        const pinterestData = res.data.data;
        const medias = pinterestData.medias;

        // Find the best quality video (prefer mp4)
        const videoMedia = medias.find(media => 
            media.extension === 'mp4' && media.videoAvailable
        );

        // Find the best quality image
        const imageMedia = medias.find(media => 
            media.extension === 'jpg' && !media.videoAvailable
        );

        if (videoMedia) {
            // Send video as document
            await conn.sendMessage(from, {
                document: { url: videoMedia.url },
                mimetype: 'video/mp4',
                fileName: `Pinterest Video.mp4`,
                caption: `*Pinterest Video Downloaded*\n\n> ${config.DESCRIPTION}`
            }, { quoted: mek });
            
            // ✅ React - success
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
            
        } else if (imageMedia) {
            // Send image as document
            await conn.sendMessage(from, {
                document: { url: imageMedia.url },
                mimetype: 'image/jpeg',
                fileName: `Pinterest Pic.jpg`,
                caption: `*Pinterest Image*\n\n> ${config.DESCRIPTION}`
            }, { quoted: mek });
            
            // ✅ React - success
            await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
            
        } else {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            await reply("❌ No downloadable media found. Please provide a video URL.");
        }

    } catch (error) {
        console.error('[PINTEREST] Command Error:', error?.message || error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        await reply("❌ Download failed: " + (error?.message || 'Unknown error'));
    }
});

