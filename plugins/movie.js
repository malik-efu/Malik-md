const { cmd } = require("../command");
const fetch = require('node-fetch');

// AnimeDB API Configuration
const animeConfig = {
    host: 'anime-db.p.rapidapi.com',
    key: 'adb03fd619msh91f2556557237f4p10f659jsn96ca8c5079ee'
};

cmd({
    pattern: "anime",
    alias: ["animesearch", "animeinfo"],
    desc: "Search anime information from database",
    category: "weeb",
    filename: __filename
}, async (client, message, match) => {
    try {
        if (!match) {
            return await message.reply(`🎌 *Anime Search Command* 🎌\n\nUsage: .anime <name>\nExample: .anime naruto\nExample: .anime "attack on titan"`);
        }

        await message.reply("🔍 Searching anime database...");

        // Simple API request with minimal headers
        const url = `https://${animeConfig.host}/anime?page=1&size=3&search=${encodeURIComponent(match)}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Host': animeConfig.host,
                'X-RapidAPI-Key': animeConfig.key
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            return await message.reply(`❌ No anime found for "*${match}*"\nTry: .anime naruto\n.anime one piece\n.anime dragon ball`);
        }

        const anime = data.data[0]; // Get first result
        
        // Build anime information
        let animeInfo = `🎌 *${anime.title}*\n`;
        animeInfo += `╰──────────────────\n`;
        animeInfo += `📺 *Type:* ${anime.type || 'N/A'}\n`;
        animeInfo += `📊 *Episodes:* ${anime.episodes || 'N/A'}\n`;
        animeInfo += `⭐ *Rating:* ${anime.rating || 'N/A'}\n`;
        animeInfo += `🏆 *Rank:* ${anime.ranking || 'N/A'}\n`;
        animeInfo += `📅 *Status:* ${anime.status || 'N/A'}\n`;
        
        if (anime.genres && anime.genres.length > 0) {
            animeInfo += `🎭 *Genres:* ${anime.genres.join(', ')}\n`;
        }
        
        if (anime.synopsis) {
            const shortSynopsis = anime.synopsis.length > 150 
                ? anime.synopsis.substring(0, 150) + '...' 
                : anime.synopsis;
            animeInfo += `📖 *Synopsis:* ${shortSynopsis}\n`;
        }
        
        animeInfo += `╰──────────────────`;

        // Send text info
        await message.reply(animeInfo);

        // Send image if available
        if (anime.image) {
            try {
                await client.sendMessage(message.from, {
                    image: { url: anime.image },
                    caption: `🎑 ${anime.title}`
                });
            } catch (imgError) {
                console.log('Image send error:', imgError);
            }
        }

    } catch (error) {
        console.error('Anime Command Error:', error);
        
        if (error.message.includes('429')) {
            await message.reply("⏰ API limit reached. Try again later.");
        } else if (error.message.includes('401')) {
            await message.reply("🔑 API key error. Check subscription.");
        } else if (error.message.includes('431')) {
            await message.reply("📛 Header too large. Using simplified request...");
            // Try alternative method
            await simplifiedAnimeSearch(client, message, match);
        } else {
            await message.reply(`❌ Error: ${error.message}`);
        }
    }
});

// Alternative simplified search function
async function simplifiedAnimeSearch(client, message, match) {
    try {
        const url = `https://anime-db.p.rapidapi.com/anime?search=${encodeURIComponent(match)}&size=1`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Host': 'anime-db.p.rapidapi.com',
                'X-RapidAPI-Key': 'adb03fd619msh91f2556557237f4p10f659jsn96ca8c5079ee'
            }
        });

        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            const anime = data.data[0];
            await message.reply(`🎌 *${anime.title}*\n⭐ Rating: ${anime.rating || 'N/A'}\n📺 Episodes: ${anime.episodes || 'N/A'}`);
        } else {
            await message.reply("❌ No results found.");
        }
    } catch (e) {
        await message.reply("❌ Failed to fetch anime data.");
    }
}

// Top Anime Command
cmd({
    pattern: "topanime",
    alias: ["popularanime"],
    desc: "Get popular anime list",
    category: "weeb",
    filename: __filename
}, async (client, message, match) => {
    try {
        const url = `https://anime-db.p.rapidapi.com/anime?page=1&size=5&sortBy=ranking&sortOrder=asc`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Host': 'anime-db.p.rapidapi.com',
                'X-RapidAPI-Key': 'adb03fd619msh91f2556557237f4p10f659jsn96ca8c5079ee'
            }
        });

        const data = await response.json();
        
        if (!data.data || data.data.length === 0) {
            return await message.reply("❌ No anime data found.");
        }

        let topList = "🏆 *TOP 5 ANIME* 🏆\n\n";
        
        data.data.forEach((anime, index) => {
            topList += `${index + 1}. *${anime.title}*\n`;
            topList += `   ⭐ ${anime.rating || 'N/A'} | 📺 ${anime.episodes || '?'} eps\n\n`;
        });

        await message.reply(topList);

    } catch (error) {
        await message.reply("❌ Error fetching top anime list.");
    }
});
