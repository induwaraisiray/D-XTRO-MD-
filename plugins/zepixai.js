// Zepix AI - Aviator Signal යාලුවා (Gemini AI + LK Time)
// WhatsApp Bot Plugin - signal10× & signalall
const { cmd } = require('../command');
const axios = require('axios');
const moment = require('moment-timezone');
require('moment/locale/si'); // Sinhala time names
moment.locale('si');

const lkTime = () => moment().tz('Asia/Colombo').format('hh:mm:ss A');

// Gemini AI Signal Generator (යාලු style prompt)
const getZepixSignals = async (type, pattern = "") => {
    const prompt = `Yo bro! මම Zepix AI – ඔයාගේ Aviator යාලුවා! 🚀
Pattern එක: ${pattern || "Random bro"}
Request: ${type === '10×' ? '10× ට වැඩි 5 signals' : '2× ට වැඩි 5 signals'}

Rules:
- 5 signals හදන්න
- Odd: ${type === '10×' ? '10.00 - 99.99' : '2.00 - 9.99'}
- Format: Signal 1 ➜ 23.45× 💰
- Live LK Time දාන්න
- Tag: 10× → 💰 | 2×+ → 💸
- අන්තිමට: "කීයක් win කළා බ්‍රෝ? Screenshot එව්වකෝ! 🔥"

Pattern තිබ්බොත් analyze කරලා predict කරන්න.
Random නම් trending pattern එකක් හදන්න.
කතා කරන්න යාලු style – "බ්‍රෝ", "මචං", "ගමු", "moon එකට" වගේ!

Output ONLY signals + යාලු comment. No extra text.`;

    try {
        const res = await axios.get(`https://sadiya-tech-apis.vercel.app/ai/gemini`, {
            params: { q: prompt, apikey: 'dinesh-api-key' }
        });

        let aiText = res.data?.result || res.data?.response || res.data || "AI එක sleep 😴";
        return aiText.trim();
    } catch (e) {
        // Fallback – යාලු style
        let fallback = `🚨 AI down බ්‍රෝ! මම හදලා දෙන්නම්!\n\n`;
        const min = type === '10×' ? 10 : 2;
        const max = type === '10×' ? 99 : 9.9;
        for (let i = 1; i <= 5; i++) {
            const odd = (Math.random() * (max - min) + min).toFixed(2);
            fallback += `Signal ${i} ➜ ${odd}× ${type === '10×' ? '💰' : '💸'}\n⏰ LK Time: ${lkTime()}\n\n`;
        }
        return fallback + `කීයක් win කළා මචං? Screenshot එව්වකෝ! 🔥`;
    }
};

cmd({
    pattern: "zepix",
    alias: ["signal", "avi", "chart", "bro"],
    desc: "Zepix AI - ඔයාගේ Aviator Signal යාලුවා 🚀",
    category: "game",
    react: "✈️",
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        const text = q?.toLowerCase().trim();

        // === signal10× ===
        if (text.includes('signal10') || text.includes('10×') || text === '10x') {
            reply("🧠 මචං AI එක analyze කරනවා... 10× MOON එකට ready වෙයන්! 🚀");
            const signals = await getZepixSignals('10×');
            return reply(`💰 *Zepix AI - 10×+ PACK බ්‍රෝ!* 💰\n\n${signals}`);
        }

        // === signalall ===
        if (text.includes('signalall') || text.includes('all')) {
            reply("🔥 බ්‍රෝ easy win එකට load වෙනවා... 2×+ ගමු! 💸");
            const signals = await getZepixSignals('2×+');
            return reply(`💸 *Zepix AI - ALL WIN PACK මචං!* 💸\n\n${signals}`);
        }

        // === Chart Pattern Analyzer ===
        const nums = q.match(/[\d.]+/g);
        if (nums && nums.length >= 3) {
            const pattern = nums.slice(-4).join(', ');
            reply(`📊 Pattern lock කළා බ්‍රෝ: ${pattern}\n🧠 AI එක predict කරනවා...`);
            const signals = await getZepixSignals('auto', pattern);
            return reply(`📈 *Zepix AI - CHART PREDICTION මචං!* 📈\nPattern: ${pattern}\n\n${signals}`);
        }

        // === Default Menu (යාලු style) ===
        reply(`✈️ *Yo බ්‍රෝ! මම Zepix AI – ඔයාගේ Aviator Signal යාලුවා!* ✈️  

🔥 විධාන:  
.zepix signal10×   ➜ 10×+ 5 signals  
.zepix signalall   ➜ 2×+ 5 signals  
.zepix 10.2,30.1,1.5,2.3  ➜ Pattern analyze  

⏰ Live LK Time | 💯 Gemini AI Powered  
අද කීයක් win කළා මචං? Screenshot එව්වකෝ – මම proud වෙන්නම්! 🏆  
ගමු moon එකට! 🚀`);

        conn.sendMessage(from, { react: { text: "🔥", key: mek.key } });

    } catch (e) {
        console.error(e);
        reply("❌ බ්‍රෝ AI crash! .zepix signal10× කියලා නැවත try කරමු! 💪");
    }
});
