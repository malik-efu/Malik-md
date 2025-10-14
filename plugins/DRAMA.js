const fs = require('fs');
const axios = require('axios');
const path = require('path');
const nayan = require('nayan-media-downloaders');
const Youtube = require('youtube-search-api');
const { cmd } = require('../command');

// Helper: Download from YouTube
async function downloadMusicFromYoutube(link, filePath) {
  if (!link) throw new Error('No YouTube link provided');

  const timestart = Date.now();
  const data = await nayan.ytdown(link);
  const audioUrl = data?.data?.video || data?.data?.url;

  if (!audioUrl) throw new Error('No download URL returned from API');

  return new Promise((resolve, reject) => {
    axios({
      method: 'get',
      url: audioUrl,
      responseType: 'stream',
    })
      .then((response) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        writer.on('finish', () => resolve({ title: data.data.title, timestart }));
        writer.on('error', reject);
      })
      .catch(reject);
  });
}

// Main command
cmd({
  pattern: "video",
  alias: ["v"],
  react: "🎬",
  desc: "Search and download videos from YouTube",
  category: "download",
  use: ".video <search query>",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, sender }) => {
  try {
    if (!q) return reply('🎬 Please provide a search query.\nExample: .video despacito');

    const results = await Youtube.GetListByKeyword(q, false, 6);
    if (!results?.items?.length) return reply('❌ No results found.');

    const links = results.items.map((item) => item.id?.videoId || item.id);
    const titles = results.items.map(
      (item, i) => `*${i + 1}.* ${item.title} (${item.length?.simpleText || 'Unknown'})`
    );

    const msgText = `🔎 Found ${links.length} results for *"${q}"*:\n\n${titles.join('\n')}\n\nReply with a number (1-${links.length}) to download.`;

    const sent = await conn.sendMessage(from, { text: msgText }, { quoted: m });

    global.replyHandlers = global.replyHandlers || {};
    global.replyHandlers[sent.key.id] = {
      name: 'video',
      author: sender,
      links,
    };
  } catch (err) {
    console.error('Video Search Error:', err);
    reply('❌ Failed to search videos. Try again later.');
  }
});

// Reply handler
async function handleVideoReply(conn, m) {
  try {
    if (!global.replyHandlers) return;

    const quoted = m.message?.extendedTextMessage?.contextInfo;
    if (!quoted?.stanzaId) return;

    const handler = global.replyHandlers[quoted.stanzaId];
    if (!handler || handler.author !== (m.key.participant || m.key.remoteJid)) return;

    const bodyText =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.text ||
      '';

    const selected = parseInt(bodyText.trim(), 10) - 1;
    if (isNaN(selected) || selected < 0 || selected >= handler.links.length) {
      await conn.sendMessage(m.key.remoteJid, { text: '❌ Invalid selection. Reply with a number between 1 and 6.' }, { quoted: m });
      return;
    }

    const selectedLink = `https://www.youtube.com/watch?v=${handler.links[selected]}`;
    const filePath = path.join(process.cwd(), 'temp', `video_${Date.now()}.mp4`);

    // Ensure temp dir exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    const waitMsg = await conn.sendMessage(m.key.remoteJid, { text: '🎬 Downloading your video, please wait...' }, { quoted: m });

    try {
      const result = await downloadMusicFromYoutube(selectedLink, filePath);

      await conn.sendMessage(m.key.remoteJid, {
        video: fs.readFileSync(filePath),
        mimetype: 'video/mp4',
        caption: `🎬 *${result.title}*\n\n⏱️ Time: ${Math.floor((Date.now() - result.timestart) / 1000)}s\n✨ Downloaded by Knight Bot`,
      }, { quoted: m });

      fs.unlinkSync(filePath);
      delete global.replyHandlers[quoted.stanzaId];
    } catch (error) {
      console.error('Video Download Error:', error);
      await conn.sendMessage(m.key.remoteJid, { text: '❌ Failed to download the video. Try another link or shorter video.' }, { quoted: m });
    }

    // Delete waiting message safely
    if (waitMsg?.key?.id) {
      try {
        await conn.sendMessage(m.key.remoteJid, {
          delete: {
            remoteJid: m.key.remoteJid,
            fromMe: true,
            id: waitMsg.key.id,
          },
        });
      } catch { /* ignore delete errors */ }
    }

  } catch (err) {
    console.error('Video Reply Handler Error:', err);
  }
}

module.exports = { handleVideoReply };
