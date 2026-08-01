const express = require('express');
const router = express.Router();
const axios = require('axios');
const Device = require('../models/Device');
const Event = require('../models/Event');
const User = require('../models/User');
const { triggerAction } = require('../services/actionService');
const { memDevices, memEvents, memUsers } = require('../config/state');

// @route   POST /api/trigger
// @desc    Receive ESP32 physical trigger signals
router.post('/trigger', async (req, res) => {
  try {
    const { time, uid, action, message, zone_code } = req.body;
    
    if (!uid || !action) {
      return res.status(400).json({ success: false, error: 'Missing required parameters: uid and action are required.' });
    }
    
    const uppercaseUid = uid.toUpperCase();
    console.log(`[API] Received trigger from ESP32 (MAC: ${uppercaseUid})`);
    
    // Lookup registered device configuration
    let resolvedZoneCode = zone_code || 'ZONE_01';
    let deviceName = 'ESP32 Security Node';
    
    if (global.dbConnected) {
      const device = await Device.findOne({ uid: uppercaseUid });
      if (device) {
        resolvedZoneCode = device.zoneCode || resolvedZoneCode;
        deviceName = device.deviceName || deviceName;
      }
    } else {
      const device = memDevices.find(d => d.uid === uppercaseUid);
      if (device) {
        resolvedZoneCode = device.zoneCode || resolvedZoneCode;
        deviceName = device.deviceName || deviceName;
      }
    }
    
    const customMessage = message || `Security alert: Pin D4 is LOW on ${deviceName}!`;
    
    let event;
    if (global.dbConnected) {
      event = new Event({
        uid: uppercaseUid,
        time: time || new Date().toISOString(),
        action,
        message: customMessage,
        zoneCode: resolvedZoneCode,
        status: 'pending'
      });
      await event.save();
    } else {
      // In-Memory Mode
      event = {
        _id: 'mock-event-' + Math.random().toString(36).substr(2, 9),
        uid: uppercaseUid,
        time: time || new Date().toISOString(),
        action,
        message: customMessage + ' (Simulated)',
        zoneCode: resolvedZoneCode,
        capturedImages: [],
        threatScore: 0,
        aiReport: 'Analysis pending',
        status: 'pending',
        createdAt: new Date()
      };
      memEvents.unshift(event);
    }
    
    // Start action service (fetching images & running AI) asynchronously
    triggerAction(event);
    
    return res.status(201).json({
      success: true,
      message: 'Trigger received. Photo capture and AI analysis started in background.',
      eventId: event._id
    });
    
  } catch (error) {
    console.error('[API] Error in /trigger endpoint:', error);
    return res.status(500).json({ success: false, error: 'Server error registering trigger.' });
  }
});

