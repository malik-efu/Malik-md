const { cmd } = require("../command");
const axios = require('axios');

cmd({
  pattern: "movie",
  alias: ["film", "cinem"],
  desc: "Search movies and send info as document",
  category: "search",
  filename: __filename
}, async (client, message, match) => {
  try {
    if (!match) {
      return await message.reply("🎬 Please provide a movie name!\nExample: .movie Avengers");
    }

    // Show searching message
    await message.reply("🔍 Searching for movie...");

    const apiKey = "549abf88fe7a82a3ebc29b10f9842eaf";
    const searchUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(match)}&api_key=${apiKey}`;

    // Search for movie
    const searchResponse = await axios.get(searchUrl);
    
    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      return await message.reply("❌ Movie not found! Please check the name and try again.");
    }

    // Get first movie result
    const movie = searchResponse.data.results[0];
    const movieId = movie.id;

    // Get detailed movie information
    const detailUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits`;
    const detailResponse = await axios.get(detailUrl);
    const movieDetails = detailResponse.data;

    // Format movie information
    const movieInfo = `
🎬 *MOVIE INFORMATION* 🎬

📝 *Title:* ${movieDetails.title}${movieDetails.original_title !== movieDetails.title ? `\n   (${movieDetails.original_title})` : ''}

⭐ *Rating:* ${movieDetails.vote_average}/10 (${movieDetails.vote_count} votes)
📅 *Release Date:* ${movieDetails.release_date || 'N/A'}
⏱️ *Runtime:* ${movieDetails.runtime ? `${movieDetails.runtime} minutes` : 'N/A'}

🎭 *Genres:* ${movieDetails.genres.map(genre => genre.name).join(', ')}

👥 *Director:* ${movieDetails.credits?.crew?.find(person => person.job === 'Director')?.name || 'N/A'}

🎭 *Main Cast:*
${movieDetails.credits?.cast?.slice(0, 5).map(actor => `   • ${actor.name} as ${actor.character || 'N/A'}`).join('\n')}

📖 *Overview:*
${movieDetails.overview || 'No description available.'}

💰 *Budget:* $${movieDetails.budget?.toLocaleString() || 'N/A'}
🎯 *Revenue:* $${movieDetails.revenue?.toLocaleString() || 'N/A'}

🏆 *Status:* ${movieDetails.status}
🌐 *Homepage:* ${movieDetails.homepage || 'N/A'}

🎞️ *TMDB ID:* ${movieDetails.id}
🔗 *TMDB URL:* https://www.themoviedb.org/movie/${movieDetails.id}
    `.trim();

    // Create document with movie info
    const fileName = `movie_${movieDetails.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    
    await client.sendMessage(message.from, {
      document: Buffer.from(movieInfo),
      fileName: fileName,
      mimetype: 'text/plain'
    });

  } catch (error) {
    console.error('Movie command error:', error);
    
    if (error.response?.status === 401) {
      return await message.reply("❌ API Authentication Failed! Check your API key.");
    } else if (error.response?.status === 404) {
      return await message.reply("❌ Movie not found! Please try another name.");
    } else if (error.code === 'ENOTFOUND') {
      return await message.reply("❌ Network error! Please check your internet connection.");
    } else {
      return await message.reply("❌ Error fetching movie data! Please try again later.");
    }
  }
});
