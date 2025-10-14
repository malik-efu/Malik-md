const config = require('../config');
const { cmd } = require('../command');
const yts = require('yt-search');
const fetch = require('node-fetch');

cmd({
    pattern: "video2",
    alias: ["mp4", "song"],
    react: "🎥",
    desc: "Download video from YouTube",
    category: "download",
    use: ".video <query or url>",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a video name or YouTube URL!");

        let videoUrl, title;

        // Check if it's a URL
        if (q.match(/(youtube\.com|youtu\.be)/)) {
            videoUrl = q;
            const videoInfo = await yts({ videoId: q.split(/[=/]/).pop() });
            title = videoInfo.title;
        } else {
            // Search YouTube
            const search = await yts(q);
            if (!search.videos.length) return await reply("❌ No results found!");
            videoUrl = search.videos[0].url;
            title = search.videos[0].title;
        }

        await reply("⏳ Downloading video...");

        // Fetch API key from GitHub
        const keyRes = await fetch('https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json');
        const keyData = await keyRes.json();
        const apiKey = keyData.api_key || keyData.key || keyData.API_KEY; // auto-detect key field

        if (!apiKey) return await reply("❌ API key not found in JSON!");

        // Use the new API with your key
        const apiUrl = `https://api.nayan.download/ytmp4?url=${encodeURIComponent(videoUrl)}&apikey=${apiKey}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success) return await reply("❌ Failed to download video!");

        await conn.sendMessage(from, {
            video: { url: data.result.download_url },
            mimetype: 'video/mp4',
            caption: `*${title}*`
        }, { quoted: mek });

        await reply(`✅ *${title}* downloaded successfully!`);

    } catch (error) {
        console.error(error);
        await reply(`❌ Error: ${error.message}`);
    }
});
