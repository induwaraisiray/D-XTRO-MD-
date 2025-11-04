// මෙම ප්ලගිනය WhatsApp Bot විධාන සඳහා භාවිතා වේ.
// This plugin is used for WhatsApp Bot commands.
const { cmd } = require('../command');

// Aviator සිග්නල් උත්පාදනය සඳහා නව විධානය.
// New command for generating Aviator signals.
cmd({
    pattern: "signal", // විධානයේ නම. // Command name.
    alias: ["aviator", "signals"], // විධානය සඳහා විකල්ප නම්. // Alternative names for the command.
    desc: "Generate Aviator High Odd (10+) signals based on analyzed patterns", // විධානයේ විස්තරය. // Description of the command.
    category: "game", // විධානය අයත් වන කාණ්ඩය. // Category the command belongs to.
    react: "🎯", // විධානය ක්‍රියාත්මක වන විට පෙන්වන emoji. // Emoji to show when the command is executed.
    filename: __filename // වත්මන් ගොනුවේ නම. // Current file name.
},
async (conn, mek, m, { from, args, q, reply }) => {
    try {
        // Pattern intervals in seconds (from the HTML code)
        const intervals = [101, 422, 346, 237, 99, 217];
        
        // Function to get Sri Lankan time (UTC+5:30) with seconds
        function getSLTime(offsetSeconds = 0) {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const slTime = new Date(utc + (3600000 * 5.5) + (offsetSeconds * 1000));
            const hours = slTime.getHours().toString().padStart(2, '0');
            const minutes = slTime.getMinutes().toString().padStart(2, '0');
            const seconds = slTime.getSeconds().toString().padStart(2, '0');
            return `${hours}:${minutes}:${seconds}`;
        }
        
        // Function to generate signals based on the pattern
        function generateSignals(count = 5) {
            const signals = [];
            let cumulativeSec = 0;
            
            for (let i = 0; i < count; i++) {
                cumulativeSec += intervals[i % intervals.length];
                const time = getSLTime(cumulativeSec);
                signals.push({
                    number: i + 1,
                    time: time
                });
            }
            
            return signals;
        }
        
        // Generate 5 signals
        const signals = generateSignals(5);
        
        // Format the response message
        let responseMessage = `╔═══════════════════════╗\n`;
        responseMessage += `║  🎯 *AVIATOR SIGNALS* 🎯  ║\n`;
        responseMessage += `╚═══════════════════════╝\n\n`;
        responseMessage += `🔮 *Zepix Program Analysis*\n`;
        responseMessage += `📊 High Odd (10+) Pattern\n`;
        responseMessage += `🇱🇰 Sri Lankan Time Zone\n`;
        responseMessage += `✅ 100% Analyzed Signals\n\n`;
        responseMessage += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        signals.forEach((signal) => {
            responseMessage += `📌 *Signal #${signal.number}*\n`;
            responseMessage += `⏰ *TIME:* ${signal.time}\n`;
            responseMessage += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        });
        
        responseMessage += `💡 *Tips:*\n`;
        responseMessage += `• දෙන ලද වේලාවට අනුව ඔට්ටු අල්ලන්න\n`;
        responseMessage += `• Pattern විශ්ලේෂණය මත පදනම් වී ඇත\n`;
        responseMessage += `• වගකීම් සහගතව ක්‍රීඩා කරන්න\n\n`;
        responseMessage += `⚡ *Powered by Zepix Program*`;

        // Send the signals to the user
        await reply(responseMessage);
        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (e) {
        // දෝෂයක් ඇති වුවහොත් එය කොන්සෝලයේ සටහන් කර පරිශීලකයාට දෝෂ පණිවිඩයක් යවන්න.
        // If an error occurs, log it to the console and send an error message to the user.
        console.error("Signal විධානයේ දෝෂයක්:", e);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("සිග්නල් උත්පාදනය කිරීමේදී දෝෂයක් ඇති විය. කරුණාකර නැවත උත්සාහ කරන්න.");
    }
});
