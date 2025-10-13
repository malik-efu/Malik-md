const axios = require('axios');
const { generateWAMessageContent, generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const { cmd } = require('../command');

cmd({
    pattern: "pinterest",
    alias: ["pinsearch"],
    react: "🔍",
    desc: "Search Pinterest images",
    category: "search",
    use: ".pinterest <query>",
    filename: __filename
}, async (conn, mek, m, { from, text, q, reply }) => {
    try {
        const searchQuery = q || text;
        
        if (!searchQuery) {
            return reply("[❗] *What do you want to search on Pinterest?*");
        }

        async function createImageMessage(imageUrl) {
            const { imageMessage } = await generateWAMessageContent({
                'image': {
                    'url': imageUrl
                }
            }, {
                'upload': conn.waUploadToServer
            });
            return imageMessage;
        }

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        let cards = [];
        let { data } = await axios.get("https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=%2Fsearch%2Fpins%2F%3Fq%3D" + searchQuery + "&data=%7B%22options%22%3A%7B%22isPrefetch%22%3Afalse%2C%22query%22%3A%22" + searchQuery + "%22%2C%22scope%22%3A%22pins%22%2C%22no_fetch_context_on_resource%22%3Afalse%7D%2C%22context%22%3A%7B%7D%7D&_=1619980301559");
        
        let imageUrls = data.resource_response.data.results.map(item => item.images.orig.url);
        shuffleArray(imageUrls);
        
        let selectedImages = imageUrls.splice(0, 5);
        let imageCount = 1;

        for (let imageUrl of selectedImages) {
            cards.push({
                'body': proto.Message.InteractiveMessage.Body.fromObject({
                    'text': "Image -" + (" " + imageCount++)
                }),
                'footer': proto.Message.InteractiveMessage.Footer.fromObject({
                    'text': "Knight Bot"
                }),
                'header': proto.Message.InteractiveMessage.Header.fromObject({
                    'title': '',
                    'hasMediaAttachment': true,
                    'imageMessage': await createImageMessage(imageUrl)
                }),
                'nativeFlowMessage': proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                    'buttons': [{
                        'name': "cta_url",
                        'buttonParamsJson': "{\"display_text\":\"url 📫\",\"Url\":\"https://www.pinterest.com/search/pins/?rs=typed&q=" + searchQuery + "\",\"merchant_url\":\"https://www.pinterest.com/search/pins/?rs=typed&q=" + searchQuery + "\"}"
                    }]
                })
            });
        }

        const interactiveMessage = generateWAMessageFromContent(from, {
            'viewOnceMessage': {
                'message': {
                    'messageContextInfo': {
                        'deviceListMetadata': {},
                        'deviceListMetadataVersion': 2
                    },
                    'interactiveMessage': proto.Message.InteractiveMessage.fromObject({
                        'body': proto.Message.InteractiveMessage.Body.create({
                            'text': "[❗] Results for: " + searchQuery
                        }),
                        'footer': proto.Message.InteractiveMessage.Footer.create({
                            'text': "🔎 `P I N T E R E S T - S E A R C H`"
                        }),
                        'header': proto.Message.InteractiveMessage.Header.create({
                            'hasMediaAttachment': false
                        }),
                        'carouselMessage': proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                            'cards': [...cards]
                        })
                    })
                }
            }
        }, {
            'quoted': m
        });

        await conn.relayMessage(from, interactiveMessage.message, {
            'messageId': interactiveMessage.key.id
        });

    } catch (error) {
        console.error('Pinterest Search Error:', error);
        reply("❌ Failed to search Pinterest. Please try again.");
    }
});
