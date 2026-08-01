const axios = require('axios');
const Device = require('../models/Device');

const sendVoiceCallBroadcast = async (device, customMessage = '') => {
  if (!device || !device.phoneNumbers || device.phoneNumbers.length === 0) {
    console.log(`[Central Commander] No configured phone numbers found for device [${device ? device.deviceName : 'Unknown'}]. Skipping voice call.`);
    return false;
  }
  
  const broadcastPayload = {
    user_id: device.userId || 'system',
    mac: device.uid,
    phone: device.deviceName || 'ESP32 Camera Node',
    phone_call_list: device.phoneNumbers,
    payload: {
      address: device.zoneCode || 'ZONE_01',
      message: customMessage || `[ Security alert: Signal detected on ${device.deviceName} ]`,
      audio: '0001'
    },
    response: []
  };

  const MAIN_HOST = 'https://800lcall.espserver.site';
  const BACKUP_HOST = 'https://sim800l.maxapi.esp32.site';
  
  let success = false;
  
  // Attempt Main Host
  try {
    console.log(`[Central Commander] Dispatching voice call broadcast to Main Host for ${device.deviceName} (${device.phoneNumbers.join(', ')})...`);
    const res = await axios.post(`${MAIN_HOST}/api/broadcast`, broadcastPayload, { timeout: 8000 });
    console.log(`[Central Commander] Voice broadcast success (Main Host)! Status: ${res.status}`);
    success = true;
  } catch (err) {
    console.warn(`[Central Commander] Main Host voice broadcast failed: ${err.message}. Retrying via Backup Host...`);
  }
  
  // Attempt Backup Host if Main failed
  if (!success) {
    try {
      console.log(`[Central Commander] Dispatching voice call broadcast to Backup Host for ${device.deviceName}...`);
      const res = await axios.post(`${BACKUP_HOST}/api/broadcast`, broadcastPayload, { timeout: 8000 });
      console.log(`[Central Commander] Voice broadcast success (Backup Host)! Status: ${res.status}`);
      success = true;
    } catch (err) {
      console.error(`[Central Commander] Backup Host voice broadcast failed: ${err.message}`);
    }
  }
  return success;
};

/**
 * Central_Commandar: Evaluates the analyzed event.
 * If score is 80-95%, calls a third-party API webhook and sends admin notifications.
 * If score is > 90%, initiates an automated voice call broadcast to device-configured numbers.
 */
const evaluateThreat = async (event) => {
  try {
    const score = event.threatScore;
    console.log(`[Central Commander] Evaluating threat score: ${score}%`);
    
    // 1. Existing webhook trigger for 80-95% range
    if (score >= 80 && score <= 95) {
      console.log(`[Central Commander] ALERT! Threat score (${score}%) is within critical threshold (80-95%). Triggering Central Commander actions...`);
      
      const webhookUrl = process.env.COMMANDER_WEBHOOK_URL || 'https://httpbin.org/post';
      
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
      
      console.log(`[ADMIN NOTIFICATION] Review required for device [${event.uid}]. Threat score is ${score}%. Photos uploaded: ${event.capturedImages.join(', ')}`);
      
      event.status = 'alerted';
      if (global.dbConnected && typeof event.save === 'function') {
        await event.save();
      }
    }

    // 2. Automated Voice Call Broadcast for score > 90%
    if (score > 90) {
      const fs = require('fs');
      const path = require('path');
      let globalCallAlertsEnabled = true;
      try {
        const settingsFile = path.join(__dirname, '../config/settings.json');
        if (fs.existsSync(settingsFile)) {
          const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
          if (settings.globalCallAlertsEnabled !== undefined) {
            globalCallAlertsEnabled = settings.globalCallAlertsEnabled;
          }
        }
      } catch (settingsErr) {
        console.warn(`[Central Commander] Failed to read global call settings:`, settingsErr.message);
      }

      if (!globalCallAlertsEnabled) {
        console.log(`[Central Commander] Global Voice Call alerts are DISABLED. Skipping voice call broadcast.`);
        return;
      }

      console.log(`[Central Commander] ALERT! Threat score (${score}%) exceeds 90%. Initiating automated voice call broadcast...`);
      
      let device;
      if (global.dbConnected) {
        device = await Device.findOne({ uid: event.uid.toUpperCase() });
      } else {
        const { memDevices } = require('../config/state');
        device = memDevices.find(d => d.uid === event.uid.toUpperCase());
      }
      
      if (device) {
        if (device.callAlertsEnabled === false) {
          console.log(`[Central Commander] Voice Call alerts are DISABLED for this device [${device.deviceName}]. Skipping broadcast.`);
          return;
        }

        const callSuccess = await sendVoiceCallBroadcast(device, `[ from AI Threat Analysis: ${event.aiReport || 'Theft alarm'} ]`);
        if (callSuccess) {
          event.status = 'alerted';
          if (global.dbConnected && typeof event.save === 'function') {
            await event.save();
          }
        }
      }
    }
  } catch (error) {
    console.error(`[Central Commander] Error in threat evaluation:`, error);
  }
};

module.exports = { evaluateThreat, sendVoiceCallBroadcast };
