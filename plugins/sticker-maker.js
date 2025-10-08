const { setAntitag, getAntitag, removeAntitag } = require('../lib/index');
const { cmd } = require('../command');

cmd({
    pattern: "antitag",
    alias: ["antitagall"],
    desc: "Prevent mass tagging in groups",
    category: "group",
    use: ".antitag on/off/set",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, reply, text, prefix }) => {
    try {
        if (!isGroup) return reply("❌ Group command only");
        if (!isAdmins) return reply("❌ Admins only");

        let args = text.split(' ').slice(1);
        let action = args[0];

        if (!action) {
            return reply(`📌 *Usage:*\n${prefix}antitag on\n${prefix}antitag off\n${prefix}antitag set delete\n${prefix}antitag set kick`);
        }

        switch (action) {
            case 'on':
                let current = await getAntitag(from);
                if (current?.enabled) return reply("✅ Antitag already ON");
                await setAntitag(from, { enabled: true, action: 'delete' });
                return reply("✅ Antitag turned ON");
            
            case 'off':
                await removeAntitag(from);
                return reply("✅ Antitag turned OFF");
            
            case 'set':
                let setAction = args[1];
                if (!['delete', 'kick'].includes(setAction)) {
                    return reply("❌ Use: delete or kick");
                }
                await setAntitag(from, { enabled: true, action: setAction });
                return reply(`✅ Action set to: ${setAction}`);
            
            default:
                return reply("❌ Invalid option");
        }
    } catch (error) {
        console.error(error);
        return reply("❌ Command error");
    }
});
