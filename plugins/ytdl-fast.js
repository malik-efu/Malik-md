
const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);
const yts = require('yt-search');

cmd({
    pattern: "song",
    alias: ["play", "mp3"],
    react: "🎶",
    desc: "Download YouTube song using Izumi API",
    category: "main",
    use: '.song <song name or YouTube link>',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply, q }) => {
    try {
        if (!q) return reply("Please provide a song name or YouTube link.");

        let video;
        let title = "YouTube Song";
        let thumbnail = "";

        // Handle both search queries and direct links
        if (q.includes('youtube.com') || q.includes('youtu.be')) {
            video = { url: q, title: "YouTube Song" };
        } else {
            const search = await yts(q);
            if (!search || !search.videos.length) {
                return reply("No results found.");
            }
            video = search.videos[0];
            title = video.title;
            thumbnail = video.thumbnail;
        }

        // Send processing message
        const processingMsg = await reply(`🎵 Downloading: *${title}*`);

        // Use Izumi API
        const apiUrl = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(video.url)}&format=mp3`;
        
        const res = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!res.data || !res.data.result || !res.data.result.download) {
            throw new Error('Izumi API failed to return a valid link.');
        }

        const audioData = res.data.result;

        // Create temp directory
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const tempFile = path.join(tempDir, `song_${Date.now()}.mp3`);

        try {
            // Download the audio file
            const audioResponse = await axios({
                method: 'GET',
                url: audioData.download,
                responseType: 'stream',
                timeout: 120000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            // Save to temporary file
            await pipeline(audioResponse.data, fs.createWriteStream(tempFile));

            // Read the file buffer
            const audioBuffer = fs.readFileSync(tempFile);

            // Send the audio file with rich context
            await conn.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
                contextInfo: {
                    externalAdReply: {
                        title: title.length > 25 ? `${title.substring(0, 22)}...` : title,
                        body: "THIS IS DARKZONE-MD BOT BABY",
                        mediaType: 1,
                        thumbnailUrl: thumbnail,
                        sourceUrl: video.url,
                        showAdAttribution: false,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: mek });

        } catch (downloadError) {
            console.error("Download error:", downloadError);
            return reply("❌ Failed to download audio. Please try another song.");
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
        reply("❌ An error occurred. Please try again with a different song.");
    }
});
