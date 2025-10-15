const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

// Izumi API configuration (remains the same)
const izumi = {
    baseURL: "https://izumiiiiiiii.dpdns.org"
};

cmd({
    pattern: "drama",
    alias: ["episode"],
    react: "🎭",
    desc: "Download a drama episode from YouTube.",
    category: "download",
    use: ".drama <drama name> episode <number>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        // --- 1. Input Validation and Parsing ---
        if (!q || !q.toLowerCase().includes('episode')) {
            return await reply("❌ Please provide the drama name and episode number.\n\n*Example:*\n.drama Ertugrul episode 1");
        }

        const parts = q.toLowerCase().split('episode');
        const dramaName = parts[0].trim();
        const episodeNumber = parts[1].trim();

        if (!dramaName || !episodeNumber || isNaN(parseInt(episodeNumber))) {
            return await reply("❌ Invalid format. Please use:\n.drama <drama name> episode <number>");
        }

        // --- 2. YouTube Search ---
        const searchQuery = `${dramaName} episode ${episodeNumber} full episode`;
        await reply(`⏳ Searching for "*${dramaName} Episode ${episodeNumber}*" on YouTube...`);

        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return await reply(`❌ Sorry, I couldn't find "${dramaName} Episode ${episodeNumber}".`);
        }

        const videoResult = videos[0];
        const videoUrl = videoResult.url;
        const videoTitle = videoResult.title;
        const videoThumbnail = videoResult.thumbnail;

        // --- 3. Send Thumbnail and "Downloading" Message ---
        try {
            await conn.sendMessage(from, {
                image: { url: videoThumbnail },
                caption: `*Title:* ${videoTitle}\n\nDownloading your episode. This may take a moment...`
            }, { quoted: mek });
        } catch (e) {
            console.error('[DRAMA] Thumbnail sending error:', e?.message || e);
            // We can continue even if the thumbnail fails to send
        }

        // --- 4. Get Download Link from API ---
        const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(videoUrl)}&format=720`;

        const res = await axios.get(apiUrl, {
            timeout: 60000, // Increased timeout for potentially larger files
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.data || !res.data.result || !res.data.result.download) {
            return await reply("❌ The API failed to provide a download link. Please try again later.");
        }

        const downloadUrl = res.data.result.download;
        const finalTitle = res.data.result.title || videoTitle;

        // --- 5. Send Drama as a Document ---
        await conn.sendMessage(from, {
            document: { url: downloadUrl }, // This sends the file as a document
            mimetype: 'video/mp4',
            fileName: `${finalTitle}.mp4`,
            caption: `*${finalTitle}*\n\n> Here is your requested drama episode!`
        }, { quoted: mek });

    } catch (error) {
        console.error('[DRAMA] Command Error:', error?.message || error);
        await reply("❌ An error occurred while downloading the drama: " + (error?.message || 'Unknown error'));
    }
});
