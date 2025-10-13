const { cmd } = require("../command");
const fetch = require('node-fetch');

const RAPIDAPI_KEY = 'adb03fd619msh91f2556557237f4p10f659jsn96ca8c5079ee';
const RAPIDAPI_HOST = 'streaming-availability.p.rapidapi.com';

cmd({
    pattern: "movie",
    alias: ["moviedownload", "film"],
    desc: "Search movies and get streaming info",
    category: "download",
    filename: __filename
}, async (client, message, match) => {
    try {
        if (!match) return await message.reply("❌ Usage: .movie <movie_name>");

        await message.reply("🎭 Searching movie database...");

        // Use YOUR Streaming Availability API (this one works for sure)
        const searchUrl = `https://${RAPIDAPI_HOST}/search/title?title=${encodeURIComponent(match)}&country=us`;
        
        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': RAPIDAPI_HOST,
                'x-rapidapi-key': RAPIDAPI_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.result || data.result.length === 0) {
            return await message.reply(`❌ No movie found for "${match}"`);
        }

        const movie = data.result[0];
        
        // Build movie info
        let movieInfo = `🎬 *${movie.title}* (${movie.year || 'N/A'})\n`;
        movieInfo += `⭐ IMDb: ${movie.imdbRating || 'N/A'}/10\n`;
        movieInfo += `⏱️ Runtime: ${movie.runtime || 'N/A'} mins\n`;
        movieInfo += `🎭 Genres: ${movie.genres?.join(', ') || 'N/A'}\n\n`;
        
        // Streaming info
        if (movie.streamingInfo && movie.streamingInfo.us) {
            movieInfo += `📺 *Available on:*\n`;
            movie.streamingInfo.us.forEach(service => {
                movieInfo += `• ${service.service}\n`;
            });
            movieInfo += `\n💡 *Tip:* Use these platforms to watch legally`;
        } else {
            movieInfo += `📺 *Not available on major platforms*\n`;
        }

        // Send thumbnail + info
        if (movie.posterPath) {
            await client.sendMessage(message.from, {
                image: { url: `https://image.tmdb.org/t/p/w500${movie.posterPath}` },
                caption: movieInfo
            });
        } else {
            await message.reply(movieInfo);
        }

        // Send download suggestion as document
        await message.reply("📥 Preparing download information...");
        
        await client.sendMessage(message.from, {
            document: { 
                url: 'https://www.example.com/movie-guide.pdf' // Replace with actual guide or file
            },
            fileName: `How to download ${movie.title}.txt`,
            mimetype: 'text/plain',
            caption: `🎬 *${movie.title} - Download Guide*\n\nFor downloads, visit:\n• Legal: Netflix/Prime/Disney+\n• Always respect copyright laws\n• Support creators when possible`
        });

    } catch (error) {
        await message.reply(`❌ Error: ${error.message}\n\nTry: .movie avengers\n.movie "spider man"`);
    }
});