// @route   POST /api/devices
// @desc    Register or update a device
router.post('/devices', async (req, res) => {
  try {
    const { uid, deviceName, cameraUrl, snapshotUrl, zoneCode, userId, phoneNumbers, institution, location, latitude, longitude, callAlertsEnabled, instantCallOnTrigger } = req.body;
    
    if (!uid || !userId) {
      return res.status(400).json({ success: false, error: 'uid and userId are required.' });
    }
    
    const uppercaseUid = uid.toUpperCase();
    
    if (global.dbConnected) {
      let device = await Device.findOne({ uid: uppercaseUid });
      
      if (device) {
        device.deviceName = deviceName || device.deviceName;
        device.cameraUrl = cameraUrl || device.cameraUrl;
        if (snapshotUrl) device.snapshotUrl = snapshotUrl;
        device.zoneCode = zoneCode || device.zoneCode;
        device.userId = userId;
        if (phoneNumbers !== undefined) device.phoneNumbers = phoneNumbers;
        if (institution !== undefined) device.institution = institution;
        if (location !== undefined) device.location = location;
        if (latitude !== undefined) device.latitude = latitude;
        if (longitude !== undefined) device.longitude = longitude;
        if (callAlertsEnabled !== undefined) device.callAlertsEnabled = callAlertsEnabled;
        if (instantCallOnTrigger !== undefined) device.instantCallOnTrigger = instantCallOnTrigger;
        await device.save();
        console.log(`[API] Updated device in DB: ${uppercaseUid}`);
        return res.json({ success: true, message: 'Device updated successfully.', device });
      } else {
        device = new Device({
          uid: uppercaseUid,
          deviceName: deviceName || 'ESP32 Security Node',
          cameraUrl: cameraUrl || 'http://161.248.205.218:1984/stream.html?src=camera_004',
          snapshotUrl: snapshotUrl || 'http://161.248.205.218:1984/api/frame.jpeg?src=camera_004',
          zoneCode: zoneCode || 'ZONE_01',
          userId,
          phoneNumbers: phoneNumbers || [],
          institution: institution || '',
          location: location || '',
          latitude: latitude || '',
          longitude: longitude || '',
          callAlertsEnabled: callAlertsEnabled !== undefined ? callAlertsEnabled : true,
          instantCallOnTrigger: instantCallOnTrigger !== undefined ? instantCallOnTrigger : true
        });
        await device.save();
        console.log(`[API] Registered new device in DB: ${uppercaseUid}`);
        return res.status(201).json({ success: true, message: 'Device registered successfully.', device });
      }
    } else {
      // In-Memory Mode
      let device = memDevices.find(d => d.uid === uppercaseUid);
      if (device) {
        device.deviceName = deviceName || device.deviceName;
        device.cameraUrl = cameraUrl || device.cameraUrl;
        if (snapshotUrl) device.snapshotUrl = snapshotUrl;
        device.zoneCode = zoneCode || device.zoneCode;
        device.userId = userId;
        if (phoneNumbers !== undefined) device.phoneNumbers = phoneNumbers;
        if (institution !== undefined) device.institution = institution;
        if (location !== undefined) device.location = location;
        if (latitude !== undefined) device.latitude = latitude;
        if (longitude !== undefined) device.longitude = longitude;
        if (callAlertsEnabled !== undefined) device.callAlertsEnabled = callAlertsEnabled;
        if (instantCallOnTrigger !== undefined) device.instantCallOnTrigger = instantCallOnTrigger;
        console.log(`[API] Updated simulated device: ${uppercaseUid}`);
        return res.json({ success: true, message: 'Device updated successfully (Simulated).', device });
      } else {
        device = {
          _id: 'mock-dev-' + Math.random().toString(36).substr(2, 9),
          uid: uppercaseUid,
          deviceName: deviceName || 'ESP32 Security Node',
          cameraUrl: cameraUrl || 'http://161.248.205.218:1984/stream.html?src=camera_004',
          snapshotUrl: snapshotUrl || 'http://161.248.205.218:1984/api/frame.jpeg?src=camera_004',
          zoneCode: zoneCode || 'ZONE_01',
          userId,
          phoneNumbers: phoneNumbers || [],
          institution: institution || '',
          location: location || '',
          latitude: latitude || '',
          longitude: longitude || '',
          callAlertsEnabled: callAlertsEnabled !== undefined ? callAlertsEnabled : true,
          instantCallOnTrigger: instantCallOnTrigger !== undefined ? instantCallOnTrigger : true,
          createdAt: new Date()
        };
        memDevices.push(device);
        console.log(`[API] Registered simulated device: ${uppercaseUid}`);
        return res.status(201).json({ success: true, message: 'Device registered successfully (Simulated).', device });
      }
    }
  } catch (error) {
    console.error('[API] Error registering device:', error);
    return res.status(500).json({ success: false, error: 'Server error registering device.' });
  }
});

// @route   GET /api/devices/:userId
// @desc    Get all devices paired with a specific user or shared with them
router.get('/devices/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    if (global.dbConnected) {
      const user = await User.findOne({ uid: userId });
      const role = user ? user.role : 'operator';
      const accessibleUids = user ? user.accessibleDevices : [];

      let query = {};
      if (role !== 'admin') {
        query = {
          $or: [
            { userId: userId },
            { uid: { $in: accessibleUids } }
          ]
        };
      }
      
      const devices = await Device.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, devices });
    } else {
      const user = memUsers.find(u => u.uid === userId);
      const role = user ? user.role : 'operator';
      const accessibleUids = user ? user.accessibleDevices : [];

      let devices;
      if (role === 'admin') {
        devices = [...memDevices];
      } else {
        devices = memDevices.filter(d => d.userId === userId || accessibleUids.includes(d.uid));
      }
      // Clone and sort
      const sortedDevices = [...devices].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return res.json({ success: true, devices: sortedDevices });
    }
  } catch (error) {
    console.error('[API] Error fetching devices:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching devices.' });
  }
});

