const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);
const yts = require('yt-search');
const ytdl = require('ytdl-core'); // ⬅️ NEW: Using ytdl-core for direct download

cmd({
    pattern: "song",
    alias: ["play", "mp3"],
    react: "🎶",
    desc: "Download YouTube song directly (MP3/OGG)",
    category: "main",
    use: '.song <song name or YouTube link>',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply, q }) => {
    try {
        if (!q) return reply("Please provide a song name or YouTube link.");

        let video;
        let title = "YouTube Song";
        let thumbnail = "";
        let videoUrl = ''; // Define videoUrl

        // Handle both search queries and direct links
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
            videoUrl = q;
        } else {
            const search = await yts(q);
            if (!search || !search.videos.length) {
                return reply("No results found.");
            }
            video = search.videos[0];
            videoUrl = video.url;
            title = video.title;
            thumbnail = video.thumbnail;
        }

        // 1. Send processing message
        // ❌ REMOVED: Sending a processing message with title to adhere to the design change.
        // The bot will now just process and send the audio.
        
        // 2. Validate URL before proceeding
        if (!ytdl.validateURL(videoUrl)) {
            return reply("❌ Invalid YouTube URL. Please try a different link or search query.");
        }

        // 3. Get video info and set the title properly
        if (title === "YouTube Song") { // If we got a URL directly, get the title now
             const info = await ytdl.getInfo(videoUrl);
             title = info.videoDetails.title;
        }

        // Create temp directory
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFile = path.join(tempDir, `song_${Date.now()}.ogg`); // Use OGG for better quality/size

        try {
            // 4. FIX: Direct download using ytdl-core
            const audioStream = ytdl(videoUrl, {
                quality: 'lowestaudio', // Get the smallest audio stream
                filter: 'audioonly',
            });

            // Save to temporary file
            await pipeline(audioStream, fs.createWriteStream(tempFile));

            // Read the file buffer
            const audioBuffer = fs.readFileSync(tempFile);

            // 5. DESIGN CHANGE: Send the audio file with NO externalAdReply (title box)
            await conn.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/ogg', // Changed to OGG
                ptt: true, // Send as a voice note
                fileName: `${title.replace(/[^\w\s]/gi, '')}.ogg`,
            }, { quoted: mek });

        } catch (downloadError) {
            console.error("Download error:", downloadError);
            return reply("❌ Failed to download audio. The video may be restricted or too long.");
        } finally {
            // Clean up temporary files
            try {
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            } catch (cleanError) {
                console.error("Cleanup error:", cleanError);
            }
        }

    } catch (error) {
        console.error("Main error:", error);
        reply("❌ An unexpected error occurred. Please try again with a different song.");
    }
});
