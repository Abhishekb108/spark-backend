const express = require('express');
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');
const User = require('../models/User');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching profile for userId:', req.user.id);
    let profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) {
      console.log('No profile found, creating new...');
      profile = new Profile({ userId: req.user.id });
      await profile.save();
    }
    const user = await User.findById(req.user.id);
    console.log('Profile data:', profile, 'User category:', user.category);
    res.json({ ...profile._doc, category: user.category });
  } catch (err) {
    console.error('Profile fetch error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  const { links, shops, profileImage, bannerImage, profileTitle, bio, social, appearance, category } = req.body;
  try {
    console.log('Updating profile with:', { links, shops, profileImage, bannerImage, profileTitle, bio, social, appearance, category });
    let profile = await Profile.findOne({ userId: req.user.id });
    if (!profile) {
      profile = new Profile({ userId: req.user.id });
    }
    profile.links = links || [];
    profile.shops = shops || [];
    profile.profileImage = profileImage || '';
    profile.bannerImage = bannerImage || '';
    profile.profileTitle = profileTitle || '';
    profile.bio = bio || '';
    profile.social = social || { instagram: '', youtube: '' };
    profile.appearance = appearance || { theme: 'light', buttonColor: '#000000', layout: 'vertical' };
    await profile.save();

    if (category) {
      await User.findByIdAndUpdate(req.user.id, { category });
    }

    res.json(profile);
  } catch (err) {
    console.error('Profile update error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/search', auth, async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  try {
    console.log('Searching profiles with query:', q, 'page:', page, 'limit:', limit);
    const skip = (page - 1) * limit;
    let query = {};
    if (q) {
      query = {
        $or: [
          { 'links.url': { $regex: q, $options: 'i' } },
          { 'shops.url': { $regex: q, $options: 'i' } },
          { profileImage: { $regex: q, $options: 'i' } },
          { bannerImage: { $regex: q, $options: 'i' } },
          { profileTitle: { $regex: q, $options: 'i' } },
          { bio: { $regex: q, $options: 'i' } },
          { 'social.instagram': { $regex: q, $options: 'i' } },
          { 'social.youtube': { $regex: q, $options: 'i' } }
        ]
      };
    }

    const profiles = await Profile.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username name category');
    const total = await Profile.countDocuments(query);

    res.json({
      data: profiles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (err) {
    console.error('Profile search error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:username', async (req, res) => {
  try {
    console.log('Fetching public profile for username:', req.params.username);
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json({ ...profile._doc, username: user.username, name: user.name, category: user.category });
  } catch (err) {
    console.error('Public profile fetch error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;