// @route   GET /api/events/:userId
// @desc    Get all security events for devices owned by or shared with a user
router.get('/events/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    if (global.dbConnected) {
      const user = await User.findOne({ uid: userId });
      const role = user ? user.role : 'operator';
      const accessibleUids = user ? user.accessibleDevices : [];

      let events;
      if (role === 'admin') {
        events = await Event.find({}).sort({ createdAt: -1 });
      } else {
        const devices = await Device.find({
          $or: [
            { userId: userId },
            { uid: { $in: accessibleUids } }
          ]
        });
        const uids = devices.map(d => d.uid);
        events = await Event.find({ uid: { $in: uids } }).sort({ createdAt: -1 });
      }
      return res.json({ success: true, events });
    } else {
      const user = memUsers.find(u => u.uid === userId);
      const role = user ? user.role : 'operator';
      const accessibleUids = user ? user.accessibleDevices : [];

      let uids;
      if (role === 'admin') {
        uids = memDevices.map(d => d.uid);
      } else {
        const devices = memDevices.filter(d => d.userId === userId || accessibleUids.includes(d.uid));
        uids = devices.map(d => d.uid);
      }
      
      const events = memEvents
        .filter(e => uids.includes(e.uid))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return res.json({ success: true, events });
    }
  } catch (error) {
    console.error('[API] Error fetching events:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching events.' });
  }
});

// @route   GET /api/events/device/:uid
// @desc    Get events for a specific device MAC
router.get('/events/device/:uid', async (req, res) => {
  try {
    const searchUid = req.params.uid.toUpperCase();
    if (global.dbConnected) {
      const events = await Event.find({ uid: searchUid }).sort({ createdAt: -1 });
      return res.json({ success: true, events });
    } else {
      const events = memEvents
        .filter(e => e.uid === searchUid)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return res.json({ success: true, events });
    }
  } catch (error) {
    console.error('[API] Error fetching device events:', error);
    return res.status(500).json({ success: false, error: 'Server error fetching events.' });
  }
});

// @route   PUT /api/devices/:id
// @desc    Update a device by ID
router.put('/devices/:id', async (req, res) => {
  try {
    const { uid, deviceName, cameraUrl, snapshotUrl, zoneCode, phoneNumbers, institution, location, latitude, longitude, callAlertsEnabled, instantCallOnTrigger } = req.body;
    const deviceId = req.params.id;
    
    if (global.dbConnected) {
      const device = await Device.findById(deviceId);
      if (!device) {
        return res.status(404).json({ success: false, error: 'Device not found.' });
      }
      
      if (uid) device.uid = uid.toUpperCase();
      if (deviceName) device.deviceName = deviceName;
      if (cameraUrl) device.cameraUrl = cameraUrl;
      if (snapshotUrl) device.snapshotUrl = snapshotUrl;
      if (zoneCode) device.zoneCode = zoneCode;
      if (phoneNumbers !== undefined) device.phoneNumbers = phoneNumbers;
      if (institution !== undefined) device.institution = institution;
      if (location !== undefined) device.location = location;
      if (latitude !== undefined) device.latitude = latitude;
      if (longitude !== undefined) device.longitude = longitude;
      if (callAlertsEnabled !== undefined) device.callAlertsEnabled = callAlertsEnabled;
      if (instantCallOnTrigger !== undefined) device.instantCallOnTrigger = instantCallOnTrigger;
      
      await device.save();
      console.log(`[API] Updated device in DB by ID: ${deviceId}`);
      return res.json({ success: true, message: 'Device updated successfully.', device });
    } else {
      // In-Memory Mode
      const device = memDevices.find(d => d._id === deviceId);
      if (!device) {
        return res.status(404).json({ success: false, error: 'Device not found.' });
      }
      
      if (uid) device.uid = uid.toUpperCase();
      if (deviceName) device.deviceName = deviceName;
      if (cameraUrl) device.cameraUrl = cameraUrl;
      if (snapshotUrl) device.snapshotUrl = snapshotUrl;
      if (zoneCode) device.zoneCode = zoneCode;
      if (phoneNumbers !== undefined) device.phoneNumbers = phoneNumbers;
      if (institution !== undefined) device.institution = institution;
      if (location !== undefined) device.location = location;
      if (latitude !== undefined) device.latitude = latitude;
      if (longitude !== undefined) device.longitude = longitude;
      if (callAlertsEnabled !== undefined) device.callAlertsEnabled = callAlertsEnabled;
      if (instantCallOnTrigger !== undefined) device.instantCallOnTrigger = instantCallOnTrigger;
      
      console.log(`[API] Updated simulated device by ID: ${deviceId}`);
      return res.json({ success: true, message: 'Device updated successfully (Simulated).', device });
    }
  } catch (error) {
    console.error('[API] Error updating device:', error);
    return res.status(500).json({ success: false, error: 'Server error updating device.' });
  }
});

