// Zepix AI - Aviator Signal යාලුවා v2.0 (Live LK Time + 32s Gap)
// WhatsApp Bot Plugin
const { cmd } = require('../command');
const axios = require('axios');
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Colombo');
moment.locale('si');

cmd({
    pattern: "zepix",
    alias: ["signal", "avi", "chart"],
    desc: "Zepix AI - Live Aviator Signals බ්‍රෝ! ✈️",
    category: "game",
    react: "✈️",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        const text = q?.toLowerCase().trim();

        // Live Base Time
        let base = moment();
        const formatTime = (addSec) => base.clone().add(addSec, 'seconds').format('HH:mm:ss');

        // AI Predict Second Multiplier
        const getSecondOdd = async (pattern) => {
            const prompt = `Pattern: ${pattern || "Random"}
10× fixed. දෙවෙනි odd එක predict කරන්න (10.00 - 99.99).
Output ONLY number. Example: 34.56`;
            try {
                const res = await axios.get(`https://sadiya-tech-apis.vercel.app/ai/gemini`, {
                    params: { q: prompt, apikey: 'dinesh-api-key' }
                });
                const num = parseFloat(res.data?.result || res.data || "23.45");
                return isNaN(num) ? "23.45" : num.toFixed(2);
            } catch {
                return (Math.random() * 89 + 10).toFixed(2);
            }
        };

        // Generate 5 Signals
        const generateLiveSignals = async (type) => {
            let signals = `✈️ *Zepix AI - LIVE SIGNALS බ්‍රෝ!* ✈️\n`;
            signals += `🕐 Base: ${formatTime(0)}\n\n`;

            for (let i = 1; i <= 5; i++) {
                const sec = i * 32;
                const time = formatTime(sec);
                const secondOdd = await getSecondOdd(q);
                signals += `${i}. ${time} → 10× / ${secondOdd}×\n`;
                if (i < 5) signals += `   ⏳ +32s gap\n`;
            }
            signals += `\n💸 කීයක් cashout කළා මචං? Screenshot එව්වකෝ! 🔥`;
            return signals;
        };

        // signal10× or signalall
        if (text.includes('signal10') || text.includes('10') || text.includes('all') || text === '') {
            reply("🚨 බ්‍රෝ signals loading... 32s gap එකෙන් එනවා! ⏰");
            const livePack = await generateLiveSignals();
            return reply(livePack);
        }

        // Chart Pattern
        const nums = q.match(/[\d.]+/g);
        if (nums && nums.length >= 3) {
            reply(`📊 Pattern lock කළා: ${nums.slice(-4).join(', ')}\n⏰ Live signals එනවා...`);
            const livePack = await generateLiveSignals();
            return reply(livePack);
        }

        // Menu
        reply(`✈️ *Yo මචං! Zepix AI එක ready!* ✈️

🔥 විධාන:
.zepix → Live 5 signals (10× / XX×)
.zepix signal10× → same
.zepix 1.2,30.1,2.3 → pattern analyze

⏰ 32s gap | Live LK Time
අද කීයක් 10× cashout කළා? Screenshot එව්වකෝ! 🏆`);

        conn.sendMessage(from, { react: { text: "🔥", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("❌ බ්‍රෝ crash! .zepix කියලා නැවත try කරමු! 💪");
    }
});
