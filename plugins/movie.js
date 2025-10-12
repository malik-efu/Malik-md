const { cmd } = require("../command");
const axios = require('axios');

const RAPIDAPI_KEY = 'adb03fd619msh91f2556557237f4p10f659jsn96ca8c5079ee';
const RAPIDAPI_HOST = 'anime-db.p.rapidapi.com';

// Anime Search Command
cmd({
  pattern: "anim1",
  alias: ["animesearch"],
  desc: "Search anime information",
  category: "weeb",
  filename: __filename
}, async (client, message, match) => {
  if (!match) return await message.reply("❌ Please provide anime name\nExample: .anime naruto");
  
  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST}/anime`, {
      params: { page: 1, size: 3, search: match },
      headers: { 'x-rapidapi-host': RAPIDAPI_HOST, 'x-rapidapi-key': RAPIDAPI_KEY }
    });

    const animes = response.data.data;
    if (!animes.length) return await message.reply(`❌ No anime found for "${match}"`);

    for (const anime of animes) {
      let info = `🎌 *${anime.title}*\n`;
      info += `📺 Type: ${anime.type || 'N/A'}\n`;
      info += `📊 Episodes: ${anime.episodes || 'N/A'}\n`;
      info += `⭐ Rating: ${anime.rating || 'N/A'}\n`;
      info += `🏆 Rank: ${anime.ranking || 'N/A'}\n`;
      info += `📖 ${anime.synopsis?.substring(0, 150) || 'No synopsis'}...\n`;
      
      await message.reply(info);
      if (anime.image) {
        await client.sendMessage(message.from, { 
          image: { url: anime.image }, 
          caption: anime.title 
        });
      }
    }
  } catch (error) {
    await message.reply(`❌ Error: ${error.response?.data?.message || error.message}`);
  }
});

// Top Anime Command
cmd({
  pattern: "topanime",
  alias: ["popularanime"],
  desc: "Get top popular anime",
  category: "weeb",
  filename: __filename
}, async (client, message, match) => {
  try {
    const response = await axios.get(`https://${RAPIDAPI_HOST}/anime`, {
      params: { page: 1, size: 5, sortBy: 'ranking', sortOrder: 'asc' },
      headers: { 'x-rapidapi-host': RAPIDAPI_HOST, 'x-rapidapi-key': RAPIDAPI_KEY }
    });

    const animes = response.data.data;
    let topList = "🏆 *TOP 5 POPULAR ANIME* 🏆\n\n";
    
    animes.forEach((anime, index) => {
      topList += `${index + 1}. *${anime.title}*\n`;
      topList += `   ⭐ ${anime.rating || 'N/A'} | 📺 ${anime.type || 'N/A'}\n\n`;
    });

    await message.reply(topList);
  } catch (error) {
    await message.reply(`❌ Error fetching top anime: ${error.message}`);
  }
});
