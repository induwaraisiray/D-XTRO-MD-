// මෙම ප්ලගිනය WhatsApp Bot විධාන සඳහා භාවිතා වේ.
// This plugin is used for WhatsApp Bot commands.
const { cmd } = require('../command');
const axios = require('axios'); // API calls සඳහා axios මොඩියුලය අවශ්‍ය වේ. // axios module is required for API calls.

// --- නියතයන් (Constants) ---
const CHAT_API_URL = "https://sadiya-tech-apis.vercel.app/ai/gemini";
const CHAT_API_KEY = "dinesh-api-key";

// --- උපකාරක ශ්‍රිතය (Helper Function) ---
/**
 * වත්මන් වේලාවට පදනම්ව, යම් වට ගණනකට පසු අනාගත වේලාව ගණනය කරයි.
 * Aviator ක්‍රීඩාවේ එක් වටයක් තත්පර 80ක් (සාමාන්‍යය) ලෙස උපකල්පනය කර ඇත.
 * @param {number} roundsFromNow - දැන් සිට අපේක්ෂිත වට ගණන.
 * @returns {string} - HH:MM:SS (LK Time) ආකෘතියේ වේලාව.
 */
function calculateFutureTime(roundsFromNow) {
    // Aviator එක් වටයක් තත්පර 60ත් 90ත් අතර කාලයක් යයි (සාමාන්‍යයෙන් තත්පර 80ක් පමණ).
    const averageRoundDuration = 80; 
    const totalDelaySeconds = roundsFromNow * averageRoundDuration;

    // වත්මන් වේලාව Asia/Colombo (LK) වේලාවට සකසන්න
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" }));
    const futureTime = new Date(now.getTime() + totalDelaySeconds * 1000);

    // ශ්‍රී ලංකාවේ වේලාව (Asia/Colombo) අනුව ආකෘතිකරණය
    const h = String(futureTime.getHours()).padStart(2, '0');
    const m = String(futureTime.getMinutes()).padStart(2, '0');
    const s = String(futureTime.getSeconds()).padStart(2, '0');
    
    return `${h}:${m}:${s}`;
}