// @route   DELETE /api/devices/:id
// @desc    Delete a device by ID
router.delete('/devices/:id', async (req, res) => {
  try {
    const deviceId = req.params.id;
    if (global.dbConnected) {
      const result = await Device.findByIdAndDelete(deviceId);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Device not found.' });
      }
      console.log(`[API] Deleted device from DB: ${deviceId}`);
      return res.json({ success: true, message: 'Device deleted successfully.' });
    } else {
      // In-Memory Mode
      const index = memDevices.findIndex(d => d._id === deviceId);
      if (index === -1) {
        return res.status(404).json({ success: false, error: 'Device not found.' });
      }
      memDevices.splice(index, 1);
      console.log(`[API] Deleted simulated device: ${deviceId}`);
      return res.json({ success: true, message: 'Device deleted successfully (Simulated).' });
    }
  } catch (error) {
    console.error('[API] Error deleting device:', error);
    return res.status(500).json({ success: false, error: 'Server error deleting device.' });
  }
});

// @route   POST /api/users
// @desc    Register or sync user profile. Sets first user to admin.
router.post('/users', async (req, res) => {
  try {
    const { uid, email, displayName } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ success: false, error: 'uid and email are required.' });
    }

    if (global.dbConnected) {
      let user = await User.findOne({ uid });
      if (user) {
        user.displayName = displayName || user.displayName;
        user.email = email;
        await user.save();
        return res.json({ success: true, message: 'User profile synced.', user });
      } else {
        const userCount = await User.countDocuments();
        const role = userCount === 0 ? 'admin' : 'operator';
        
        user = new User({
          uid,
          email,
          displayName: displayName || email.split('@')[0],
          role,
          accessibleDevices: []
        });
        await user.save();
        console.log(`[API] Registered new user: ${email} with role: ${role}`);
        return res.status(201).json({ success: true, message: 'User profile registered.', user });
      }
    } else {
      // In-Memory Mode
      let user = memUsers.find(u => u.uid === uid);
      if (user) {
        user.displayName = displayName || user.displayName;
        user.email = email;
        return res.json({ success: true, message: 'User profile synced (Simulated).', user });
      } else {
        const role = memUsers.length === 0 ? 'admin' : 'operator';
        user = {
          _id: 'mock-user-' + Math.random().toString(36).substr(2, 9),
          uid,
          email,
          displayName: displayName || email.split('@')[0],
          role,
          accessibleDevices: []
        };
        memUsers.push(user);
        console.log(`[API] Registered simulated user: ${email} with role: ${role}`);
        return res.status(201).json({ success: true, message: 'User profile registered (Simulated).', user });
      }
    }
  } catch (error) {
    console.error('[API] Error syncing user:', error);
    return res.status(500).json({ success: false, error: 'Server error syncing user.' });
  }
});

// @route   GET /api/users
// @desc    List all users (Admin only)
router.get('/users', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId query parameter is required for authorization.' });
    }

    let isAuthorized = false;
    if (global.dbConnected) {
      const requester = await User.findOne({ uid: userId });
      isAuthorized = requester && requester.role === 'admin';
    } else {
      const requester = memUsers.find(u => u.uid === userId);
      isAuthorized = requester && requester.role === 'admin';
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Forbidden. Admin access required.' });
    }

    if (global.dbConnected) {
      const users = await User.find({}).sort({ createdAt: -1 });
      return res.json({ success: true, users });
    } else {
      return res.json({ success: true, users: memUsers });
    }
  } catch (error) {
    console.error('[API] Error listing users:', error);
    return res.status(500).json({ success: false, error: 'Server error listing users.' });
  }
});

