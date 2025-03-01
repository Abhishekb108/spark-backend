const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/signup', async (req, res) => {
  const { email, password, username, name } = req.body;
  try {
    console.log('Signup attempt:', { email, username, name });
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: 'Email or username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashedPassword);
    const user = new User({ email, password: hashedPassword, username, name });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ token, username });
  } catch (err) {
    console.log('Signup error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt - Request body:', { username, password });
  try {
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    console.log('User query result:', user ? { username: user.username, email: user.email } : 'null');

    if (!user) {
      console.log('User not found in database for:', username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('Stored hashed password:', user.password);
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isMatch);

    if (!isMatch) {
      console.log('Password mismatch for user:', user.username);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Generated token:', token);
    res.json({ token, username: user.username });
  } catch (err) {
    console.log('Login error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

router.post('/reset-password/:token', async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

module.exports = router;