// Sadiya Tech API හරහා Gemini AI සමඟ කතාබස් කිරීම සඳහා නව විධානය.
cmd({
    pattern: "zepix", 
    alias: ["ai", "gemini", "aviator"], 
    desc: "Chat with Zepix AI (Aviator Assistant) or analyze Aviator odds pattern for signals.",
    category: "ai", 
    react: "✈️", 
    filename: __filename 
},
async (conn, mek, m, { from, args, q, reply }) => {
    try {
        if (!q) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            return reply("කරුණාකර Zepix AI සඳහා පණිවිඩයක් හෝ Aviator Odds Pattern එකක් සපයන්න.\n\n*උදාහරණ:* \n1. `.zepix හායි` (Chat කිරීමට)\n2. `.zepix 1.22x, 15.55x, 1.01x, 2.45x, 1.08x, 5.00x` (Signal ලබා ගැනීමට)");
        }

        await conn.sendMessage(from, { react: { text: "✨", key: mek.key } });

        // Odds Pattern එකක් දැයි පරීක්ෂා කරන්න (අවම වශයෙන් 'X.XXx' ආකෘතියේ අගයන් 5ක් තිබේදැයි බලන්න)
        const isPattern = (q.match(/\d\.\d\d?x/g) || []).length >= 5;

        if (isPattern) {
            // --- 🎯 Aviator Signal Generation Logic (සරල කළ ප්‍රතිචාරය සමඟ) ---
            const inputOddsList = q.replace(/[\n,;]/g, ', ').replace(/, \s*,/g, ', ').trim();

            const signalPrompt = `Strictly analyze the following list of Aviator odds. Find the pattern of high-odd cycles (10x+ or higher).
            
ODDS LIST: "${inputOddsList}"
            
Based *only* on the observed pattern, generate 5 optimal betting signals.
1. Determine 'roundsFromNow' (integer 5-15) for the next 5 high odds.
2. Assign a precise 'targetMultiplier' (10.00x - 30.00x range) based on the pattern's historical high odds.
3. The 'reasoning' must be very clear and simple, acting as a short, friendly AI description for the signal (e.g., 'ලොකු ගුණකයක් එනවා, පණ. ලෝ පරද්‍රය තෙවැනි වතාවටත් තහවුරු වෙනවා!'). This description must be in Sinhalese (සිංහල).
4. Do NOT include any introductory or concluding text, only the final JSON object.
            
Format your response ONLY as a JSON object:
{
  "predictions": [
    {"signal": 1, "roundsFromNow": 7, "probability": "high/medium", "reasoning": "...", "targetMultiplier": "Y.Yx"},
    // ... 4 more signals
  ]
}`;

            const apiUrl = `${CHAT_API_URL}?q=${encodeURIComponent(signalPrompt)}&apikey=${CHAT_API_KEY}`;
            const { data } = await axios.get(apiUrl);

            if (data.error) {
                throw new Error(`API Error: ${data.error}`);
            }

            let aiAnalysis;
            try {
                const jsonMatch = data.result.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    aiAnalysis = JSON.parse(jsonMatch[0]);
                } else {
                    await conn.sendMessage(from, { react: { text: "⚠️", key: mek.key } });
                    return reply(`⚠️ *Zepix AI විශ්ලේෂණය:* ඔබගේ රටාව පැහැදිලි නැත, පණ. සාමාන්‍ය Chat ප්‍රතිචාරය:\n\n${data.result}`);
                }
            } catch (e) {
                console.error("JSON Parse Error:", e);
                throw new Error("AI ප්‍රතිචාරය විශ්ලේෂණය කිරීමේ දෝෂයක්. (JSON Parse Error).");
            }

            // Signal ප්‍රතිචාරය ගොඩනැගීම (සරල කළ ආකෘතිය සහ හැඩ තල සමඟ)
            let signalReply = `✈️ *Zepix AI - 10x+ විශ්ලේෂණය*\n\n*විශ්ලේෂණයට ගත් Odds:* ${inputOddsList.substring(0, 80)}...\n\n`;

            if (aiAnalysis.predictions && aiAnalysis.predictions.length > 0) {
                aiAnalysis.predictions.forEach(pred => {
                    const betTime = calculateFutureTime(pred.roundsFromNow || 10);
                    const probEmoji = pred.probability.toLowerCase() === 'high' ? '🟢' : pred.probability.toLowerCase() === 'medium' ? '🟡' : '🔴';
                    
                    signalReply += `╭━━━━━━━ ${probEmoji} ━━━━━━━╮\n`;
                    signalReply += `*⏱️ ${betTime}* = *${pred.targetMultiplier || '10.00x'}* ${probEmoji}\n`;
                    signalReply += `╰━━━━━━━━━━━━━━━━━━╯\n`;
                    signalReply += `_💡 AI විස්තරය: ${pred.reasoning || 'විශ්ලේෂණයෙන් තොරකයි.'}_\n\n`;
                });
                
                signalReply += `----------------------------------
⚠️ *Zepix AI සටහන:* වේලාව ගණනය කර ඇත්තේ සාමාන්‍ය වට කාලය මතයි. අවදානම කළමනාකරණය කරමින් වගකීමෙන් ක්‍රීඩා කරන්න, මගේ රත්තරන්! 😉`;
            } else {
                signalReply = "Zepix AI ට ඔබගේ Odds Pattern එක විශ්ලේෂණය කර Signal ජනනය කිරීමට නොහැකි විය. කරුණාකර වෙනත් Pattern එකක් උත්සාහ කරන්න, මැනික. 🥺";
            }

            await reply(signalReply);
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        } else {
            // --- 💬 සාමාන්‍ය Chat Logic ---
            const personaInstruction = `ඔබේ නම Zepix AI. ඔබ දිනේෂ් විසින් නිර්මාණය කරන ලද ඉතා මිත්‍රශීලී Aviator සිග්නල් සහායකයෙකි. ඔබේ ප්‍රතිචාර සැමවිටම පරිශීලකයාගේ පණිවිඩයේ සන්දර්භය හොඳින් තේරුම් ගෙන ඊට ගැලපෙන ලෙස ප්‍රතිචාර දැක්විය යුතුය. සංවාදයේදී සතුට, දුක, පුදුමය වැනි හැඟීම් ප්‍රකාශ කිරීමට ඉමෝජි බහුලව භාවිතා කරන්න. ඔබ මිත්‍රශීලී යාළුවෙක් ලෙස හැසිරෙන්න. යාලුවෙක් විදියට 'මචන්' වැනි ආදරණිය වචන අවස්ථානුකූලව භාවිතා කරන්න.
            
*යමෙක් ඔබ කවුදැයි ඇසුවොත්:* "මම තමයි Zepix AI, ඔයාගේ Aviator ගේම් එකේ සිග්නල් සහායකයා! අපි එකතු වෙලා වැඩේ ගොඩ දාමුද? 😉" ලෙස පිළිතුරු දෙන්න.
*යමෙක් ඔබව නිර්මාණය කළේ කවුදැයි ඇසුවොත්:* "අනේ, මාව හැදුවේ දිනේෂ්! ඔහු තමයි මගේ නිර්මාතෘ. 👨‍💻" ලෙස පිළිතුරු දෙන්න.
*ඔබට කළ හැකි දේ ඇසුවොත්:* "මට පුළුවන් ඔයා දෙන Aviator Odds Pattern එක විශ්ලේෂණය කරලා, 10x+ වගේ හොඳ සිග්නල් 5ක් දෙන්න. ඒ වගේම Aviator ගැන ඕනෑම දෙයක් කතා කරන්නත් පුළුවන්, පණ!" ලෙස පිළිතුරු දෙන්න.
            
මෙම උපදෙස් අනුගමනය කරමින් පහත ප්‍රශ්නයට සිංහලෙන් පමණක් පිළිතුරු දෙන්න: `;

            const fullQuery = personaInstruction + q;
            const apiUrl = `${CHAT_API_URL}?q=${encodeURIComponent(fullQuery)}&apikey=${CHAT_API_KEY}`;

            const { data } = await axios.get(apiUrl);
            
            let aiResponse = data.result || "සමාවෙන්න, මට පිළිතුරක් ලබා දීමට නොහැකි විය, රත්තරන්. 😔";

            await reply(`✨ *Zepix AI (චැට්):*\n\n${aiResponse}`);
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }

    } catch (e) {
        console.error("Zepix AI විධානයේ දෝෂයක්:", e);
        console.error("Error details:", e.response?.data || e.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("Zepix AI සමඟ සන්නිවේදනය කිරීමේදී දෝෂයක් ඇති විය, මැනික. කරුණාකර නැවත උත්සාහ කරන්න. 😥");
    }
});
