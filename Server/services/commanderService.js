const axios = require('axios');

/**
 * Central_Commandar: Evaluates the analyzed event.
 * If score is 80-95%, calls a third-party API webhook and sends admin notifications.
 */
const evaluateThreat = async (event) => {
  try {
    const score = event.threatScore;
    console.log(`[Central Commander] Evaluating threat score: ${score}%`);
    
    // Check if score is in the critical 80% - 95% range
    if (score >= 80 && score <= 95) {
      console.log(`[Central Commander] ALERT! Threat score (${score}%) is within critical threshold (80-95%). Triggering Central Commander actions...`);
      
      const webhookUrl = process.env.COMMANDER_WEBHOOK_URL || 'https://httpbin.org/post';
      
      // Prepare payload to send to third-party API
      const alertPayload = {
        alert: true,
        threatLevel: 'CRITICAL',
        score: score,
        deviceId: event.uid,
        timestamp: event.time,
        eventRecordId: event._id,
        analysisReport: event.aiReport,
        images: event.capturedImages,
        systemMessage: `CRITICAL DETECTED: ${event.message || 'Security Breach Alert'}`
      };
      
      console.log(`[Central Commander] Dispatching webhook to: ${webhookUrl}`);
      
      try {
        const response = await axios.post(webhookUrl, alertPayload, { timeout: 8000 });
        console.log(`[Central Commander] Webhook trigger successful! Status: ${response.status}`);
      } catch (webhookErr) {
        console.error(`[Central Commander] Webhook dispatch failed: ${webhookErr.message}`);
      }
      
      // Admin Panel Review Notification (Console log representation & update event status)
      console.log(`[ADMIN NOTIFICATION] Review required for device [${event.uid}]. Threat score is ${score}%. Photos uploaded: ${event.capturedImages.join(', ')}`);
      
      event.status = 'alerted';
      if (global.dbConnected && typeof event.save === 'function') {
        await event.save();
      }
    } else {
      console.log(`[Central Commander] Threat score (${score}%) is outside the 80-95% command trigger range. Normal logging active.`);
    }
  } catch (error) {
    console.error(`[Central Commander] Error in threat evaluation:`, error);
  }
};

module.exports = { evaluateThreat };
