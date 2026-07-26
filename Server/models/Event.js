const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    uppercase: true
  },
  time: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  message: {
    type: String
  },
  zoneCode: {
    type: String
  },
  capturedImages: {
    type: [String],
    default: []
  },
  threatScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  aiReport: {
    type: String,
    default: 'Analysis pending'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'analyzed', 'alerted', 'error'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);