// @route   PUT /api/users/:uid/role
// @desc    Update a user's role (Admin only)
router.put('/users/:uid/role', async (req, res) => {
  try {
    const { userId, role } = req.body;
    const targetUid = req.params.uid;

    if (!userId || !role) {
      return res.status(400).json({ success: false, error: 'userId and role are required.' });
    }

    if (!['admin', 'manager', 'operator'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role.' });
    }

    let isAuthorized = false;
    if (global.dbConnected) {
      const requester = await User.findOne({ uid: userId });
      isAuthorized = requester && requester.role === 'admin';
    } else {
      const requester = memUsers.find(u => u.uid === userId);
      isAuthorized = requester && requester.role === 'admin';
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Forbidden. Admin access required.' });
    }

    if (global.dbConnected) {
      const user = await User.findOne({ uid: targetUid });
      if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
      user.role = role;
      await user.save();
      return res.json({ success: true, message: 'User role updated successfully.', user });
    } else {
      const user = memUsers.find(u => u.uid === targetUid);
      if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
      user.role = role;
      return res.json({ success: true, message: 'User role updated successfully (Simulated).', user });
    }
  } catch (error) {
    console.error('[API] Error updating user role:', error);
    return res.status(500).json({ success: false, error: 'Server error updating role.' });
  }
});

// @route   PUT /api/users/:uid/devices
// @desc    Update a user's accessible devices list (Admin only)
router.put('/users/:uid/devices', async (req, res) => {
  try {
    const { userId, accessibleDevices } = req.body;
    const targetUid = req.params.uid;

    if (!userId || !Array.isArray(accessibleDevices)) {
      return res.status(400).json({ success: false, error: 'userId and accessibleDevices (array) are required.' });
    }

    let isAuthorized = false;
    if (global.dbConnected) {
      const requester = await User.findOne({ uid: userId });
      isAuthorized = requester && requester.role === 'admin';
    } else {
      const requester = memUsers.find(u => u.uid === userId);
      isAuthorized = requester && requester.role === 'admin';
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Forbidden. Admin access required.' });
    }

    if (global.dbConnected) {
      const user = await User.findOne({ uid: targetUid });
      if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

      // Enforce 5-user limit per device
      for (const devUid of accessibleDevices) {
        if (user.accessibleDevices.includes(devUid)) continue;
        const count = await User.countDocuments({ accessibleDevices: devUid });
        if (count >= 5) {
          const device = await Device.findOne({ uid: devUid });
          return res.status(400).json({ 
            success: false, 
            error: `Device "${device ? device.deviceName : devUid}" is already shared with the maximum limit of 5 users.` 
          });
        }
      }

      user.accessibleDevices = accessibleDevices;
      await user.save();
      return res.json({ success: true, message: 'User device access updated successfully.', user });
    } else {
      const user = memUsers.find(u => u.uid === targetUid);
      if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
      if (!user.accessibleDevices) user.accessibleDevices = [];

      // Enforce 5-user limit per device
      for (const devUid of accessibleDevices) {
        if (user.accessibleDevices.includes(devUid)) continue;
        const count = memUsers.filter(u => u.accessibleDevices && u.accessibleDevices.includes(devUid)).length;
        if (count >= 5) {
          const device = memDevices.find(d => d.uid === devUid);
          return res.status(400).json({ 
            success: false, 
            error: `Device "${device ? device.deviceName : devUid}" is already shared with the maximum limit of 5 users.` 
          });
        }
      }

      user.accessibleDevices = accessibleDevices;
      return res.json({ success: true, message: 'User device access updated successfully (Simulated).', user });
    }
  } catch (error) {
    console.error('[API] Error updating user device access:', error);
    return res.status(500).json({ success: false, error: 'Server error updating device access.' });
  }
});

// @route   DELETE /api/users/:uid
// @desc    Delete a user profile (Admin only)
router.delete('/users/:uid', async (req, res) => {
  try {
    const { userId } = req.query;
    const targetUid = req.params.uid;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId query parameter is required for authorization.' });
    }
    
    if (userId === targetUid) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own admin account.' });
    }
    
    let isAuthorized = false;
    if (global.dbConnected) {
      const requester = await User.findOne({ uid: userId });
      isAuthorized = requester && requester.role === 'admin';
    } else {
      const requester = memUsers.find(u => u.uid === userId);
      isAuthorized = requester && requester.role === 'admin';
    }
    
    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Forbidden. Admin access required.' });
    }
    
    if (global.dbConnected) {
      const user = await User.findOneAndDelete({ uid: targetUid });
      if (!user) return res.status(404).json({ success: false, error: 'User not found.' });
      return res.json({ success: true, message: 'User profile deleted successfully.' });
    } else {
      const idx = memUsers.findIndex(u => u.uid === targetUid);
      if (idx === -1) return res.status(404).json({ success: false, error: 'User not found.' });
      memUsers.splice(idx, 1);
      return res.json({ success: true, message: 'User profile deleted successfully (Simulated).' });
    }
  } catch (error) {
    console.error('[API] Error deleting user:', error);
    return res.status(500).json({ success: false, error: 'Server error deleting user.' });
  }
});

