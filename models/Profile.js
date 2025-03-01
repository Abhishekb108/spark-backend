const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  links: [{ url: String, visible: Boolean }],
  shops: [{ url: String, visible: Boolean }],
  profileImage: String,
  bannerImage: String,
  profileTitle: String,
  bio: String,
  social: {
    instagram: String,
    youtube: String
  },
  appearance: {
    theme: { type: String, default: 'light' },
    buttonColor: { type: String, default: '#000000' },
    layout: { type: String, default: 'vertical' }
  }
});

module.exports = mongoose.model('Profile', profileSchema);