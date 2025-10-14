const axios = require('axios');
const { cmd } = require('../command');

let enviando = false;

const _twitterapi = (id) => `https://info.tweeload.site/status/${id}.json`;

const getAuthorization = async () => {
    const { data } = await axios.get("https://pastebin.com/raw/SnCfd4ru");
    return data;
};

const TwitterDL = async (url) => {
  return new Promise(async (resolve, reject) => {
    const id = url.match(/\/([\d]+)/);
    if (!id)
      return resolve({
        status: "error",
        message: "❌ Invalid Twitter/X URL format",
      });
      
      const response = await axios(_twitterapi(id[1]), {
        method: "GET",
        headers: {
          Authorization: await getAuthorization(),
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
        },
      });

      if (response.data.code !== 200) {
        return resolve({
          status: "error",
          message: "❌ Failed to fetch tweet data",
        });
      }

      const author = {
        id: response.data.tweet.author.id,
        name: response.data.tweet.author.name,
        username: response.data.tweet.author.screen_name,
        avatar_url: response.data.tweet.author.avatar_url,
        banner_url: response.data.tweet.author.banner_url,
      };

      let media = [];
      let type;

      if (response.data.tweet?.media?.videos) {
        type = "video";
        response.data.tweet.media.videos.forEach((v) => {
          const resultVideo = [];
          v.video_urls.forEach((z) => {
            resultVideo.push({
              bitrate: z.bitrate,
              content_type: z.content_type,
              resolution: z.url.match(/([\d ]{2,5}[x][\d ]{2,5})/)[0],
              url: z.url,
            });
          });
          if (resultVideo.length !== 0) {
            media.push({
              type: v.type,
              duration: v.duration,
              thumbnail_url: v.thumbnail_url,
              result: v.type === "video" ? resultVideo : v.url,
            });
          }
        });
      } else {
        type = "photo";
        response.data.tweet.media.photos.forEach((v) => {
          media.push(v);
        });
      }

      resolve({
        status: "success",
        result: {
          id: response.data.tweet.id,
          caption: response.data.tweet.text,
          created_at: response.data.tweet.created_at,
          created_timestamp: response.data.tweet.created_timestamp,
          replies: response.data.tweet.replies,
          retweets: response.data.tweet.retweets,
          likes: response.data.tweet.likes,
          url: response.data.tweet.url,
          possibly_sensitive: response.data.tweet.possibly_sensitive,
          author,
          type,
          media: media.length !== 0 ? media : null,
        },
      });
  });
};

cmd({
    pattern: "x",
    alias: ["xdl", "dlx", "twdl", "tw", "twt", "twitter"],
    react: "🐦",
    desc: "Download videos/images from Twitter/X",
    category: "download",
    use: ".x <twitter-url>",
    filename: __filename
}, async (conn, mek, m, { from, text, q, reply }) => {
    try {
        const url = q || text;
        
        if (!url) {
            return reply("❌ Please provide a Twitter/X URL\nExample: .x https://twitter.com/auronplay/status/1586487664274206720");
        }

        if (enviando) return reply("⏳ Please wait, previous download is still processing...");
        enviando = true;

        await reply("⏳ Downloading from Twitter/X...");

        const res = await TwitterDL(url);
        
        if (res?.status === "error") {
            throw new Error(res.message);
        }

        if (res?.result.type == 'video') {
            const caption = res?.result.caption ? res.result.caption : "🐦 *Twitter/X Video*";
            for (let i = 0; i < res.result.media.length; i++) {
                await conn.sendMessage(from, {
                    video: { url: res.result.media[i].result[0].url }, 
                    caption: caption
                }, { quoted: m });
            };
            enviando = false;
            return;
            
        } else if (res?.result.type == 'photo') {
            const caption = res?.result.caption ? res.result.caption : "🐦 *Twitter/X Image*";
            for (let i = 0; i < res.result.media.length; i++) {
                await conn.sendMessage(from, {
                    image: { url: res.result.media[i].url }, 
                    caption: caption
                }, { quoted: m });
            };
            enviando = false;
            return;
        }

        throw new Error("❌ No media found in this tweet");

    } catch (error) {
        enviando = false;
        console.error('Twitter/X Download Error:', error);
        reply(`❌ Failed to download: ${error.message}`);
    }
});
