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
    use: ".drama <search query>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        // --- 1. Input Validation ---
        if (!q) {
            return await reply("❌ Please provide the name of the drama and episode you want.\n\n*Example:*\n.drama Kurulus Osman episode 120");
        }

        // --- 2. More Flexible YouTube Search ---
        // IMPROVEMENT: Takes the user's entire query for a more flexible search.
        const searchQuery = `${q} full episode`;
        await reply(`*DARKZONE-MD ⏳ SEARCHING*  "*${q}*" `);

        const searchResults = await yts(searchQuery);
        if (!searchResults.videos || searchResults.videos.length === 0) {
            return await reply(`❌ Sorry, I couldn't find any results for "${q}".`);
        }

        // --- 3. Smarter Video Selection ---
        // IMPROVEMENT: Finds the first video longer than 20 minutes (1200 seconds) to ensure it's a full episode.
        let videoResult = null;
        for (const video of searchResults.videos) {
            if (video.seconds > 1200) { 
                videoResult = video;
                break; // Stop searching once a suitable video is found
            }
        }
        
        if (!videoResult) {
            return await reply(`❌ Couldn't find a full-length episode for "${q}". All results were too short.`);
        }

        const videoUrl = videoResult.url;
        const videoTitle = videoResult.title;
        const videoThumbnail = videoResult.thumbnail;

        // --- 4. Send Thumbnail and "Downloading" Message ---
        await conn.sendMessage(from, {
            image: { url: videoThumbnail },
            caption: `*Found:* ${videoTitle}\n\n✅ *DARKZONE-MD DOWNLOADING PLEASE WAIT SOME TIME...*`
        }, { quoted: mek });

        // --- 5. Get Download Link from API ---
        const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(videoUrl)}&format=720`;

        const res = await axios.get(apiUrl, {
            timeout: 90000, // Increased timeout for larger files
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.data || !res.data.result || !res.data.result.download) {
            return await reply("❌ The API failed to provide a download link. Please try again later.");
        }

        const downloadUrl = res.data.result.download;
        const finalTitle = res.data.result.title || videoTitle;
        
        

        // --- 6. Send Drama as a Document ---
        await conn.sendMessage(from, {
            document: { url: downloadUrl },
            mimetype: 'video/mp4',
            fileName: `${finalTitle}.mp4`,
            caption: `*${finalTitle}*\n\n> HERE IS YOUR REQUESTED DRAMA FULL EPISODE!`
        }, { quoted: mek });

    } catch (error) {
        console.error('[DRAMA] Command Error:', error?.message || error);
        await reply("❌ An error occurred while downloading the drama: " + (error?.message || 'Unknown error'));
    }
});
