const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'operator'],
    default: 'operator'
  },
  accessibleDevices: [{
    type: String,
    trim: true
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
