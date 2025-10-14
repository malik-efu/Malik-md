const axios = require('axios');
const { cmd } = require('../command');

// Fixed Twitter Scraper Function
async function twitterScraper(url) {
    try {
        // Use a reliable Twitter download API
        const apiUrl = `https://twitsave.com/info?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);
        
        if (!response.data || !response.data.media || response.data.media.length === 0) {
            throw new Error('No media found in this tweet');
        }

        const media = response.data.media[0];
        
        if (media.type === 'video') {
            return {
                status: true,
                data: {
                    type: "video",
                    title: response.data.text || 'Twitter Video',
                    duration: media.duration || 'Unknown',
                    dl: [{ quality: 'HD', url: media.url }]
                }
            }
        } else if (media.type === 'image') {
            return {
                status: true,
                data: {
                    type: "image",
                    imageUrl: media.url
                }
            }
        } else {
            throw new Error('Unsupported media type');
        }
        
    } catch (error) {
        throw new Error('Failed to download from Twitter: ' + error.message);
    }
}

// Alternative Twitter Scraper (Backup)
async function twitterScraperBackup(url) {
    try {
        const apiUrl = `https://api.twittervideodownloader.com/twitter/video?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);
        
        if (response.data && response.data.video) {
            return {
                status: true,
                data: {
                    type: "video",
                    title: 'Twitter Video',
                    duration: 'Unknown',
                    dl: [{ quality: 'HD', url: response.data.video }]
                }
            }
        }
        throw new Error('No video found');
    } catch (error) {
        throw new Error('Backup API also failed');
    }
}

// Twitter Download Command
cmd({
    pattern: "twitte",
    alias: ["x", "xdl"],
    react: "🐦",
    desc: "Download Twitter/X videos and images",
    category: "download",
    use: ".twitter <twitter-url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(`❌ Please provide a Twitter/X URL\nExample: .twitter https://x.com/user/status/123456`);
        }

        // Validate Twitter URL
        if (!q.includes('x.com/') && !q.includes('twitter.com/')) {
            return reply(`❌ Invalid Twitter/X URL\nMust be from x.com or twitter.com`);
        }

        await reply("🕒 Downloading from Twitter...");

        let result;
        
        // Try main API first
        try {
            result = await twitterScraper(q);
        } catch (error) {
            // Try backup API
            console.log('Main API failed, trying backup...');
            result = await twitterScraperBackup(q);
        }

        if (!result.status) {
            return reply(`❌ Could not download from Twitter\n• Link may be invalid\n• Tweet may be private\n• Try again later`);
        }

        if (result.data.type === 'video') {
            const caption = `🐦 *Twitter Video*\n\n📹 Title: ${result.data.title}\n⏱️ Duration: ${result.data.duration}\n🔗 URL: ${q}\n\n📥 Downloaded by Knight Bot`;
            
            await conn.sendMessage(from, {
                video: { url: result.data.dl[0].url },
                caption: caption
            }, { quoted: m });
            
        } else {
            await conn.sendMessage(from, {
                image: { url: result.data.imageUrl },
                caption: `🐦 *Twitter Image*\n\n🔗 URL: ${q}\n\n📥 Downloaded by Knight Bot`
            }, { quoted: m });
        }

    } catch (error) {
        console.error('Twitter Download Error:', error);
        
        if (error.message.includes('No media found')) {
            reply('❌ No video or image found in this tweet');
        } else if (error.message.includes('Invalid')) {
            reply('❌ Invalid Twitter URL');
        } else if (error.message.includes('private')) {
            reply('❌ Cannot download from private tweets');
        } else {
            reply(`❌ Failed to download: ${error.message}\n\nTry a different Twitter link.`);
        }
    }
});
