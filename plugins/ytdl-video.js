const { cmd } = require('../command');
const yts = require('yt-search');
const ytdl = require('ytdl-core');

cmd({
    pattern: "video",
    alias: ["mp4", "song"],
    react: "🎥",
    desc: "Download video from YouTube",
    category: "download",
    use: ".video <query or url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) {
            return await reply("❌ Please provide a video name or a YouTube URL.");
        }

        let videoUrl;
        // Check if the query is a valid YouTube URL
        if (ytdl.validateURL(q)) {
            videoUrl = q;
        } else {
            // If not a URL, search on YouTube
            const searchResult = await yts(q);
            if (!searchResult.videos.length) {
                return await reply("❌ No videos found for your query!");
            }
            videoUrl = searchResult.videos[0].url;
        }

        // Get video information directly from YouTube
        const info = await ytdl.getInfo(videoUrl);
        const videoLength = parseInt(info.videoDetails.lengthSeconds);

        // Optional: Check if the video is longer than 1 hour (3600 seconds)
        if (videoLength > 3600) {
            return await reply("❌ Video is too long! Please choose a video that is 1 hour or less.");
        }

        const videoTitle = info.videoDetails.title;
        const thumbnail = info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url; // Get best quality thumbnail

        // Send a message with the thumbnail that you are starting the download
        await conn.sendMessage(from, {
            image: { url: thumbnail },
            caption: `*${videoTitle}*\n\nDownloading your video, please wait...`
        }, { quoted: mek });

        // Select a suitable format (e.g., 720p or the highest available mp4 with audio)
        let format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'videoandaudio' });

        // Check if a valid format was found
        if (!format || !format.url) {
             return await reply("❌ Could not find a downloadable format for this video.");
        }

        // Send the video directly using the URL from ytdl-core
        await conn.sendMessage(from, {
            video: { url: format.url },
            mimetype: 'video/mp4',
            fileName: `${videoTitle}.mp4`,
            caption: `*${videoTitle}*\n\n> *_Powered by DARKZONE-MD_*`
        }, { quoted: mek });

    } catch (error) {
        console.error('[VIDEO] Command Error:', error);
        await reply("❌ Download failed. The video might be private, age-restricted, or have other restrictions.");
    }
});
