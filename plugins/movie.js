const { cmd } = require("../command");
const axios = require('axios');

cmd({
  pattern: "movi",
  alias: ["film", "cinema"],
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
    const accessToken = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1NDlhYmY4OGZlN2E4MmEzZWJjMjliMTBmOTg0MmVhZiIsIm5iZiI6MTc2MDI0NDIyNy43ODIsInN1YiI6IjY4ZWIzMjAzMWQyNTNjZTNjODc4NmNjMiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.Fp2cegnnV3s6XeWHvbVBUJ-MwHa518ZF7RhYkPX4rGA";
    
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json;charset=utf-8'
    };

    // Search for movie
    const searchUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(match)}&api_key=${apiKey}`;
    
    const searchResponse = await axios.get(searchUrl, { headers });
    
    if (!searchResponse.data.results || searchResponse.data.results.length === 0) {
      return await message.reply("❌ Movie not found! Please check the name and try again.");
    }

    // Get first movie result
    const movie = searchResponse.data.results[0];
    const movieId = movie.id;

    // Get detailed movie information
    const detailUrl = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits`;
    const detailResponse = await axios.get(detailUrl, { headers });
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
    console.error('Error details:', error.response?.data);
    
    if (error.response?.status === 401) {
      return await message.reply("❌ API Authentication Failed! Invalid API key or token.");
    } else if (error.response?.status === 404) {
      return await message.reply("❌ Movie not found! Please try another name.");
    } else if (error.code === 'ENOTFOUND') {
      return await message.reply("❌ Network error! Please check your internet connection.");
    } else if (error.response?.status === 429) {
      return await message.reply("❌ API rate limit exceeded! Please try again later.");
    } else {
      return await message.reply(`❌ Error: ${error.message}`);
    }
  }
});