// @route   POST /api/devices/share
// @desc    Share a device access with a user via email (Admin only)
router.post('/devices/share', async (req, res) => {
  try {
    const { userId, email, deviceUid } = req.body;
    
    if (!userId || !email || !deviceUid) {
      return res.status(400).json({ success: false, error: 'userId, email, and deviceUid are required.' });
    }
    
    let isAuthorized = false;
    if (global.dbConnected) {
      const requester = await User.findOne({ uid: userId });
      isAuthorized = requester && requester.role === 'admin';
    } else {
      const requester = memUsers.find(u => u.uid === userId);
      isAuthorized = requester && requester.role === 'admin';
    }
    
    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Forbidden. Admin access required.' });
    }
    
    const uppercaseDeviceUid = deviceUid.toUpperCase();
    
    if (global.dbConnected) {
      const targetUser = await User.findOne({ email: email.toLowerCase() });
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'User with this email not found.' });
      }
      
      if (targetUser.accessibleDevices.includes(uppercaseDeviceUid)) {
        return res.status(400).json({ success: false, error: 'User already has access to this device.' });
      }
      
      // Enforce limit of 5 users per device
      const count = await User.countDocuments({ accessibleDevices: uppercaseDeviceUid });
      if (count >= 5) {
        return res.status(400).json({ success: false, error: 'This device is already shared with the maximum limit of 5 users.' });
      }
      
      targetUser.accessibleDevices.push(uppercaseDeviceUid);
      await targetUser.save();
      return res.json({ success: true, message: 'Device access shared successfully.', user: targetUser });
    } else {
      const targetUser = memUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'User with this email not found.' });
      }
      
      if (!targetUser.accessibleDevices) targetUser.accessibleDevices = [];
      
      if (targetUser.accessibleDevices.includes(uppercaseDeviceUid)) {
        return res.status(400).json({ success: false, error: 'User already has access to this device.' });
      }
      
      const count = memUsers.filter(u => u.accessibleDevices && u.accessibleDevices.includes(uppercaseDeviceUid)).length;
      if (count >= 5) {
        return res.status(400).json({ success: false, error: 'This device is already shared with the maximum limit of 5 users.' });
      }
      
      targetUser.accessibleDevices.push(uppercaseDeviceUid);
      return res.json({ success: true, message: 'Device access shared successfully (Simulated).', user: targetUser });
    }
  } catch (error) {
    console.error('[API] Error sharing device:', error);
    return res.status(500).json({ success: false, error: 'Server error sharing device.' });
  }
});

