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

    // Replace with your OMDB API key
    const apiKey = "http://www.omdbapi.com/?i=tt3896198&apikey=a22d6b96";
    const searchUrl = `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(match)}`;

    // Search for movie
    const response = await axios.get(searchUrl);
    const movie = response.data;

    // Check if movie was found
    if (movie.Response === "False") {
      return await message.reply(`❌ Movie not found: ${movie.Error}\nPlease check the movie name and try again.`);
    }

    // Format movie information
    const movieInfo = `
🎬 *MOVIE INFORMATION* 🎬

📝 *Title:* ${movie.Title}
📅 *Year:* ${movie.Year}
⭐ *IMDb Rating:* ${movie.imdbRating}/10
🎯 *IMDb Votes:* ${movie.imdbVotes}

🎭 *Genre:* ${movie.Genre}
⏱️ *Runtime:* ${movie.Runtime}
📅 *Released:* ${movie.Released}

🎬 *Director:* ${movie.Director}
✍️ *Writer:* ${movie.Writer}
🎭 *Actors:* ${movie.Actors}

🗣️ *Language:* ${movie.Language}
🌍 *Country:* ${movie.Country}

🏆 *Awards:* ${movie.Awards}

📖 *Plot:*
${movie.Plot}

📊 *Ratings:*
${movie.Ratings ? movie.Ratings.map(rating => `   • ${rating.Source}: ${rating.Value}`).join('\n') : '   No ratings available'}

🎞️ *Type:* ${movie.Type}
📺 *Box Office:* ${movie.BoxOffice || 'N/A'}
🎫 *Production:* ${movie.Production || 'N/A'}

🔗 *IMDb ID:* ${movie.imdbID}
    `.trim();

    // Create document with movie info
    const fileName = `movie_${movie.Title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    
    await client.sendMessage(message.from, {
      document: Buffer.from(movieInfo),
      fileName: fileName,
      mimetype: 'text/plain'
    });

  } catch (error) {
    console.error('Movie command error:', error);
    
    if (error.response?.status === 401) {
      return await message.reply("❌ Invalid OMDB API Key! Please check your API key.");
    } else if (error.code === 'ENOTFOUND') {
      return await message.reply("❌ Network error! Please check your internet connection.");
    } else if (error.response?.status === 404) {
      return await message.reply("❌ OMDB API endpoint not found!");
    } else {
      return await message.reply("❌ Error fetching movie data! Please try again later.");
    }
  }
});
