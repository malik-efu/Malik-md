const { cmd } = require("../command");
const fetch = require('node-fetch');

cmd({
    pattern: "moviedl",
    alias: ["filmdownload", "downloadmovie"],
    desc: "Download movies directly",
    category: "download",
    filename: __filename
}, async (client, message, match) => {
    try {
        if (!match) return await message.reply("❌ Usage: .moviedl <movie_name>");

        await message.reply("🎭 Searching movie...");

        // Using FlixHQ API for direct movie links
        const searchUrl = `https://api.consumet.org/movies/flixhq/${encodeURIComponent(match)}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.results || searchData.results.length === 0) {
            return await message.reply("❌ Movie not found.");
        }

        const movie = searchData.results[0];
        
        // Send movie info first
        await client.sendMessage(message.from, {
            image: { url: movie.image },
            caption: `🎬 *${movie.title}*\n📅 ${movie.releaseDate || 'N/A'}\n🔍 Getting download links...`
        });

        // Get movie details and download links
        const movieInfoUrl = `https://api.consumet.org/movies/flixhq/info?id=${movie.id}`;
        const infoResponse = await fetch(movieInfoUrl);
        const infoData = await infoResponse.json();

        if (infoData.episodes && infoData.episodes.length > 0) {
            const episode = infoData.episodes[0];
            
            // Get streaming links
            const streamUrl = `https://api.consumet.org/movies/flixhq/watch?episodeId=${episode.id}&mediaId=${movie.id}`;
            const streamResponse = await fetch(streamUrl);
            const streamData = await streamResponse.json();

            // Send as document
            if (streamData.sources && streamData.sources.length > 0) {
                const downloadSource = streamData.sources[0];
                
                await client.sendMessage(message.from, {
                    document: { url: downloadSource.url },
                    fileName: `${movie.title}.mp4`,
                    mimetype: 'video/mp4',
                    caption: `🎬 *${movie.title}*\n📥 Download Ready!\n🛜 Quality: ${downloadSource.quality || 'HD'}`
                });
            } else {
                await message.reply("❌ No download links available.");
            }
        } else {
            await message.reply("❌ Movie not available for download.");
        }

    } catch (error) {
        await message.reply(`❌ Download failed: ${error.message}`);
    }
});