// @route   GET /api/snapshot
// @desc    Download live camera snapshot for a device (proxying through backend)
router.get('/snapshot', async (req, res) => {
  try {
    const { uid } = req.query;
    if (!uid) {
      return res.status(400).json({ success: false, error: 'Device UID is required' });
    }
    
    let device;
    if (global.dbConnected) {
      device = await Device.findOne({ uid });
    } else {
      const { memDevices } = require('../config/state');
      device = memDevices.find(d => d.uid === uid.toUpperCase());
    }
    
    const candidateUrls = [];
    if (device && device.snapshotUrl) {
      candidateUrls.push(device.snapshotUrl);
    }
    
    let rawCameraUrl = (device && device.cameraUrl && !device.cameraUrl.includes('picsum.photos'))
      ? device.cameraUrl
      : 'http://161.248.205.218:1984/stream.html?src=camera_004';
    
    if (rawCameraUrl.includes('/stream.html') || rawCameraUrl.includes('/webrtc.html') || rawCameraUrl.includes('/mse.html')) {
      const frameUrl = rawCameraUrl.replace(/\/(stream|webrtc|mse)\.html\?/, '/api/frame.jpeg?');
      if (!candidateUrls.includes(frameUrl)) candidateUrls.push(frameUrl);
    } else if (!candidateUrls.includes(rawCameraUrl)) {
      candidateUrls.push(rawCameraUrl);
    }
    candidateUrls.push('http://161.248.205.218:1984/api/frame.jpeg?src=camera_004');
    
    let imgBuffer = null;
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
        if (buffer && buffer.length > 200) {
          imgBuffer = buffer;
          break;
        }
      } catch (err) {
        console.warn(`[Snapshot Proxy] Candidate ${targetUrl} failed: ${err.message}`);
      }
    }
    
    if (!imgBuffer || imgBuffer.length === 0) {
      console.warn(`[Snapshot Proxy] Camera feed URL failed for ${uid}. Returning authentic CCTV snapshot SVG.`);
      const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const svgString = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="800" height="600" fill="#090d16"/>
        <path d="M 0 150 L 800 150 M 0 300 L 800 300 M 0 450 L 800 450 M 200 0 L 200 600 M 400 0 L 400 600 M 600 0 L 600 600" stroke="#1e293b" stroke-width="1" stroke-dasharray="6 6"/>
        <path d="M 40 80 L 40 40 L 80 40 M 760 80 L 760 40 L 720 40 M 40 520 L 40 560 L 80 560 M 760 520 L 760 560 L 720 560" stroke="#38bdf8" stroke-width="3" fill="none"/>
        <circle cx="65" cy="60" r="8" fill="#ef4444"/>
        <text x="82" y="66" fill="#f87171" font-family="monospace" font-size="16" font-weight="bold">REC ● LIVE SNAPSHOT</text>
        <rect x="260" y="180" width="280" height="220" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 6"/>
        <text x="315" y="210" fill="#38bdf8" font-family="monospace" font-size="14" font-weight="bold">CAMERA FEED</text>
        <rect x="40" y="490" width="720" height="65" rx="8" fill="#020617" opacity="0.9" stroke="#1e293b"/>
        <text x="60" y="518" fill="#38bdf8" font-family="monospace" font-size="16" font-weight="bold">DEVICE: ${uid}</text>
        <text x="60" y="542" fill="#94a3b8" font-family="monospace" font-size="13">TIME: ${timeStr} UTC | CAMERA NODE</text>
      </svg>`;
      const devName = device ? device.deviceName : 'snapshot';
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${devName.replace(/\s+/g, '_')}_${Date.now()}.svg"`);
      return res.send(Buffer.from(svgString));
    }
    
    const devName = device ? device.deviceName : 'snapshot';
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `attachment; filename="${devName.replace(/\s+/g, '_')}_${Date.now()}.jpg"`);
    return res.send(imgBuffer);
    
  } catch (error) {
    console.error('[API] Error in snapshot proxy:', error);
    return res.status(500).json({ success: false, error: 'Server error generating snapshot.' });
  }
});

// @route   GET /api/record-fallback
// @desc    Download a simulated MP4 recording of the camera feed
router.get('/record-fallback', async (req, res) => {
  try {
    const { uid, duration } = req.query;
    console.log(`[API] fallback video record request received for device: ${uid} (duration: ${duration}s)`);
    
    // Redirect to a sample public MP4 file to trigger browser download
    return res.redirect('https://www.w3schools.com/html/mov_bbb.mp4');
  } catch (error) {
    console.error('[API] Error in record-fallback:', error);
    return res.status(500).json({ success: false, error: 'Server error generating record.' });
  }
});

// @route   GET /api/settings
// @desc    Get global settings configuration
router.get('/settings', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const settingsFile = path.join(__dirname, '../config/settings.json');
    let globalCallAlertsEnabled = true;
    
    if (fs.existsSync(settingsFile)) {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      if (settings.globalCallAlertsEnabled !== undefined) {
        globalCallAlertsEnabled = settings.globalCallAlertsEnabled;
      }
    }
    return res.json({ success: true, settings: { globalCallAlertsEnabled } });
  } catch (error) {
    console.error('[API] Error getting settings:', error);
    return res.status(500).json({ success: false, error: 'Server error getting settings.' });
  }
});

