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
    if (!q) {
        return reply('🔍 Please enter the song name to get the lyrics! Usage: *lyrics <song name>*');
    }

    try {
        // Use lyricsapi.fly.dev and return only the raw lyrics text
        const apiUrl = `https://lyricsapi.fly.dev/api/lyrics?q=${encodeURIComponent(q)}`;
        const response = await axios.get(apiUrl);
        
        const data = response.data;

        const lyrics = data && data.result && data.result.lyrics ? data.result.lyrics : null;
        if (!lyrics) {
            return reply(`❌ Sorry, I couldn't find any lyrics for "${q}".`);
        }

        const maxChars = 4096;
        const output = lyrics.length > maxChars ? lyrics.slice(0, maxChars - 3) + '...' : lyrics;

        await conn.sendMessage(from, { text: output }, { quoted: m });
    } catch (error) {
        console.error('Error in lyrics command:', error);
        reply(`❌ An error occurred while fetching the lyrics for "${q}".`);
    }
});
