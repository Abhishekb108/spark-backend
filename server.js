const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const analyticsRoutes = require('./routes/analytics');
const settingsRoutes = require('./routes/settings');

dotenv.config();
console.log('EMAIL_USER:', process.env.EMAIL_USER); // Optional, remove if not using email
console.log('EMAIL_PASS:', process.env.EMAIL_PASS); // Optional, remove if not using email
const app = express();

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // Adjust if frontend port is 3001
  credentials: true
}));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));