const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  linkId: { type: String, required: true }, // ID or URL of the link being tracked
  type: { type: String, enum: ['view', 'click'], required: true },
  ip: String,
  device: String, // e.g., mobile, desktop, tablet
  location: {
    country: String,
    city: String
  },
  referrer: String, // e.g., social media, direct
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Analytics', analyticsSchema);