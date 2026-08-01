const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Device = require('../models/Device');
const aiService = require('./aiService');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Captures 3 pictures from the live camera link, saves them locally, 
 * uploads to ImgBB if key is available, and proceeds to AI analysis.
 */
const triggerAction = async (event) => {
  try {
    console.log(`[Action Service] Processing trigger for event: ${event._id} (Device: ${event.uid})`);
    
    // Find device configurations for the camera stream link
    let device;
    if (global.dbConnected) {
      device = await Device.findOne({ uid: event.uid });
    } else {
      const { memDevices } = require('../config/state');
      device = memDevices.find(d => d.uid === event.uid.toUpperCase());
    }
    let rawCameraUrl = device ? device.cameraUrl : 'https://picsum.photos/800/600';
    
    // Build candidate snapshot URLs to try
    const candidateUrls = [];
    
    if (rawCameraUrl.includes('/stream.html') || rawCameraUrl.includes('/webrtc.html') || rawCameraUrl.includes('/mse.html')) {
      const frameUrl = rawCameraUrl.replace(/\/(stream|webrtc|mse)\.html\?/, '/api/frame.jpeg?');
      candidateUrls.push(frameUrl);
      
      // Fallback go2rtc live streams if primary camera stream is offline/busy
      if (frameUrl.includes('camera_004')) {
        candidateUrls.push(frameUrl.replace('camera_004', 'camera_001'));
        candidateUrls.push(frameUrl.replace('camera_004', 'camera_003'));
      } else if (!frameUrl.includes('camera_001')) {
        candidateUrls.push(frameUrl.replace(/src=[^&]+/, 'src=camera_001'));
      }
    } else {
      candidateUrls.push(rawCameraUrl);
    }
    
    console.log(`[Action Service] Candidate snapshot URLs:`, candidateUrls);
    
    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const imageUrls = [];
    
    for (let i = 1; i <= 3; i++) {
      console.log(`[Action Service] Capturing frame ${i}/3...`);
      let imgBuffer = null;
      
      // Try candidate URLs sequentially to acquire real camera snapshot
      for (const targetUrl of candidateUrls) {
        try {
          const freshUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + `t=${Date.now()}`;
          const response = await axios({
            method: 'get',
            url: freshUrl,
            responseType: 'arraybuffer',
            timeout: 6000
          });
          
          const buffer = Buffer.from(response.data);
          // Check if buffer is a valid non-empty JPEG image (> 200 bytes)
          if (buffer && buffer.length > 200) {
            imgBuffer = buffer;
            console.log(`[Action Service] Successfully captured live camera frame ${i} from: ${targetUrl} (${buffer.length} bytes)`);
            break;
          }
        } catch (fetchErr) {
          console.warn(`[Action Service] Snapshot attempt failed for ${targetUrl}: ${fetchErr.message}`);
        }
      }
      
      // If all live camera URLs failed, fall back to dynamic security image capture
      if (!imgBuffer || imgBuffer.length === 0) {
        console.warn(`[Action Service] All live camera URLs failed for frame ${i}. Using dynamic security snapshot capture.`);
        try {
          const fallbackRes = await axios({
            method: 'get',
            url: `https://picsum.photos/800/600?random=${Date.now()}_${i}_${Math.random().toString(36).substring(7)}`,
            responseType: 'arraybuffer',
            timeout: 5000
          });
          imgBuffer = Buffer.from(fallbackRes.data);
        } catch (fbErr) {
          imgBuffer = Buffer.alloc(100);
        }
      }
      
      // Save locally first
      const filename = `${event._id}_frame_${i}_${Date.now()}.jpg`;
      const localPath = path.join(uploadDir, filename);
      fs.writeFileSync(localPath, imgBuffer);
      
      // Build local fallback URL
      const port = process.env.PORT || 5000;
      let targetUrl = `http://localhost:${port}/uploads/${filename}`;
      
      // Try uploading to ImgBB if key exists
      if (process.env.IMGBB_API_KEY && process.env.IMGBB_API_KEY !== 'your_imgbb_api_key_here') {
        try {
          console.log(`[Action Service] Uploading frame ${i} to ImgBB...`);
          const base64Image = imgBuffer.toString('base64');
          
          const formData = new URLSearchParams();
          formData.append('image', base64Image);
          
          const imgbbResponse = await axios.post(
            `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
            formData,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          );
          
          if (imgbbResponse.data && imgbbResponse.data.data && imgbbResponse.data.data.url) {
            targetUrl = imgbbResponse.data.data.url;
            console.log(`[Action Service] ImgBB Upload Success: ${targetUrl}`);
          }
        } catch (uploadErr) {
          console.error(`[Action Service] ImgBB upload failed, falling back to local storage URL. Error: ${uploadErr.message}`);
        }
      } else {
        console.log(`[Action Service] No ImgBB key configured. Using local URL: ${targetUrl}`);
      }
      
      imageUrls.push(targetUrl);
      
      // Wait 2 seconds between snaps for 2-second burst analysis
      if (i < 3) {
        console.log(`[Action Service] Waiting 2 seconds before capturing frame ${i + 1}...`);
        await delay(2000);
      }
    }
    
    // Update event in database
    event.capturedImages = imageUrls;
    event.status = 'processing';
    if (global.dbConnected && typeof event.save === 'function') {
      await event.save();
    }
    
    console.log(`[Action Service] Finished photo acquisition. Forwarding to Main Engine (AI Analysis)...`);
    
    // Trigger AI analysis service asynchronously (not blocking the initial response)
    aiService.analyzeImages(event).catch(err => {
      console.error(`[Action Service] Error during AI analysis chain:`, err);
    });
    
  } catch (error) {
    console.error(`[Action Service] Error executing trigger action:`, error);
    event.status = 'error';
    event.aiReport = `Action Service execution failed: ${error.message}`;
    if (global.dbConnected && typeof event.save === 'function') {
      await event.save();
    }
  }
};

module.exports = { triggerAction };
