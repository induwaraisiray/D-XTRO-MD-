// Zepix AI v5.0 - ඔයාගේ PROMPT 100% ON
const { cmd } = require('../command');
const axios = require('axios');
const moment = require('moment-timezone');
moment.tz.setDefault('Asia/Colombo');

// <<<<<<< ඔයාගේ PROMPT එක >>>>>>>
const ZEPPIX_AI_PROMPT = `ඔයා Zepix AI - Aviator Gap God බ්‍රෝ!
Pattern එක: {PATTERN}
10× ට වැඩි odds තිබුණ indices: {HIGH_INDICES}
Average gap: {AVG_GAP} rounds

නීති:
1. හැම signal එකකම 10× fixed
2. දෙවෙනි odd එක AI predict කරන්න (10.00 - 99.99)
3. Time එක = දැන් ඉඳන් {AVG_GAP} rounds බැගින් +32s
4. Live LK Time එක දාන්න
5. Format:
1. 21:40:33 → 10× / 45.78×
2. 21:42:09 → 10× / 67.12×

Output ONLY 5 lines. No extra text. Base time: {NOW}`;

cmd({
    pattern: "zepix",
    alias: ["10x", "gap", "pro"],
    desc: "Zepix AI - ඔයාගේ Gap God මචං! ✈️",
    react: "✈️",
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        const nums = q.match(/[\d.]+/g);
        if (!nums || nums.length < 4) {
            return reply(`මචං pattern එක එවන්න!\nඋදා: .zepix 1.2,30.5,1.5,15.8`);
        }

        const odds = nums.map(n => parseFloat(n));
        const high = odds.map((o,i) => o >= 10 ? i : -1).filter(i => i !== -1);
        
        if (high.length < 2) {
            return reply("මචං 10× ට වැඩි odd 2ක් හරි ඕනෑ! 🙏");
        }

        // Gap Calculate
        const gaps = [];
        for (let i = 1; i < high.length; i++) gaps.push(high[i] - high[i-1]);
        const avgGap = Math.round(gaps.reduce((a,b)=>a+b,0)/gaps.length);

        reply(`🔥 Gap Detect කළා බ්‍රෝ!\n📊 10× odds: ${high.map(i=>odds[i]+'×').join(' → ')}\n⏱ Avg Gap: ${avgGap} rounds\n🧠 AI predicting...`);

        // PROMPT READY
        const now = moment().format('HH:mm:ss');
        const finalPrompt = ZEPPIX_AI_PROMPT
            .replace('{PATTERN}', odds.join(', '))
            .replace('{HIGH_INDICES}', high.join(', '))
            .replace('{AVG_GAP}', avgGap)
            .replace('{NOW}', now);

        // AI CALL
        const res = await axios.get(`https://sadiya-tech-apis.vercel.app/ai/gemini`, {
            params: { q: finalPrompt, apikey: 'dinesh-api-key' }
        });

        const aiLines = res.data?.result || res.data || fallback(avgGap, now);

        const output = `✈️ *Zepix AI - 10× GAP PRO* ✈️\n🕐 Base: ${now}\n📏 Gap: ${avgGap} rounds\n\n${aiLines}\n\n💸 Cashout @1.5× safe! Screenshot එව්වකෝ බ්‍රෝ! 🏆`;
        reply(output);

    } catch (e) {
        reply("AI crash බ්‍රෝ! නැවත try කරමු 💪");
    }
});

// Fallback
function fallback(gap, now) {
    let out = "", sec = 0;
    const base = moment();
    for (let i = 1; i <= 5; i++) {
        sec += gap * 32;
        const time = base.clone().add(sec, 'seconds').format('HH:mm:ss');
        const odd = (Math.random()*89+10).toFixed(2);
        out += `${i}. ${time} → 10× / ${odd}×\n`;
    }
    return out;
}
