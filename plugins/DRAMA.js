const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

// Izumi API configuration
const izumi = {
    baseURL: "https://izumiiiiiiii.dpdns.org"
};

cmd({
    pattern: "drama",
    alias: ["dramavideo", "dramamp4"],
    react: "🎭",
    desc: "Download drama videos from YouTube",
    category: "download",
    use: ".drama <drama name or url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("❌ What drama video do you want to download?");

        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';
        
        // Determine if input is a YouTube link
        if (q.startsWith('http://') || q.startsWith('https://')) {
            videoUrl = q;
        } else {
            // Search YouTube for drama videos
            const searchQuery = q + " drama episode";
            const { videos } = await yts(searchQuery);
            if (!videos || videos.length === 0) {
                return reply("❌ No drama videos found!");
            }
            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            videoThumbnail = videos[0].thumbnail;
        }

        // Send thumbnail immediately
        try {
            const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];
            const thumb = videoThumbnail || (ytId ? `https://i.ytimg.com/vi/${ytId}/sddefault.jpg` : undefined);
            const captionTitle = videoTitle || q;
            if (thumb) {
                await conn.sendMessage(from, {
                    image: { url: thumb },
                    caption: `*${captionTitle}*\n🎭 Downloading drama video...`
                }, { quoted: mek });
            }
        } catch (e) { 
            console.error('[DRAMA] thumb error:', e?.message || e); 
        }

        // Validate YouTube URL
        let urls = videoUrl.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
        if (!urls) {
            return reply("❌ This is not a valid YouTube link!");
        }

        // Get Izumi API link for video
        const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(videoUrl)}&format=720`;
        
        const res = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!res.data || !res.data.result || !res.data.result.download) {
            return reply("❌ Failed to get drama video download link.");
        }

        const videoData = res.data.result;

        // Send drama video
        await conn.sendMessage(from, {
            video: { url: videoData.download },
            mimetype: 'video/mp4',
            fileName: `${videoData.title || videoTitle || 'drama'}.mp4`,
            caption: `🎭 *${videoData.title || videoTitle || 'Drama Video'}*\n\n> *_Downloaded by Knight Bot_*`
        }, { quoted: mek });

    } catch (error) {
        console.error('[DRAMA] Command Error:', error);
        reply("❌ Drama download failed: " + (error.message || 'Try again later'));
    }
});
