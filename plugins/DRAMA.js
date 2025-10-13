const yts = require('yt-search');
const axios = require('axios');
const { cmd } = require('../command');

// Format views function
function formatViews(views) {
    if (views === undefined) return "Not available"
    if (views >= 1000000000) return `${(views / 1000000000).toFixed(1)}B (${views.toLocaleString()})`
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M (${views.toLocaleString()})`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}k (${views.toLocaleString()})`
    return views.toString()
}

// Audio download function
async function getAud(url) {
    const apis = [
        { api: 'ZenzzXD', endpoint: `https://zenzapis.xyz/downloader/ytmp3?url=${encodeURIComponent(url)}&apikey=your_key`, extractor: res => res.result?.url },
        { api: 'ZenzzXD v2', endpoint: `https://zenzapis.xyz/downloader/ytmp3v2?url=${encodeURIComponent(url)}&apikey=your_key`, extractor: res => res.result?.url },
        { api: 'API 3', endpoint: `https://api.erdwpe.com/api/downloader/youtube3?url=${encodeURIComponent(url)}`, extractor: res => res.result?.audio },
        { api: 'API 4', endpoint: `https://api.lolhuman.xyz/api/ytaudio2?url=${encodeURIComponent(url)}&apikey=your_key`, extractor: res => res.result }
    ]
    return await fetchFromApis(apis)
}

// Video download function
async function getVid(url) {
    const apis = [
        { api: 'ZenzzXD', endpoint: `https://zenzapis.xyz/downloader/ytmp4?url=${encodeURIComponent(url)}&apikey=your_key`, extractor: res => res.result?.url },
        { api: 'ZenzzXD v2', endpoint: `https://zenzapis.xyz/downloader/ytmp4v2?url=${encodeURIComponent(url)}&apikey=your_key`, extractor: res => res.result?.url },
        { api: 'API 3', endpoint: `https://api.erdwpe.com/api/downloader/youtube2?url=${encodeURIComponent(url)}`, extractor: res => res.result?.video },
        { api: 'API 4', endpoint: `https://api.lolhuman.xyz/api/ytvideo2?url=${encodeURIComponent(url)}&apikey=your_key`, extractor: res => res.result }
    ]
    return await fetchFromApis(apis)
}

// API fetcher function
async function fetchFromApis(apis) {
    for (const { api, endpoint, extractor } of apis) {
        try {
            const response = await axios.get(endpoint, { timeout: 10000 })
            const link = extractor(response.data)
            if (link) return { url: link, api }
        } catch (e) {}
        await new Promise(resolve => setTimeout(resolve, 500))
    }
    return null
}

// Audio Download Command
cmd({
    pattern: "1play",
    alias: ["yta", "ytmp3", "playaudio"],
    react: "🎵",
    desc: "Download YouTube audio",
    category: "download",
    use: ".play <song name or url>",
    filename: __filename
}, async (conn, mek, m, { from, text, q, reply }) => {
    try {
        if (!text && !q) return reply(`❌ Please enter the name of the music to download.`)

        await reply("🕒 Searching...")

        const videoMatch = (text || q).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
        const query = videoMatch ? 'https://youtu.be/' + videoMatch[1] : (text || q)
        const search = await yts(query)
        const result = videoMatch ? search.videos.find(v => v.videoId === videoMatch[1]) || search.all[0] : search.all[0]
        
        if (!result) throw '❌ No results found.'
        
        const { title, thumbnail, timestamp, views, ago, url, author, seconds } = result
        
        if (seconds > 1800) throw '⚠️ Video exceeds duration limit (30 minutes).'
        
        const vistas = formatViews(views)
        const info = `「✦」Downloading *${title}*\n\n> ❑ Channel » *${author.name}*\n> ♡ Views » *${vistas}*\n> ✧ Duration » *${timestamp}*\n> ☁ Published » *${ago}*\n> ➪ Link » ${url}`
        
        // Send thumbnail
        await conn.sendMessage(from, { 
            image: { url: thumbnail }, 
            caption: info 
        }, { quoted: m })

        const audio = await getAud(url)
        if (!audio?.url) throw '⚠️ Could not get audio.'
        
        await reply(`> ❀ *Audio processed. Server:* \`${audio.api}\``)
        
        await conn.sendMessage(from, { 
            audio: { url: audio.url }, 
            fileName: `${title}.mp3`, 
            mimetype: 'audio/mpeg' 
        }, { quoted: m })

    } catch (e) {
        console.error('Audio Download Error:', e)
        reply(typeof e === 'string' ? e : `⚠️ An error occurred.\n\n${e.message}`)
    }
})

// Video Download Command
cmd({
    pattern: "1play2",
    alias: ["ytv", "ytmp4", "mp4"],
    react: "🎥",
    desc: "Download YouTube video",
    category: "download",
    use: ".play2 <video name or url>",
    filename: __filename
}, async (conn, mek, m, { from, text, q, reply }) => {
    try {
        if (!text && !q) return reply(`❌ Please enter the name of the video to download.`)

        await reply("🕒 Searching...")

        const videoMatch = (text || q).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/)
        const query = videoMatch ? 'https://youtu.be/' + videoMatch[1] : (text || q)
        const search = await yts(query)
        const result = videoMatch ? search.videos.find(v => v.videoId === videoMatch[1]) || search.all[0] : search.all[0]
        
        if (!result) throw '❌ No results found.'
        
        const { title, thumbnail, timestamp, views, ago, url, author, seconds } = result
        
        if (seconds > 1800) throw '⚠️ Video exceeds duration limit (30 minutes).'
        
        const vistas = formatViews(views)
        const info = `「✦」Downloading *${title}*\n\n> ❑ Channel » *${author.name}*\n> ♡ Views » *${vistas}*\n> ✧ Duration » *${timestamp}*\n> ☁ Published » *${ago}*\n> ➪ Link » ${url}`
        
        // Send thumbnail
        await conn.sendMessage(from, { 
            image: { url: thumbnail }, 
            caption: info 
        }, { quoted: m })

        const video = await getVid(url)
        if (!video?.url) throw '⚠️ Could not get video.'
        
        await reply(`> ❀ *Video processed. Server:* \`${video.api}\``)
        
        await conn.sendMessage(from, { 
            video: { url: video.url }, 
            caption: `> ❀ ${title}`,
            fileName: `${title}.mp4`
        }, { quoted: m })

    } catch (e) {
        console.error('Video Download Error:', e)
        reply(typeof e === 'string' ? e : `⚠️ An error occurred.\n\n${e.message}`)
    }
})
