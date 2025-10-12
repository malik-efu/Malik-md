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

    // Show searching message
    await message.reply("🔍 Searching for movie...");

    // Your OMDB API key
    const apiKey = "a22d6b96";
    const searchUrl = `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(match)}&plot=full`;

    // Search for movie
    const response = await axios.get(searchUrl);
    const movie = response.data;

    // Check if movie was found
    if (movie.Response === "False") {
      return await message.reply(`❌ Movie not found: "${match}"\nError: ${movie.Error}\n\nPlease check the movie name and try again.`);
    }

    // Format movie information
    const movieInfo = `
🎬 *MOVIE INFORMATION* 🎬

📝 *Title:* ${movie.Title}
📅 *Year:* ${movie.Year}
🎭 *Rated:* ${movie.Rated}
📅 *Released:* ${movie.Released}
⏱️ *Runtime:* ${movie.Runtime}

🎭 *Genre:* ${movie.Genre}
👨‍💼 *Director:* ${movie.Director}
✍️ *Writer:* ${movie.Writer}
🎭 *Actors:* ${movie.Actors}

📖 *Plot:*
${movie.Plot}

🗣️ *Language:* ${movie.Language}
🌍 *Country:* ${movie.Country}

🏆 *Awards:* ${movie.Awards}

⭐ *IMDb Rating:* ${movie.imdbRating}/10
🗳️ *IMDb Votes:* ${movie.imdbVotes}
🔗 *IMDb ID:* ${movie.imdbID}

📊 *Ratings:*
${movie.Ratings && movie.Ratings.length > 0 ? 
  movie.Ratings.map(rating => `   • ${rating.Source}: ${rating.Value}`).join('\n') : 
  '   No ratings available'}

🎞️ *Type:* ${movie.Type}
💵 *Box Office:* ${movie.BoxOffice || 'N/A'}
🏢 *Production:* ${movie.Production || 'N/A'}
📺 *DVD Release:* ${movie.DVD || 'N/A'}

*Search Query:* "${match}"
*Data Source:* OMDB API
    `.trim();

    // Create document with movie info
    const fileName = `movie_${movie.Title.replace(/[^a-zA-Z0-9]/g, '_')}_${movie.Year}.txt`;
    
    // Send as document
    await client.sendMessage(message.from, {
      document: Buffer.from(movieInfo),
      fileName: fileName,
      mimetype: 'text/plain'
    });

    // Also send a quick success message
    await message.reply(`✅ Movie info sent as document!\n📁 File: ${fileName}`);

  } catch (error) {
    console.error('Movie command error:', error);
    
    if (error.response?.status === 401) {
      return await message.reply("❌ Invalid OMDB API Key! Please check your API key.");
    } else if (error.code === 'ENOTFOUND') {
      return await message.reply("❌ Network error! Please check your internet connection.");
    } else if (error.response?.status === 404) {
      return await message.reply("❌ OMDB API endpoint not found!");
    } else {
      return await message.reply(`❌ Error: ${error.message}`);
    }
  }
});
