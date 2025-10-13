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

        // ALTERNATIVE 1: Use different consumet endpoints
        const searchUrl = `https://api.consumet.org/movies/flixhq/${encodeURIComponent(match)}`;
        
        const searchResponse = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        // Check if response is valid JSON
        const text = await searchResponse.text();
        if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
            throw new Error("API is currently down. Using alternative method...");
        }

        const searchData = JSON.parse(text);
        
        if (!searchData.results || searchData.results.length === 0) {
            return await message.reply("❌ Movie not found.");
        }

        const movie = searchData.results[0];
        
        // Send movie info first
        if (movie.image) {
            await client.sendMessage(message.from, {
                image: { url: movie.image },
                caption: `🎬 *${movie.title}*\n📅 ${movie.releaseDate || 'N/A'}\n🔍 Getting download links...`
            });
        } else {
            await message.reply(`🎬 *${movie.title}*\n📅 ${movie.releaseDate || 'N/A'}\n🔍 Getting download links...`);
        }

        // Get movie details
        const movieInfoUrl = `https://api.consumet.org/movies/flixhq/info?id=${movie.id}`;
        const infoResponse = await fetch(movieInfoUrl);
        const infoData = await infoResponse.json();

        if (infoData.episodes && infoData.episodes.length > 0) {
            const episode = infoData.episodes[0];
            
            // Get streaming links
            const streamUrl = `https://api.consumet.org/movies/flixhq/watch?episodeId=${episode.id}&mediaId=${movie.id}`;
            const streamResponse = await fetch(streamUrl);
            const streamData = await streamResponse.json();

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
        // If consumet API fails, use alternative method
        await tryAlternativeMovieDownload(client, message, match, error);
    }
});

// ALTERNATIVE METHOD WHEN CONSUMET API IS DOWN
async function tryAlternativeMovieDownload(client, message, match, originalError) {
    try {
        await message.reply("🔄 Trying alternative download source...");

        // Method 2: Use different movie API
        const alternativeUrl = `https://movies-api14.p.rapidapi.com/search?query=${encodeURIComponent(match)}`;
        
        const response = await fetch(alternativeUrl, {
            headers: {
                'X-RapidAPI-Key': 'adb03fd619msh91f2556557237f4p10f659jsn96ca8c5079ee',
                'X-RapidAPI-Host': 'movies-api14.p.rapidapi.com'
            }
        });

        const data = await response.json();
        
        if (data.contents && data.contents.length > 0) {
            const movie = data.contents[0];
            
            await client.sendMessage(message.from, {
                image: { url: movie.poster_url },
                caption: `🎬 *${movie.title}*\n⭐ ${movie.rating || 'N/A'}\n📅 ${movie.release_date || 'N/A'}\n\n❌ Download feature temporarily unavailable.\n📺 Try streaming on Netflix/Prime.`
            });
            
        } else {
            // Final fallback - just search and return info
            await message.reply(`🎬 Movie: *${match}*\n\n❌ Download services are currently down.\n🔍 You can search on:\n• Netflix\n• Amazon Prime\n• Disney+\n\nOr try again later.`);
        }

    } catch (altError) {
        await message.reply(`❌ All download services are currently unavailable.\n\nError: ${originalError.message}\n\nTry: .movie for streaming info only`);
    }
}
