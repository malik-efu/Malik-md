const { cmd } = require("../command");
const axios = require('axios');

cmd({
  pattern: "movie",
  alias: ["film", "cinema"],
  desc: "Search movies and send info as document",
  category: "search",
  filename: __filename
}, async (client, message, match) => {
  try {
    if (!match) {
      return await message.reply("🎬 Please provide a movie name!\nExample: .movie Avengers");
    }

    await message.reply("🔍 Searching for movie...");

    const apiKey = "549abf88fe7a82a3ebc29b10f9842eaf";
    
    // SIMPLE API CALL without token
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(match)}`;
    
    const searchResponse = await axios.get(searchUrl);
    
    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      return await message.reply("❌ Movie not found!");
    }

    const movie = searchResponse.data.results[0];
    
    // Simple movie info
    const movieInfo = `
🎬 *MOVIE INFORMATION*

📝 *Title:* ${movie.title}
⭐ *Rating:* ${movie.vote_average}/10
📅 *Release:* ${movie.release_date || 'N/A'}
📖 *Overview:* ${movie.overview || 'No description'}

🎞️ *TMDB ID:* ${movie.id}
    `.trim();

    const fileName = `movie_${movie.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    
    await client.sendMessage(message.from, {
      document: Buffer.from(movieInfo),
      fileName: fileName,
      mimetype: 'text/plain'
    });

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    return await message.reply(`❌ Error: ${error.response?.data?.status_message || error.message}`);
  }
});
