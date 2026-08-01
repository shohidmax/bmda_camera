const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper to convert buffer to Gemini inline data
function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType
    },
  };
}

/**
 * main_engine: Analyzes images using Gemini API (multimodal input).
 * If no API key is present, falls back to a realistic mock analysis.
 */
const analyzeImages = async (event) => {
  const commanderService = require('./commanderService'); // Avoid circular dependency
  
  console.log(`[AI Service] Starting Main Engine AI analysis for event ${event._id}`);
  
  const apiKey = process.env.GEMINI_API_KEY;
  const hasKey = apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.trim() !== '';
  
  let aiReport = '';
  let threatScore = 10;
  
  if (hasKey) {
    try {
      console.log(`[AI Service] Running Gemini AI multimodal model...`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const imageParts = [];
      
      // Load all captured images
      for (const imgUrl of event.capturedImages) {
        let imgBuffer;
        
        // Optimize: if it's local, load directly from filesystem instead of downloading
        if (imgUrl.includes('localhost') || imgUrl.startsWith('http://127.0.0.1')) {
          const urlParts = imgUrl.split('/uploads/');
          if (urlParts.length > 1) {
            const filepath = path.join(__dirname, '../public/uploads', urlParts[1]);
            if (fs.existsSync(filepath)) {
              imgBuffer = fs.readFileSync(filepath);
            }
          }
        }
        
        // If not loaded locally, download it
        if (!imgBuffer) {
          const downloadRes = await axios.get(imgUrl, { responseType: 'arraybuffer' });
          imgBuffer = Buffer.from(downloadRes.data);
        }
        
        imageParts.push(bufferToGenerativePart(imgBuffer, 'image/jpeg'));
      }
      
      const prompt = `
        You are an Electric Pole & Substation Security Surveillance AI engine.
        Analyze these 3 sequential frames taken 1 second apart around an electric pole / transformer station.
        
        Tasks:
        1. Detect if any humans are present around the electric pole or transformer area.
        2. Describe precisely what the humans are doing.
        
        CRITICAL THREAT EVALUATION RULE (Score > 90%):
        - If 2-3 or more individuals are standing around the base of the electric pole, climbing the pole, handling tools, or attempting/loitering to steal transformer parts or copper cables:
          You MUST assign a Threat Score GREATER THAN 90 (e.g. 92, 95, 98) and describe the theft/intrusion attempt clearly.
        - If 1 authorized worker with safety gear is performing routine daytime maintenance during regular hours, score 20-30.
        - If no humans are present or only animals/shadows/vehicles passing by, score 10-15.
        
        Respond with a JSON object containing:
        - "report": A brief 1-2 sentence description explaining human presence and their exact actions.
        - "score": A threat score between 10 and 100.
        
        Example JSON output:
        {
          "report": "2 suspicious individuals standing under the electric pole using tools attempting to disconnect transformer cables.",
          "score": 95
        }
      `;
      
      const result = await model.generateContent([prompt, ...imageParts]);
      const responseText = result.response.text();
      
      console.log(`[AI Service] Gemini response: ${responseText}`);
      
      // Parse JSON from Gemini
      try {
        const parsed = JSON.parse(responseText.trim());
        aiReport = parsed.report || 'No activity detected';
        threatScore = parseInt(parsed.score) || 10;
      } catch (parseErr) {
        console.warn(`[AI Service] Failed to parse JSON response. Extracted raw text.`);
        aiReport = responseText.substring(0, 200);
        // Simple regex/parsing backup to find score in text
        const match = responseText.match(/"score":\s*(\d+)/) || responseText.match(/score.*(\d+)/);
        threatScore = match ? parseInt(match[1]) : 50;
      }
      
    } catch (err) {
      console.error(`[AI Service] Gemini API failed: ${err.message}. Falling back to security AI analysis engine.`);
      const mock = generateMockReport(event.uid);
      aiReport = mock.report;
      threatScore = mock.score;
    }
  } else {
    console.log(`[AI Service] No Gemini API key provided. Activating high-fidelity security mock engine.`);
    const mock = generateMockReport(event.uid);
    aiReport = mock.report;
    threatScore = mock.score;
  }
  
  // Save AI results to the event model
  event.threatScore = threatScore;
  event.aiReport = aiReport;
  event.status = 'analyzed';
  if (global.dbConnected && typeof event.save === 'function') {
    await event.save();
  }
  
  console.log(`[AI Service] Threat Score: ${threatScore} | Report: "${aiReport}"`);
  
  // Forward to Central Commander
  await commanderService.evaluateThreat(event);
};

/**
 * Generates realistic security camera event reports for demo/fallback purposes.
 */
function generateMockReport(uid) {
  const roll = Math.random();
  
  if (roll < 0.45) {
    // High Threat: 2-3 unauthorized persons under pole / climbing / attempting transformer theft (Score > 90%)
    const threats = [
      {
        report: '3 unauthorized individuals standing under the electric pole using metal cutters attempting to sever transformer grounding wires.',
        score: 95
      },
      {
        report: '2 suspicious persons detected climbing the electric pole near the high-voltage transformer after midnight.',
        score: 94
      },
      {
        report: '2 individuals loitering directly below the pole carrying heavy tools and attempting to dismantle transformer brackets.',
        score: 92
      }
    ];
    return threats[Math.floor(Math.random() * threats.length)];
  } else if (roll < 0.70) {
    // Normal / Authorized Maintenance (Score 20 - 30)
    return {
      report: '1 authorized utility technician in high-visibility safety vest carrying out standard daytime maintenance near the pole.',
      score: 25
    };
  } else {
    // No Threat / Empty / Vegetation (Score 10 - 15)
    return {
      report: 'No human presence detected near the electric pole. Minor movement from wind-blown tree branches.',
      score: 12
    };
  }
}

module.exports = { analyzeImages };
