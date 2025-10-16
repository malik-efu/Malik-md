const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

// Izumi API configuration (remains the same)
const izumi = {
    baseURL: "https://izumiiiiiiii.dpdns.org"
};

const SHORT_VIDEO_CATEGORIES = {
    'sad_short': 'sad video song short whatsapp status',
    'funny_short': 'funny comedy short clip whatsapp',
    'islamic_short': 'islamic short video status reels',
    'love_short': 'romantic love video short status',
    'tech_short': 'technology facts short video reels',
    'food_short': 'quick cooking recipe short video',
    'dance_short': 'trending dance video short reels',
    'news_short': 'latest world news short update'
};

cmd({
    pattern: "yts_shorts",
    alias: Object.keys(SHORT_VIDEO_CATEGORIES).concat(['shorts', 'shortvid', 'shortvideo']),
    react: "🎬",
    desc: "Download short videos/reels from YouTube based on a category.",
    category: "download",
    use: ".shorts <category> or use aliases like .funny_short",
    filename: __filename
}, async (conn, m, mek, { from, q, reply, prefix, command }) => {
    try {
        let baseQuery;
        
        // --- 1. Determine Search Query Based on Command or Input ---
        if (command in SHORT_VIDEO_CATEGORIES) {
            // If the user used an alias (e.g., .funny_short)
            baseQuery = SHORT_VIDEO_CATEGORIES[command];
        } else if (q && command === 'yts_shorts') {
            // If the user used the main command with a specific query
            baseQuery = `${q} short video reels status`;
        } else {
            // If no category/query is provided, show the menu
            let menuText = "*🎬 YouTube Short Video Menu 🎬*\n\n" +
                           "Please select a category to download a random short video:\n\n";
            
            for (const key in SHORT_VIDEO_CATEGORIES) {
                // Formatting the command key for the user (e.g., sad_short -> .sad_short)
                menuText += `*${prefix}${key}*\n`;
            }
            menuText += `\n*Example:* ${prefix}funny_short`;
            
            return await reply(menuText);
        }

        // --- 2. Send Searching Message ---
        await reply(`*⏳ Searching for ${baseQuery}... Please wait.*`);

        // --- 3. Optimized YouTube Search for Shorts ---
        const searchResults = await yts({ query: baseQuery, maxResults: 15 });
        
        if (!searchResults.videos || searchResults.videos.length === 0) {
            return await reply(`❌ Sorry, I couldn't find any short video results for that category.`);
        }

        // --- 4. Smarter Video Selection (Finds the first video under 60 seconds) ---
        let videoResult = null;
        for (const video of searchResults.videos) {
            if (video.seconds > 5 && video.seconds <= 60) {
                videoResult = video;
                break; // Stop searching once a suitable short video is found
            }
        }
        
        if (!videoResult) {
            return await reply(`❌ Couldn't find a video between 5 and 60 seconds long for that search term. Try a different category.`);
        }

        const videoUrl = videoResult.url;
        const videoTitle = videoResult.title;
        const videoThumbnail = videoResult.thumbnail;

        // --- 5. Send Thumbnail and "Downloading" Message ---
        await conn.sendMessage(from, {
            image: { url: videoThumbnail },
            caption: `*Found Short Video:*\n${videoTitle}\n\n✅ *DOWNLOADING (Max 60s video)...*`
        }, { quoted: mek });

        // --- 6. Get Download Link from API ---
        // Changed format to 360p as a test, as some APIs block higher resolutions.
        const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(videoUrl)}&format=360`;

        const res = await axios.get(apiUrl, {
            timeout: 60000, 
            headers: {
                // Keeping the robust User-Agent
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.data || !res.data.result || !res.data.result.download) {
            return await reply("❌ The API failed to provide a download link. Please try again later.");
        }

        const downloadUrl = res.data.result.download;
        const finalTitle = res.data.result.title || videoTitle;
        
        // --- 7. Send Short Video as a Video Message ---
        await conn.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            caption: `*${finalTitle}*\n\n> Here is your requested short video!`,
            fileName: `${finalTitle}.mp4`,
        }, { quoted: mek });

    } catch (error) {
        // --- Enhanced Error Handling for 403 ---
        if (axios.isAxiosError(error) && error.response && error.response.status === 403) {
            console.error('[YTS_SHORTS] API Forbidden Error (403):', error.message);
            await reply("❌ Download failed: The download service is currently blocking access (HTTP 403 Forbidden). This usually means the API is temporarily overloaded or restricting requests from the bot's server. Please try again in a few minutes.");
        } else {
            console.error('[YTS_SHORTS] Command Error:', error?.message || error);
            await reply("❌ An error occurred while downloading the short video: " + (error?.message || 'Unknown error'));
        }
    }
});
