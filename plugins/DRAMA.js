const fs = require('fs');
const axios = require('axios');
const path = require('path');
const nayan = require('nayan-media-downloaders');
const Youtube = require('youtube-search-api');
const { cmd } = require('../command');

async function downloadMusicFromYoutube(link, filePath) {
  if (!link) throw new Error('Link Not Found');
  const timestart = Date.now();

  try {
    const data = await nayan.ytdown(link);
    const audioUrl = data.data.video;

    return new Promise((resolve, reject) => {
      axios({
        method: 'get',
        url: audioUrl,
        responseType: 'stream',
      })
        .then((response) => {
          const writer = fs.createWriteStream(filePath);
          response.data
            .pipe(writer)
            .on('finish', () => {
              resolve({
                title: data.data.title,
                timestart,
              });
            })
            .on('error', reject);
        })
        .catch(reject);
    });
  } catch (error) {
    throw error;
  }
}

cmd({
    pattern: "vide",
    alias: ["v"],
    react: "🎬",
    desc: "Search and download videos from YouTube",
    category: "download",
    use: ".video <search query>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
    try {
        if (!q) {
            return reply('🎬 Please provide a search query\nExample: .video despacito');
        }

        const results = await Youtube.GetListByKeyword(q, false, 6);
        const links = results.items.map((item) => item.id);
        const titles = results.items.map((item, index) => `${index + 1}. ${item.title} (${item.length.simpleText})`);

        const message = `🔎 Found ${links.length} results for "${q}":\n\n${titles.join('\n')}\n\nReply with a number (1-${links.length}) to download.`;

        const sentMessage = await conn.sendMessage(from, { text: message }, { quoted: m });

        // Store reply handler
        global.replyHandlers = global.replyHandlers || {};
        global.replyHandlers[sentMessage.key.id] = {
            name: 'video',
            author: sender,
            links: links
        };

    } catch (error) {
        console.error('Video Search Error:', error);
        reply('❌ Failed to search videos. Please try again.');
    }
});

// Reply handler (add this to your main message handler)
async function handleVideoReply(conn, m) {
    try {
        if (!global.replyHandlers) return;
        
        const quoted = m.message?.extendedTextMessage?.contextInfo;
        if (!quoted || !quoted.stanzaId) return;

        const handler = global.replyHandlers[quoted.stanzaId];
        if (!handler || handler.author !== m.key.participant) return;

        const selectedIndex = parseInt(m.body, 10) - 1;
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= handler.links.length) {
            await conn.sendMessage(m.key.remoteJid, { text: '❌ Invalid selection. Reply with a number between 1 and 6.' }, { quoted: m });
            return;
        }

        // Delete the search message
        await conn.sendMessage(m.key.remoteJid, {
            delete: {
                remoteJid: m.key.remoteJid,
                fromMe: false,
                id: quoted.stanzaId,
                participant: m.key.participant
            }
        });

        const selectedLink = `https://www.youtube.com/watch?v=${handler.links[selectedIndex]}`;
        const filePath = path.join(process.cwd(), `temp/video_${Date.now()}.mp4`);
        
        // Create temp directory if not exists
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }

        const downloadMsg = await conn.sendMessage(m.key.remoteJid, { text: '🎬 Downloading your video...' }, { quoted: m });

        try {
            const result = await downloadMusicFromYoutube(selectedLink, filePath);

            // Delete download message
            await conn.sendMessage(m.key.remoteJid, {
                delete: {
                    remoteJid: m.key.remoteJid,
                    fromMe: false,
                    id: downloadMsg.key.id,
                    participant: m.key.participant
                }
            });

            // Send video
            await conn.sendMessage(m.key.remoteJid, {
                video: { url: filePath },
                caption: `🎬 *${result.title}*\n\n⏱️ Processing Time: ${Math.floor((Date.now() - result.timestart) / 1000)} seconds\n✨ *Downloaded by Knight Bot*`,
                contextInfo: {
                    mentionedJid: [m.key.participant],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363416743041101@newsletter',
                        newsletterName: "YouTube Downloader",
                        serverMessageId: 143,
                    },
                },
            }, { quoted: m });

            // Cleanup
            fs.unlink(filePath, (err) => {
                if (err) console.error(`Failed to delete file: ${filePath}`);
            });

            // Remove handler
            delete global.replyHandlers[quoted.stanzaId];

        } catch (error) {
            console.error('Video Download Error:', error);
            await conn.sendMessage(m.key.remoteJid, { text: '❌ Failed to download the video. Please try again.' }, { quoted: m });
        }

    } catch (error) {
        console.error('Video Reply Handler Error:', error);
    }
}

// Export the reply handler to use in your main file
module.exports = { handleVideoReply };
