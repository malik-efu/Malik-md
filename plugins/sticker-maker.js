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
            return reply("🎵 *Lyrics Finder*\n\nUsage: .lyrics <song name>\nExample: .lyrics pal pal har pal");
        }

        await reply("🔍 Searching for lyrics...");

        // Use a working lyrics API
        const apiUrl = `https://api.popcat.xyz/lyrics?song=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl, { timeout: 15000 });

        if (!response.data || !response.data.lyrics) {
            return reply(`❌ No lyrics found for "${q}"\n\nTry: .lyrics "pal pal har pal"`);
        }

        let lyrics = response.data.lyrics;
        const title = response.data.title || q;
        const artist = response.data.artist || 'Unknown Artist';

        // Format and limit lyrics
        const maxChars = 3500;
        if (lyrics.length > maxChars) {
            lyrics = lyrics.substring(0, maxChars) + '...\n\n📝 *Lyrics truncated due to length limit*';
        }

        const lyricsText = `🎵 *${title}* - ${artist}\n\n${lyrics}\n\n🎶 *Powered by Knight Bot*`;

        await conn.sendMessage(from, { 
            text: lyricsText 
        }, { quoted: m });

    } catch (error) {
        console.error('Lyrics Error:', error);
        
        if (error.response?.status === 404) {
            reply(`❌ Lyrics not found for "${q}"\n\nTry with exact song title like:\n• .lyrics "pal pal har pal"\n• .lyrics "tere sang yara"`);
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            reply('❌ Lyrics service unavailable. Try again later.');
        } else if (error.code === 'TIMEOUT') {
            reply('❌ Search timeout. Please try again.');
        } else {
            reply(`❌ Could not fetch lyrics for "${q}"\n\nTry: .lyrics "pal pal har pal"`);
        }
    }
});