// @route   PUT /api/settings
// @desc    Update global settings configuration (Admin only)
router.put('/settings', async (req, res) => {
  try {
    const { userId, globalCallAlertsEnabled } = req.body;
    
    if (!userId || globalCallAlertsEnabled === undefined) {
      return res.status(400).json({ success: false, error: 'userId and globalCallAlertsEnabled parameters are required.' });
    }
    
    // Authorization check
    let isAuthorized = false;
    if (global.dbConnected) {
      const requester = await User.findOne({ uid: userId });
      isAuthorized = requester && requester.role === 'admin';
    } else {
      const requester = memUsers.find(u => u.uid === userId);
      isAuthorized = requester && requester.role === 'admin';
    }
    
    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Forbidden. Admin access required.' });
    }
    
    const fs = require('fs');
    const path = require('path');
    const settingsFile = path.join(__dirname, '../config/settings.json');
    
    const settings = { globalCallAlertsEnabled };
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
    
    return res.json({ success: true, message: 'Global settings updated successfully.', settings });
  } catch (error) {
    console.error('[API] Error updating settings:', error);
    return res.status(500).json({ success: false, error: 'Server error updating settings.' });
  }
});

// @route   POST /api/upload-burst-frames
// @desc    Process live video stream frames captured 2 seconds apart by the frontend
router.post('/upload-burst-frames', async (req, res) => {
  try {
    const { uid, frames, message, zoneCode } = req.body;
    console.log(`[API] Received ${frames?.length || 0} live stream burst frames for device: ${uid}`);
    
    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ success: false, error: 'No frame images provided.' });
    }
    
    const fs = require('fs');
    const path = require('path');
    const Event = require('../models/Event');
    const Device = require('../models/Device');
    const aiService = require('../services/aiService');
    
    let device = null;
    if (global.dbConnected) {
      device = await Device.findOne({ uid });
    }
    if (!device) {
      device = (global.devicesMemory || []).find(d => d.uid === uid);
    }
    
    const now = new Date();
    const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);
    
    const newEventData = {
      uid,
      time: dateStr,
      action: 'LIVE_BURST_CAPTURE',
      message: message || `Live Stream 2-Second Burst Capture for ${device ? device.deviceName : uid}`,
      zoneCode: zoneCode || (device ? device.zoneCode : 'ZONE_01'),
      capturedImages: [],
      threatScore: 0,
      aiReport: 'Analyzing live video stream frames...',
      status: 'processing',
      createdAt: now
    };
    
    let event = null;
    if (global.dbConnected) {
      event = await Event.create(newEventData);
    } else {
      event = { _id: Date.now().toString(36) + Math.random().toString(36).substring(2, 6), ...newEventData };
      if (!global.eventsMemory) global.eventsMemory = [];
      global.eventsMemory.unshift(event);
    }
    
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const imageUrls = [];
    const port = process.env.PORT || 5050;
    
    for (let i = 0; i < frames.length; i++) {
      const rawFrame = frames[i] || '';
      const base64Data = rawFrame.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const isSvg = buffer.toString('utf8').includes('<svg') || rawFrame.includes('svg');
      const ext = isSvg ? 'svg' : 'jpg';
      const filename = `${event._id}_live_frame_${i + 1}_${Date.now()}.${ext}`;
      const localPath = path.join(uploadDir, filename);
      fs.writeFileSync(localPath, buffer);
      
      let imageUrl = `http://localhost:${port}/uploads/${filename}`;
      
      if (process.env.IMGBB_API_KEY && process.env.IMGBB_API_KEY !== 'your_imgbb_api_key_here') {
        try {
          const formData = new URLSearchParams();
          formData.append('image', base64Data);
          const imgbbResponse = await axios.post(
            `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
            formData,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          );
          if (imgbbResponse.data?.data?.url) {
            imageUrl = imgbbResponse.data.data.url;
          }
        } catch (uploadErr) {
          console.warn(`[Burst Proxy] ImgBB upload fallback to local URL: ${uploadErr.message}`);
        }
      }
      imageUrls.push(imageUrl);
    }
    
    event.capturedImages = imageUrls;
    await aiService.analyzeImages(event);
    
    return res.json({
      success: true,
      message: 'Live stream burst frames captured and analyzed successfully.',
      event
    });
  } catch (err) {
    console.error('[API] Error in upload-burst-frames:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
