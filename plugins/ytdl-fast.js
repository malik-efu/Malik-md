// --- Link Detection and Group Mute Logic ---
cmd({
    'on': "body"
}, async (conn, m, store, {
    from,
    body,
    sender,
    isGroup,
    isAdmins,
    isBotAdmins,
    reply
}) => {
    try {
        // Only act in groups where bot is admin and sender isn't admin
        if (!isGroup || isAdmins || !isBotAdmins) {
            return;
        }

        // Check if the feature is enabled (You must set this config variable based on the 'antimute on/off' command)
        // **I'm using ANTI_MUTE_ENABLED here instead of ANTI_LINK to match the new feature name.**
        if (config.ANTI_MUTE_ENABLED !== 'true') {
             return;
        }

        // List of link patterns to detect (Exactly as you provided)
        const linkPatterns = [
            /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi, // WhatsApp links
            /https?:\/\/(?:api\.whatsapp\.com|wa\.me)\/\S+/gi,  // WhatsApp API links
            /wa\.me\/\S+/gi,                                     // WhatsApp.me links
            /https?:\/\/(?:t\.me|telegram\.me)\/\S+/gi,        // Telegram links
            /https?:\/\/(?:www\.)?\.com\/\S+/gi,                 // Generic .com links
            /https?:\/\/(?:www\.)?twitter\.com\/\S+/gi,          // Twitter links
            /https?:\/\/(?:www\.)?linkedin\.com\/\S+/gi,         // LinkedIn links
            /https?:\/\/(?:whatsapp\.com|channel\.me)\/\S+/gi,  // Other WhatsApp/channel links
            /https?:\/\/(?:www\.)?reddit\.com\/\S+/gi,          // Reddit links
            /https?:\/\/(?:www\.)?discord\.com\/\S+/gi,          // Discord links
            /https?:\/\/(?:www\.)?twitch\.tv\/\S+/gi,            // Twitch links
            /https?:\/\/(?:www\.)?vimeo\.com\/\S+/gi,            // Vimeo links
            /https?:\/\/(?:www\.)?dailymotion\.com\/\S+/gi,      // Dailymotion links
            /https?:\/\/(?:www\.)?medium\.com\/\S+/gi            // Medium links
        ];

        // Check if message contains any forbidden links
        const containsLink = linkPatterns.some(pattern => pattern.test(body));

        // Only proceed if a link is detected
        if (containsLink) {
            console.log(`Link detected from ${sender}: ${body}`);

            // 1. Delete the message
            try {
                await conn.sendMessage(from, {
                    delete: m.key
                });
                console.log(`Message deleted: ${m.key.id}`);
            } catch (error) {
                console.error("Failed to delete message:", error);
            }

            // 2. Mute the group (Set to Admin Only/Announcement)
            const response = await conn.groupSettingUpdate(from, 'announcement'); 
            
            // Send alert message
            if (response) {
                await conn.sendMessage(from, {
                    text: `*🚨 GROUP MUTED! 🚨*\n\n**Link detected** from @${sender.split('@')[0]}! \n\n*Group is now set to 'Admin Only' mode to secure the chat.*`,
                    mentions: [sender]
                });
            } else {
                 await reply("⚠️ Detected link, but failed to set group to 'Admin Only' mode. Ensure the bot has administrative privileges.");
            }

            // **KICK/REMOVE CODE IS DELETED AS REQUESTED**
        }
    } catch (error) {
        console.error("Anti-Mute error:", error);
        reply("❌ An error occurred while processing the message.");
    }
});
