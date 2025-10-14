const axios = require('axios');
const yts = require('yt-search');
const { cmd } = require('../command');

// YouTube Downloader API
const YT_API = "https://raw.githubusercontent.com/MOHAMMAD-NAYAN-07/Nayan/main/api.json";

let apiData = null;

// Function to get API endpoints
async function getAPIEndpoints() {
    try {
        if (!apiData) {
            const response = await axios.get(YT_API);
            apiData = response.data;
        }
        return apiData;
    } catch (error) {
        console.error('API Fetch Error:', error);
        return null;
    }
}

// Function to download YouTube video
async function downloadYouTubeVideo(url, quality = '360p') {
    try {
        const apiEndpoints = await getAPIEndpoints();
        if (!apiEndpoints) throw new Error('API not available');

        // Use available API endpoints for YouTube download
        const apis = [
            `${apiEndpoints.ytdl1 || 'https://api.erdwpe.com/api/downloader/youtube2'}?url=${encodeURIComponent(url)}`,
            `${apiEndpoints.ytdl2 || 'https://api.lolhuman.xyz/api/youtube'}?url=${encodeURIComponent(url)}&apikey=your_key`,
            `https://zenzapis.xyz/downloader/youtube?url=${encodeURIComponent(url)}&apikey=your_key`
        ];

        for (let apiUrl of apis) {
            try {
                const response = await axios.get(apiUrl, { timeout: 30000 });
                const data = response.data;
                
                // Extract video URL from different API responses
                let videoUrl = null;
                
                if (data.result && data.result.video) {
                    videoUrl = data.result.video;
                } else if (data.result && data.result.url) {
                    videoUrl = data.result.url;
                } else if (data.video) {
                    videoUrl = data.video;
                } else if (data.url) {
                    videoUrl = data.url;
                } else if (data.download) {
                    videoUrl = data.download;
                }

                if (videoUrl) {
                    return {
                        success: true,
                        url: videoUrl,
                        title: data.result?.title || data.title || 'YouTube Video',
                        duration: data.result?.duration || data.duration || 'Unknown',
                        quality: data.result?.quality || quality,
                        thumbnail: data.result?.thumbnail || data.thumbnail
                    };
                }
            } catch (error) {
                continue;
            }
        }
        
        throw new Error('All APIs failed');

    } catch (error) {
        console.error('YouTube Download Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// YouTube Video Download Command
cmd({
    pattern: "ytv",
    alias: ["ytvideo", "youtube", "vido"],
    react: "🎥",
    desc: "Download YouTube videos",
    category: "download",
    use: ".ytv <url or search term>",
    filename: __filename
}, async (conn, mek, m, { from, text, q, reply }) => {
    try {
        const input = q || text;
        if (!input) {
            return reply("🎥 *YouTube Video Downloader*\n\nUsage:\n.ytv <youtube-url>\n.ytv <search term>\n\nExample:\n.ytv https://youtu.be/abc123\n.ytv despacito");
        }

        await reply("⏳ Processing your request...");

        let videoUrl = input;
        let videoInfo = null;

        // If input is not a URL, search YouTube
        if (!input.match(/(youtube\.com|youtu\.be)/)) {
            const search = await yts(input);
            if (!search.videos.length) {
                return reply("❌ No videos found for your search.");
            }
            videoUrl = search.videos[0].url;
            videoInfo = search.videos[0];
        } else {
            // Get video info for URLs
            const search = await yts({ videoId: videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/)[1] });
            videoInfo = search;
        }

        // Send thumbnail first
        if (videoInfo?.thumbnail) {
            await conn.sendMessage(from, {
                image: { url: videoInfo.thumbnail },
                caption: `📥 *Downloading Video*\n\n📹 *Title:* ${videoInfo.title}\n⏱️ *Duration:* ${videoInfo.timestamp}\n👤 *Channel:* ${videoInfo.author?.name || 'Unknown'}\n\n⏳ Please wait...`
            }, { quoted: m });
        }

        // Download video
        const downloadResult = await downloadYouTubeVideo(videoUrl);
        
        if (!downloadResult.success) {
            throw new Error(downloadResult.error);
        }

        await reply("✅ Video downloaded! Sending now...");

        // Send the video
        await conn.sendMessage(from, {
            video: { url: downloadResult.url },
            caption: `🎥 *${videoInfo?.title || downloadResult.title}*\n\n⏱️ Duration: ${videoInfo?.timestamp || downloadResult.duration}\n📊 Quality: ${downloadResult.quality}\n👤 Channel: ${videoInfo?.author?.name || 'Unknown'}\n\n📥 *Downloaded by Knight Bot*`,
            fileName: `${(videoInfo?.title || downloadResult.title).substring(0, 50)}.mp4`
        }, { quoted: m });

    } catch (error) {
        console.error('YouTube Video Command Error:', error);
        
        if (error.message.includes('API not available')) {
            reply("❌ Download service is currently unavailable. Please try again later.");
        } else if (error.message.includes('All APIs failed')) {
            reply("❌ Failed to download video. The video may be too long or restricted.");
        } else if (error.message.includes('No videos found')) {
            reply("❌ No videos found. Please check your search term.");
        } else {
            reply(`❌ Download failed: ${error.message}`);
        }
    }
});

// YouTube Audio Download Command
cmd({
    pattern: "yta",
    alias: ["ytaudio", "audio"],
    react: "🎵",
    desc: "Download YouTube audio",
    category: "download",
    use: ".yta <url or search term>",
    filename: __filename
}, async (conn, mek, m, { from, text, q, reply }) => {
    try {
        const input = q || text;
        if (!input) {
            return reply("🎵 *YouTube Audio Downloader*\n\nUsage:\n.yta <youtube-url>\n.yta <search term>\n\nExample:\n.yta https://youtu.be/abc123\n.yta despacito song");
        }

        await reply("⏳ Processing your request...");

        let videoUrl = input;
        let videoInfo = null;

        // If input is not a URL, search YouTube
        if (!input.match(/(youtube\.com|youtu\.be)/)) {
            const search = await yts(input);
            if (!search.videos.length) {
                return reply("❌ No videos found for your search.");
            }
            videoUrl = search.videos[0].url;
            videoInfo = search.videos[0];
        }

        // Send thumbnail first
        if (videoInfo?.thumbnail) {
            await conn.sendMessage(from, {
                image: { url: videoInfo.thumbnail },
                caption: `📥 *Downloading Audio*\n\n🎵 *Title:* ${videoInfo.title}\n⏱️ *Duration:* ${videoInfo.timestamp}\n👤 *Channel:* ${videoInfo.author?.name || 'Unknown'}\n\n⏳ Please wait...`
            }, { quoted: m });
        }

        // Download audio using available APIs
        const apis = [
            `https://api.erdwpe.com/api/downloader/youtube3?url=${encodeURIComponent(videoUrl)}`,
            `https://api.lolhuman.xyz/api/ytaudio2?url=${encodeURIComponent(videoUrl)}&apikey=your_key`,
            `https://zenzapis.xyz/downloader/ytmp3?url=${encodeURIComponent(videoUrl)}&apikey=your_key`
        ];

        let audioUrl = null;
        for (let apiUrl of apis) {
            try {
                const response = await axios.get(apiUrl, { timeout: 30000 });
                const data = response.data;
                
                if (data.result && data.result.audio) audioUrl = data.result.audio;
                else if (data.result && data.result.url) audioUrl = data.result.url;
                else if (data.audio) audioUrl = data.audio;
                else if (data.url) audioUrl = data.url;
                
                if (audioUrl) break;
            } catch (error) {
                continue;
            }
        }

        if (!audioUrl) {
            throw new Error('Failed to get audio URL');
        }

        await reply("✅ Audio downloaded! Sending now...");

        // Send the audio
        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${(videoInfo?.title || 'audio').substring(0, 50)}.mp3`,
            caption: `🎵 *${videoInfo?.title || 'YouTube Audio'}*\n\n⏱️ Duration: ${videoInfo?.timestamp || 'Unknown'}\n👤 Channel: ${videoInfo?.author?.name || 'Unknown'}\n\n📥 *Downloaded by Knight Bot*`
        }, { quoted: m });

    } catch (error) {
        console.error('YouTube Audio Command Error:', error);
        reply(`❌ Audio download failed: ${error.message}`);
    }
});
