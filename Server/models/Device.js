const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  userId: {
    type: String,
    required: true
  },
  deviceName: {
    type: String,
    default: 'ESP32 Camera Device'
  },
  cameraUrl: {
    type: String,
    default: 'https://picsum.photos/800/600' // Default placeholder for grabbing mock frames
  },
  zoneCode: {
    type: String,
    default: 'ZONE_01'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Device', DeviceSchema);
