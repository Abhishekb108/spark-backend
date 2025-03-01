const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  category: { type: String, default: 'Business' }
});

module.exports = mongoose.model('User', userSchema);