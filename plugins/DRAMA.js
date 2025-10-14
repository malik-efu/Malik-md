const axios = require('axios');
const cheerio = require('cheerio');
const { cmd } = require('../command');

// Twitter Scraper Function
async function twitterScraper(url) {
    return new Promise(async (resolve, reject) => {
        try {
            const twitterUrlMatch = url.match(/(https:\/\/x.com\/[^?]+)/)
            const tMatch = url.match(/t=([^&]+)/)
            const twitterUrl = twitterUrlMatch ? twitterUrlMatch[1] : ''
            const t = tMatch ? tMatch[1] : ''
            const urlnya = encodeURIComponent(`${twitterUrl}?t=${t}&s=19`)
            
            const response = await axios.post("https://savetwitter.net/api/ajaxSearch",
                `q=${urlnya}&lang=en`)
            
            const $ = cheerio.load(response.data.data)
            const isVideo = $('.tw-video').length > 0
            const twitterId = $('#TwitterId').val()
            
            if (isVideo) {
                const videoThumbnail = $('.tw-video .thumbnail .image-tw img').attr('src')
                const data = []
                
                $('.dl-action a').each((i, elem) => {
                    const quality = $(elem).text().trim()
                    const url = $(elem).attr('href')
                    
                    if ($(elem).hasClass('action-convert')) {
                        const audioUrl = $(elem).attr('data-audioUrl')
                        data.push({
                            quality: quality,
                            url: audioUrl || 'URL not found',
                        })
                    } else {
                        data.push({
                            quality: quality,
                            url: url
                        })
                    }
                })
                
                const title = $('.tw-middle h3').text().trim()
                const videoDuration = $('.tw-middle p').text().trim()
                
                resolve({
                    status: true,
                    data: {
                        type: "video",
                        title: title,
                        duration: videoDuration,
                        twitterId: twitterId,
                        videoThumbnail: videoThumbnail,
                        dl: data
                    }
                })
            } else {
                const imageUrl = $('.photo-list .download-items__thumb img').attr('src')
                const downloadUrl = $('.photo-list .download-items__btn a').attr('href')
                
                resolve({
                    status: true,
                    data: {
                        type: "image",
                        twitterId: twitterId,
                        imageUrl: imageUrl,
                        dl: downloadUrl
                    }
                })
            }
        } catch (error) {
            reject(error)
        }
    })
}

// Twitter Download Command
cmd({
    pattern: "twitte",
    alias: ["x", "xdl"],
    react: "🐦",
    desc: "Download Twitter/X videos and images",
    category: "download",
    use: ".twitter <twitter-url>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(`❌ You forgot the Twitter/X image/video link.`)
        }

        await reply("🕒 Downloading from Twitter...")

        const result = await twitterScraper(q);
        
        if (!result.status) {
            return reply(`❌ Could not get content from Twitter`)
        }

        if (result.data.type === 'video') {
            let caption = `❀ Twitter - Download ❀\n\n> ✦ Title » ${result.data.title}\n> ⴵ Duration » ${result.data.duration}\n> 🜸 URL » ${q}`
            
            await conn.sendMessage(from, {
                video: { url: result.data.dl[0].url },
                caption: caption
            }, { quoted: m })
            
        } else {
            await conn.sendMessage(from, {
                image: { url: result.data.imageUrl },
                caption: `❀ Twitter - Download ❀\n\n> 🜸 URL » ${q}`
            }, { quoted: m })
        }

    } catch (e) {
        console.error('Twitter Download Error:', e)
        reply(`⚠️ A problem occurred.\n\n${e.message}`)
    }
})
