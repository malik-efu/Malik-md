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
async (conn, mek, m, { from, text, q, reply }) => {
    try {
        const songTitle = q || text.split(' ').slice(1).join(' ');
        
        if (!songTitle) {
            return reply("🎵 *Lyrics Finder*\n\nUsage: .lyrics <song name>\nExample: .lyrics shape of you");
        }

        await reply("🔍 Searching for lyrics...");

        const apiUrl = `https://lyricsapi.fly.dev/api/lyrics?q=${encodeURIComponent(songTitle)}`;
        const response = await axios.get(apiUrl, { timeout: 15000 });

        if (!response.data?.result?.lyrics) {
            return reply(`❌ No lyrics found for "${songTitle}"`);
        }

        let lyrics = response.data.result.lyrics;
        const maxChars = 4000;

        // Split lyrics if too long
        if (lyrics.length > maxChars) {
            lyrics = lyrics.substring(0, maxChars) + '...\n\n📝 *Lyrics truncated due to length*';
        }

        await conn.sendMessage(from, {
            text: `🎵 *Lyrics for: ${songTitle}*\n\n${lyrics}`,
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
        
        let errorMessage = `❌ Failed to get lyrics for "${q}"`;
        
        if (error.response?.status === 404) {
            errorMessage = `❌ No lyrics found for "${q}"`;
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = '❌ Lyrics service unavailable. Try again later.';
        } else if (error.code === 'TIMEOUT') {
            errorMessage = '❌ Search timeout. Please try again.';
        }
        
        reply(errorMessage);
    }
});
