const { cmd } = require("../command");
const fetch = require('node-fetch');

cmd({
    pattern: "animedl",
    alias: ["animevideo", "animedownload"],
    desc: "Download anime episodes",
    category: "weeb",
    filename: __filename
}, async (client, message, match) => {
    try {
        if (!match) {
            return await message.reply(`🎌 *Anime Download Command* 🎌\n\nUsage: .animedl <anime_name>\nExample: .animedl naruto\nExample: .animedl "one piece episode 1"`);
        }

        await message.reply("🔍 Searching for anime...");

        // Search anime
        const searchUrl = `https://animewatch-api.vercel.app/anime/gogoanime/${encodeURIComponent(match)}`;
        const searchResponse = await fetch(searchUrl);
        
        if (!searchResponse.ok) {
            throw new Error(`Anime not found: ${searchResponse.status}`);
        }

        const animeData = await searchResponse.json();
        
        if (!animeData.episodes || animeData.episodes.length === 0) {
            return await message.reply("❌ No episodes found for this anime.");
        }

        // Get first episode (you can modify to choose specific episode)
        const firstEpisode = animeData.episodes[0];
        
        await message.reply(`📥 Downloading: ${animeData.animeTitle} - Episode ${firstEpisode.episodeNum}`);

        // Get episode download links
        const episodeUrl = `https://animewatch-api.vercel.app/anime/gogoanime/episode/${firstEpisode.episodeId}`;
        const episodeResponse = await fetch(episodeUrl);
        const episodeData = await episodeResponse.json();

        if (!episodeData.sources || episodeData.sources.length === 0) {
            return await message.reply("❌ No download links available.");
        }

        // Find the best quality download link
        const downloadSource = episodeData.sources.find(src => src.quality === "720p") || 
                              episodeData.sources.find(src => src.quality === "480p") || 
                              episodeData.sources[0];

        if (!downloadSource || !downloadSource.url) {
            return await message.reply("❌ No downloadable video link found.");
        }

        // Send as document
        await message.reply(`⬇️ Downloading ${downloadSource.quality} quality...`);

        await client.sendMessage(message.from, {
            document: { url: downloadSource.url },
            fileName: `${animeData.animeTitle} - Episode ${firstEpisode.episodeNum}.mp4`,
            mimetype: 'video/mp4',
            caption: `🎌 *${animeData.animeTitle}*\n📺 Episode: ${firstEpisode.episodeNum}\n🛜 Quality: ${downloadSource.quality}`
        });

    } catch (error) {
        console.error('Anime Download Error:', error);
        await message.reply(`❌ Error: ${error.message}\n\nTry: .animedl naruto\n.animedl "attack on titan episode 1"`);
    }
});
