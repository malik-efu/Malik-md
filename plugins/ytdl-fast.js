const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

// Izumi API configuration
const izumi = {
    baseURL: "https://izumiiiiiiii.dpdns.org"
};

cmd({
    pattern: "audio", // Changed pattern to 'audio'
    alias: ["mp3", "yta"], // Changed aliases
    react: "🎵", // Changed reaction to a music note
    desc: "Download audio (MP3) from YouTube", // Updated description
    category: "download",
    use: ".audio <query or url>", // Updated usage
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ What audio do you want to download?"); // Updated message

        let videoUrl = '';
        let videoTitle = '';
        let videoThumbnail = '';
        
        // Determine if input is a YouTube link
        if (q.startsWith('http://') || q.startsWith('https://')) {
            videoUrl = q;
        } else {
            // Search YouTube for the video
            const { videos } = await yts(q);
            if (!videos || videos.length === 0) {
                return await reply("❌ No videos found!");
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
                    caption: `*${captionTitle}*\nDownloading audio...` // Updated caption
                }, { quoted: mek });
            }
        } catch (e) { 
            console.error('[AUDIO] thumb error:', e?.message || e); // Updated log tag
        }

        // Validate YouTube URL
        let urls = videoUrl.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
        if (!urls) {
            return await reply("❌ This is not a valid YouTube link!");
        }

        // Get Izumi API link for audio
        // The key change is here: changing the 'format' parameter to 'mp3' or removing it if the API defaults to audio. 
        // Based on the video code's structure, I'll assume 'mp3' is the appropriate format for audio.
        const apiUrl = `${izumi.baseURL}/downloader/youtube?url=${encodeURIComponent(videoUrl)}&format=mp3`; // Changed format to 'mp3'
        
        const res = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!res.data || !res.data.result || !res.data.result.download) {
            return await reply("❌ Izumi API failed to return a valid audio link."); // Updated message
        }

        const audioData = res.data.result;

        // Send audio directly using the download URL
        await conn.sendMessage(from, {
            audio: { url: audioData.download }, // Changed 'video' to 'audio'
            mimetype: 'audio/mp4', // Using m4a (audio/mp4) or a general audio type
            fileName: `${audioData.title || videoTitle || 'audio'}.mp3`, // Changed file extension
            caption: `*${audioData.title || videoTitle || 'Audio'}*\n\n> *_THIS IS DARKZONE-MD baby_*` // Updated caption/title
        }, { quoted: mek });

    } catch (error) {
        console.error('[AUDIO] Command Error:', error?.message || error); // Updated log tag
        await reply("❌ Audio download failed: " + (error?.message || 'Unknown error')); // Updated message
    }
});
