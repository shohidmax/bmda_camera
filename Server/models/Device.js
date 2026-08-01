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
    default: 'http://161.248.205.218:1984/stream.html?src=camera_001'
  },
  zoneCode: {
    type: String,
    default: 'ZONE_01'
  },
  institution: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  latitude: {
    type: String,
    default: ''
  },
  longitude: {
    type: String,
    default: ''
  },
  phoneNumbers: {
    type: [String],
    default: [],
    validate: {
      validator: function(val) {
        return val.length <= 5;
      },
      message: 'A device can have at most 5 phone numbers.'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Device', DeviceSchema);
