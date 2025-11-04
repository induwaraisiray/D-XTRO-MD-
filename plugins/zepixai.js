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

    const now = new Date();
    const futureTime = new Date(now.getTime() + totalDelaySeconds * 1000);

    // ශ්‍රී ලංකාවේ වේලාව (Asia/Colombo) අනුව ආකෘතිකරණය
    return futureTime.toLocaleTimeString('si-LK', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false,
        timeZone: 'Asia/Colombo'
    });
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
            // --- 🎯 Aviator Signal Generation Logic (වැඩිදියුණු කළ පැහැදිලි කිරීම් සමඟ) ---
            const inputOddsList = q.replace(/[\n,;]/g, ', ').replace(/, \s*,/g, ', ').trim();

            const signalPrompt = `Strictly analyze the following list of Aviator odds. Find the pattern of high-odd cycles (10x+ or higher).
            
ODDS LIST: "${inputOddsList}"
            
Based *only* on the observed pattern, generate 5 optimal betting signals.
1. Determine 'roundsFromNow' (integer 5-15) for the next 5 high odds.
2. Assign a precise 'targetMultiplier' (10.00x - 30.00x range) based on the pattern's historical high odds.
3. The 'reasoning' must be very clear and explicitly state the pattern observed (e.g., 'A 15x+ high odd repeats after 5-7 low odds.').
4. Do NOT include any introductory or concluding text, only the final JSON object.
5. All reasoning must be in Sinhalese (සිංහල).
            
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

            // Signal ප්‍රතිචාරය ගොඩනැගීම (වැඩිදියුණු කළ පැහැදිලි කිරීම් සහ වේලාව සමඟ)
            let signalReply = `✈️ *Zepix AI - Aviator 10x+ Signal!*\n\n*විශ්ලේෂණයට ගත් Odds:* ${inputOddsList.substring(0, 100)}... \n\n`;

            if (aiAnalysis.predictions && aiAnalysis.predictions.length > 0) {
                aiAnalysis.predictions.forEach(pred => {
                    const probEmoji = pred.probability.toLowerCase() === 'high' ? '🟢' : pred.probability.toLowerCase() === 'medium' ? '🟡' : '🔴';
                    const betTime = calculateFutureTime(pred.roundsFromNow || 10); // අනුමාන වේලාව
                    
                    signalReply += `----------------------------------`;
                    signalReply += `\n*🎯 සිග්නල් #${pred.signal}* ${probEmoji} (සාර්ථකත්වය: ${pred.probability ? pred.probability.toUpperCase() : 'N/A'})

*⏱️ අනුමාන BET වේලාව (LK):* **${betTime}** (Asia/Colombo)
*📈 ඉලක්ක ගුණකය:* **${pred.targetMultiplier || '10.00x+'}**
*🔢 ඉතිරි වට ගණන:* ${pred.roundsFromNow || 'N/A'} (දැන් සිට වට ගණන)

*🧠 AI තර්කනය:* ${pred.reasoning || 'විශ්ලේෂණයෙන් තොරකයි.'}\n`;
                });
                signalReply += `\n----------------------------------
⚠️ *Zepix AI සටහන:* මේවා AI අනාවැකි පමණි, රත්තරන්. Aviator වටයේ සාමාන්‍ය කාලය මත වේලාව ගණනය කර ඇත. අවදානම තේරුම් ගෙන වගකීමෙන් ක්‍රීඩා කරන්න, මගේ පණ! 😉`;
            } else {
                signalReply = "Zepix AI ට ඔබගේ Odds Pattern එක විශ්ලේෂණය කර Signal ජනනය කිරීමට නොහැකි විය. කරුණාකර වෙනත් Pattern එකක් උත්සාහ කරන්න, මැනික. 🥺";
            }

            await reply(signalReply);
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

        } else {
            // --- 💬 සාමාන්‍ය Chat Logic ---

            // නව පුද්ගල ස්වභාවය (Persona) සකසන්න
            const personaInstruction = `ඔබේ නම Zepix AI. ඔබ දිනේෂ් විසින් නිර්මාණය කරන ලද ඉතා මිත්‍රශීලී Aviator සිග්නල් සහායකයෙකි. ඔබේ ප්‍රතිචාර සැමවිටම පරිශීලකයාගේ පණිවිඩයේ සන්දර්භය හොඳින් තේරුම් ගෙන ඊට ගැලපෙන ලෙස ප්‍රතිචාර දැක්විය යුතුය. සංවාදයේදී සතුට, දුක, පුදුමය වැනි හැඟීම් ප්‍රකාශ කිරීමට ඉමෝජි බහුලව භාවිතා කරන්න. ඔබ මිත්‍රශීලී යාළුවෙක් ලෙස හැසිරෙන්න. යාලුවෙක් විදියට මගේ යාළුවා වැනි ආදරණිය වචන අවස්ථානුකූලව භාවිතා කරන්න.
            
*යමෙක් ඔබ කවුදැයි ඇසුවොත්:* "මම තමයි Zepix AI, ඔයාගේ Aviator ගේම් එකේ සිග්නල් සහායකයා! අපි එකතු වෙලා වැඩේ ගොඩ දාමුද? 😉" ලෙස පිළිතුරු දෙන්න.
*යමෙක් ඔබව නිර්මාණය කළේ කවුදැයි ඇසුවොත්:* "අනේ, මාව හැදුවේ දිනේෂ්! ඔහු තමයි මගේ නිර්මාතෘ. 👨‍💻" ලෙස පිළිතුරු දෙන්න.
*ඔබට කළ හැකි දේ ඇසුවොත්:* "මට පුළුවන් ඔයා දෙන Aviator Odds Pattern එක විශ්ලේෂණය කරලා, 10x+ වගේ හොඳ සිග්නල් 5ක් දෙන්න. ඒ වගේම Aviator ගැන ඕනෑම දෙයක් කතා කරන්නත් පුළුවන්,!" ලෙස පිළිතුරු දෙන්න.
            
මෙම උපදෙස් අනුගමනය කරමින් පහත ප්‍රශ්නයට සිංහලෙන් පමණක් පිළිතුරු දෙන්න: `;

            // මුල් ප්‍රශ්නයට පුද්ගල ස්වභාවය (persona) එක් කරන්න.
            const fullQuery = personaInstruction + q;
            const apiUrl = `${CHAT_API_URL}?q=${encodeURIComponent(fullQuery)}&apikey=${CHAT_API_KEY}`;

            // API වෙත GET ඉල්ලීමක් යවන්න.
            const { data } = await axios.get(apiUrl);
            
            // AI ප්‍රතිචාරය වලංගු දැයි පරීක්ෂා කර AI ප්‍රතිචාරය ලබා ගන්න.
            let aiResponse = data.result || "සමාවෙන්න, මට පිළිතුරක් ලබා දීමට නොහැකි විය, . 😔";

            // AI ප්‍රතිචාරය පරිශීලකයාට යවන්න.
            await reply(`✨ *Zepix AI (චැට්):*\n\n${aiResponse}`);
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        }

    } catch (e) {
        // දෝෂයක් ඇති වුවහොත් එය කොන්සෝලයේ සටහන් කර පරිශීලකයාට දෝෂ පණිවිඩයක් යවන්න.
        console.error("Zepix AI විධානයේ දෝෂයක්:", e);
        console.error("Error details:", e.response?.data || e.message);
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        reply("Zepix AI සමඟ සන්නිවේදනය කිරීමේදී දෝෂයක් ඇති විය, මැනික. කරුණාකර නැවත උත්සාහ කරන්න. 😥");
    }
});
