const { cmd } = require('../command');
const yts = require('yt-search');
const axios = require('axios');

cmd({
    pattern: "ytmp4",
    alias: ["drama2", "song", "ytv"],
    desc: "Download YouTube videos",
    category: "downloader",
    react: "📹",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply("📺 Please provide video name or URL!\n\nExample: .video funny cat");

        // Search on YouTube if query is not a link
        let url = q;
        let title = "YouTube Video"; // Default title
        let thumbnail = null; // Variable for thumbnail URL
        
        if (!q.includes("youtube.com") && !q.includes("youtu.be")) {
            const { videos } = await yts(q);
            if (!videos || videos.length === 0) return await reply("❌ No results found!");
            url = videos[0].url;
            title = videos[0].title;
            thumbnail = videos[0].thumbnail; // Capture thumbnail
        }

        // --- Fetch video download data ---
        const api = `https://gtech-api-xtp1.onrender.com/api/video/yt?apikey=APIKEY&url=${encodeURIComponent(url)}`;
        const res = await axios.get(api);
        const json = res.data;

        if (!json?.status || !json?.result?.media) {
            return await reply("❌ Download failed! Try again later.");
        }

        const media = json.result.media;
        
        // Use the title from the API if the search was by URL or to ensure accuracy
        if (media.title) {
            title = media.title;
        }
        
        // Use the thumbnail from the API if available, or fall back to yts thumbnail if available.
        // NOTE: The API data structure provided doesn't show a direct 'thumbnail' field. 
        // For a more complete solution, you might need an API that provides it, 
        // but we'll use the 'yts' thumbnail for the preview message if the search was by text.
        
        const videoUrl = media.video_url_hd !== "No HD video URL available"
            ? media.video_url_hd
            : media.video_url_sd !== "No SD video URL available"
                ? media.video_url_sd
                : null;

        if (!videoUrl) return await reply("❌ No downloadable video found!");

        // --- ENHANCED FANCY MESSAGE CREATION ---
        
        // 1. Fancy Title Line with Bar and Emojis
        const fancyTitle = `『 🎬 **D R A M A • R E Q U E S T** 🎭 』`; 

        // 2. Stylish Caption with Title and Bot Name
        const captionText = `
${fancyTitle}

✨ *Title:* ${title}
━━━━━━━━━━━━━━
🔗 *Link:* ${url}
━━━━━━━━━━━━━━
💾 *Status:* File is Downloading...
_Please wait, your drama is on its way!_

*Powered By:* ⚡️ ```Power Dubai DarkZone``` 👑
        `.trim();

        // 3. Send the Initial Fancy Preview Message (Thumbnail + Title)
        await conn.sendMessage(from, {
            image: { url: thumbnail || 'https://telegra.ph/file/99634e0fa70b86a81137c.jpg' }, // Use thumbnail or a placeholder image
            caption: captionText,
            fileName: title.substring(0, 30) + '.jpg', // Keep the file name relevant
            mimetype: 'image/jpeg',
            contextInfo: {
                // Optional: For extra style, you can add a forwarding message, or a GIF/Video ad below it
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: mek });
        
        // 4. Send Video as a Document (Draw)
        // This fulfills your request to send the video as a 'Draw' (document).
        await conn.sendMessage(from, {
            document: { url: videoUrl },
            mimetype: 'video/mp4',
            fileName: title + '.mp4',
            caption: `*🎬 Download Complete! Enjoy the Drama! 🥳*\n\n*Powered By:* ⚡️ ```Power Dubai DarkZone``` 👑`,
        }, { quoted: mek });
        
        // Success reaction
        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });

    } catch (e) {
        console.error("Error in .video:", e);
        await reply("❌ An error occurred while processing your request. Please check the video URL and try again later!");
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
    }
});
