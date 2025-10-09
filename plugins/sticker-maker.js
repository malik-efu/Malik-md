const axios = require('axios');
const config = require('../config');
const { cmd } = require('../command');

cmd({
    pattern: "lyrics",
    alias: ["songlyrics", "lyric"],
    react: "🎵",
    desc: "Get song lyrics",
    category: "music",
    use: ".lyrics <song name>",
    filename: __filename,
}, 
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply("🎵 *Lyrics Finder*\n\nUsage: .lyrics <song name>\nExample: .lyrics shape of you");
        }

        await reply("🔍 Searching for lyrics...");

        // Try multiple lyrics APIs
        const apis = [
            `https://api.lyrics.ovh/v1/${encodeURIComponent(q)}`,
            `https://some-random-api.com/lyrics?title=${encodeURIComponent(q)}`,
            `https://lyrist.vercel.app/api/${encodeURIComponent(q)}`
        ];

        let lyrics = null;
        let apiError = null;

        for (let apiUrl of apis) {
            try {
                const response = await axios.get(apiUrl, { timeout: 10000 });
                
                if (apiUrl.includes('lyrics.ovh') && response.data.lyrics) {
                    lyrics = response.data.lyrics;
                    break;
                } else if (apiUrl.includes('some-random-api') && response.data.lyrics) {
                    lyrics = response.data.lyrics;
                    break;
                } else if (apiUrl.includes('lyrist.vercel.app') && response.data.lyrics) {
                    lyrics = response.data.lyrics;
                    break;
                }
            } catch (error) {
                apiError = error;
                continue; // Try next API
            }
        }

        if (!lyrics) {
            return reply(`❌ No lyrics found for "${q}"\n\nTry with exact song name like: "Tere Sang Yara"`);
        }

        // Format lyrics
        const maxChars = 3500;
        let formattedLyrics = lyrics;
        
        if (lyrics.length > maxChars) {
            formattedLyrics = lyrics.substring(0, maxChars) + '...\n\n📝 *Lyrics truncated*';
        }

        await conn.sendMessage(from, {
            text: `🎵 *${q}*\n\n${formattedLyrics}\n\n🎶 *Powered by Knight Bot*`,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363416743041101@newsletter',
                    newsletterName: "Lyrics Finder",
                    serverMessageId: 143,
                },
            },
        }, { quoted: m });

    } catch (error) {
        console.error('Lyrics Command Error:', error);
        
        // Better error messages
        if (error.message?.includes('Network Error') || error.code === 'ENOTFOUND') {
            reply('❌ Network error. Check your connection.');
        } else if (error.code === 'TIMEOUT') {
            reply('❌ Search timeout. Try again.');
        } else {
            reply(`❌ No lyrics found for "${q}"\n\nTry: .lyrics "tere sang yara"`);
        }
    }
});
