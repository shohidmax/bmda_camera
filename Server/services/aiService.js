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
        You are a security camera AI engine. Analyze these 3 sequential frames taken 1 second apart.
        Review them for suspicious activities, security breaches, or human activity.
        Respond with a JSON object containing two fields:
        - "report": A brief 1-2 sentence description explaining what is happening. Keep it natural and concise.
        - "score": A threat score between 10 and 100 (where 10 is perfectly safe, 30 is normal human activity, 60 is suspicious activity, and 90+ is a confirmed intruder or active theft).
        
        Example JSON output:
        {
          "report": "A delivery courier is placing a package at the front door.",
          "score": 25
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
      console.error(`[AI Service] Gemini API failed: ${err.message}. Falling back to mock engine.`);
      const mock = generateMockReport(event.uid);
      aiReport = `[API Error Fallback] ${mock.report}`;
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
  // Let's create an 20% chance of threat (score 80-95), and 80% chance of standard activities
  const roll = Math.random();
  
  if (roll < 0.20) {
    // Threat / Intruder event (Score 80 - 95 as required by server plan)
    const threats = [
      {
        report: 'Suspicious individual wearing a dark hoodie attempting to open the side window window latch.',
        score: 88
      },
      {
        report: 'An unrecognized person trespassing in the backyard courtyard holding tools near the storage shed.',
        score: 92
      },
      {
        report: 'Forced entry attempt detected at the front entryway lock by a masked individual.',
        score: 94
      }
    ];
    return threats[Math.floor(Math.random() * threats.length)];
  } else if (roll < 0.50) {
    // Normal activity (low scores)
    return {
      report: 'A mail carrier wearing a standard uniform is dropping off a parcel on the porch.',
      score: 20
    };
  } else if (roll < 0.75) {
    // Wildlife / Pets
    return {
      report: 'Neighborhood stray cat walking across the driveway. No human presence detected.',
      score: 12
    };
  } else {
    // Wind / Shadows / Empty
    return {
      report: 'No movement detected. Brief glare from sunlight reflections or tree shadows moving.',
      score: 10
    };
  }
}

module.exports = { analyzeImages };
