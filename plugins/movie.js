const { cmd } = require("../command");
const axios = require('axios');

cmd({
  pattern: "movie",
  alias: ["film", "cinema", "mov"],
  desc: "Search movies and send info as document",
  category: "search",
  filename: __filename
}, async (client, message, match) => {
  try {
    if (!match) {
      return await message.reply(`🎬 *Movie Search Command*

Usage:
.movie <movie name>   - Search movie by title
.movie id <imdb id>   - Search by IMDb ID

Examples:
.movie avengers
.movie id tt0848228
.movie the dark knight`);
    }

    await message.reply("🔍 Searching for movie...");

    const apiKey = "a22d6b96";
    let searchUrl;

    // Check if searching by IMDb ID
    if (match.toLowerCase().startsWith('id ')) {
      const imdbId = match.substring(3).trim();
      searchUrl = `https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbId}&plot=full`;
    } else {
      // Search by title
      searchUrl = `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(match)}&plot=full`;
    }

    const response = await axios.get(searchUrl);
    const movie = response.data;

    if (movie.Response === "False") {
      return await message.reply(`❌ Movie not found!\nSearch: "${match}"\nError: ${movie.Error}\n\n💡 Tip: Try exact movie title or use IMDb ID`);
    }

    // Create formatted movie info
    const movieInfo = formatMovieInfo(movie, match);
    const fileName = `movie_${movie.Title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    
    await client.sendMessage(message.from, {
      document: Buffer.from(movieInfo),
      fileName: fileName,
      mimetype: 'text/plain'
    });

  } catch (error) {
    console.error('Error:', error.message);
    await message.reply(`❌ Failed to fetch movie data: ${error.message}`);
  }
});

function formatMovieInfo(movie, query) {
  return `
🎬 *${movie.Title.toUpperCase()}* (${movie.Year})

📊 *Basic Info:*
• Rated: ${movie.Rated}
• Released: ${movie.Released}
• Runtime: ${movie.Runtime}
• Genre: ${movie.Genre}

⭐ *Rating:* ${movie.imdbRating}/10 (${movie.imdbVotes} votes)
🎭 *Type:* ${movie.Type}

👥 *Cast & Crew:*
• Director: ${movie.Director}
• Writer: ${movie.Writer}
• Actors: ${movie.Actors}

📖 *Plot Summary:*
${movie.Plot}

🌍 *Details:*
• Language: ${movie.Language}
• Country: ${movie.Country}
• Awards: ${movie.Awards}

💰 *Box Office:* ${movie.BoxOffice || 'N/A'}
🏢 *Production:* ${movie.Production || 'N/A'}

${movie.Ratings && movie.Ratings.length > 0 ? `📈 *Other Ratings:*\n${movie.Ratings.map(r => `   • ${r.Source}: ${r.Value}`).join('\n')}` : ''}

🔗 *IMDb:* https://www.imdb.com/title/${movie.imdbID}
📝 *Search Query:* "${query}"

*Data provided by OMDB API*
`.trim();
}
