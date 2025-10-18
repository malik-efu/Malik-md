const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

cmd({
    pattern: "song",
    alias: ["play", "mp3"],
    react: "🎶",
    desc: "Download YouTube song using PrivateZia API",
    category: "main",
    use: '.song <song name>',
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        if (!q) return reply("Please provide a song name.");

        // NOTE: The original line for the 'SEARCHING SONG' message is here.
        // It's a standard text reply, so the image cannot be sent with it directly.
        // I will keep the existing processingMsg reply and then send the image separately 
        // after getting the song details, as requested.
        const processingMsg = await reply(`> SEARCHING SONG *${q}*...`);

        // API Request
        const apiUrl = `https://api.privatezia.biz.id/api/downloader/ytplaymp3?query=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl, {
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        if (!res.data || !res.data.status || !res.data.result) {
            // Delete the 'SEARCHING SONG' message if search fails
            if (processingMsg) await conn.sendMessage(from, { delete: processingMsg.key });
            return reply("❌ Failed to fetch song. Please try again.");
        }

        const { title, thumbnail, duration, downloadUrl, quality, videoUrl } = res.data.result;

        // --- NEW CODE BLOCK: Send the Thumbnail Image with the 'SEARCHING SONG' line ---
        
        // 1. Send the 'SEARCHING SONG' text
        await conn.sendMessage(from, { text: `> SEARCHING SONG *${q}*...` }, { quoted: mek }); 
        
        // 2. Send the image/thumbnail (as requested)
        await conn.sendMessage(from, { image: { url: thumbnail }, caption: `Title: *${title}* \nDuration: *${duration}s* \n_Downloading your song..._` }, { quoted: mek });
        
        // NOTE: The previous 'processingMsg' reply is now redundant, but kept it commented out if needed later.
        // The subsequent audio sending message will effectively hide this image when the rich preview takes effect.
        
        // --- END NEW CODE BLOCK ---
        
        // Temporary file path
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const tempFile = path.join(tempDir, `song_${Date.now()}.mp3`);

        // Download audio
        const audioResponse = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream',
            timeout: 120000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });

        await pipeline(audioResponse.data, fs.createWriteStream(tempFile));

        const audioBuffer = fs.readFileSync(tempFile);

        // Send audio (with thumbnail in rich preview but no separate image file)
        await conn.sendMessage(from, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: title.length > 25 ? `${title.substring(0, 22)}...` : title,
                    body: `🎶 ${quality.toUpperCase()} | Duration: ${duration}s\nDARKZONE-MD`,
                    mediaType: 1,
                    // The thumbnail URL is provided here for the rich media preview
                    thumbnailUrl: thumbnail,
                    sourceUrl: videoUrl,
                    showAdAttribution: false,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: mek });

        // Cleanup
        try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch { }

    } catch (error) {
        console.error("Error:", error);
        reply("❌ Something went wrong. Please try again later.");
    }
});
