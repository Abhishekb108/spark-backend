const express = require('express');
const auth = require('../middleware/auth');
const Analytics = require('../models/Analytics');
const router = express.Router();
const geoip = require('geoip-lite');
const cookieParser = require('cookie-parser');

router.use(cookieParser());

router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching analytics for userId:', req.user.id);
    const analytics = await Analytics.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(100);
    console.log('Analytics data found:', analytics.length, 'records');
    res.json(analytics);
  } catch (err) {
    console.log('Error fetching analytics:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/track/:linkId', auth, async (req, res) => {
  const { linkId } = req.params;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  const cookie = req.cookies['linkhub_view_' + linkId] || '';
  const now = new Date().toISOString();

  console.log('Tracking view for linkId:', linkId, 'IP:', ip, 'UserAgent:', userAgent, 'Cookie:', cookie);

  // Determine device type
  let device = 'desktop';
  if (/mobile/i.test(userAgent)) device = 'mobile';
  else if (/tablet/i.test(userAgent)) device = 'tablet';

  // Get location from IP
  const geo = geoip.lookup(ip);
  const location = geo ? { country: geo.country, city: geo.city } : { country: 'Unknown', city: 'Unknown' };
  console.log('Device:', device, 'Location:', location);

  // Check for unique view (cookie + IP, daily limit)
  const cookieKey = `linkhub_view_${linkId}_${ip}_${device}`;
  if (!cookie || cookie < now.split('T')[0]) { // Simple daily unique check
    try {
      await Analytics.create({
        userId: req.user.id,
        linkId,
        type: 'view',
        ip,
        device,
        location,
        referrer: req.headers.referer || 'direct'
      });
      console.log('Unique view tracked for linkId:', linkId);
      res.cookie('linkhub_view_' + linkId, now, { maxAge: 86400000, httpOnly: true, sameSite: 'strict' }); // 24 hours, secure cookies
      res.sendStatus(200);
    } catch (err) {
      console.log('Error tracking view:', err.message);
      res.status(500).send('Server error tracking view');
    }
  } else {
    console.log('Duplicate view detected, not tracking for linkId:', linkId);
    res.sendStatus(200);
  }
});

router.post('/click/:linkId', auth, async (req, res) => {
  const { linkId } = req.params;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  console.log('Tracking click for linkId:', linkId, 'IP:', ip, 'UserAgent:', userAgent);

  // Determine device type
  let device = 'desktop';
  if (/mobile/i.test(userAgent)) device = 'mobile';
  else if (/tablet/i.test(userAgent)) device = 'tablet';

  // Get location from IP
  const geo = geoip.lookup(ip);
  const location = geo ? { country: geo.country, city: geo.city } : { country: 'Unknown', city: 'Unknown' };
  console.log('Device:', device, 'Location:', location);

  try {
    await Analytics.create({
      userId: req.user.id,
      linkId,
      type: 'click',
      ip,
      device,
      location,
      referrer: req.headers.referer || 'direct'
    });
    console.log('Click tracked for linkId:', linkId);
    res.sendStatus(200);
  } catch (err) {
    console.log('Error tracking click:', err.message);
    res.status(500).send('Server error tracking click');
  }
});

// Search and pagination for analytics
router.get('/search', auth, async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;
  try {
    console.log('Searching analytics with query:', q, 'page:', page, 'limit:', limit);
    const skip = (page - 1) * limit;
    let query = { userId: req.user.id };
    if (q) {
      query = {
        ...query,
        $or: [
          { linkId: { $regex: q, $options: 'i' } },
          { device: { $regex: q, $options: 'i' } },
          { 'location.country': { $regex: q, $options: 'i' } },
          { 'location.city': { $regex: q, $options: 'i' } },
          { referrer: { $regex: q, $options: 'i' } }
        ]
      };
    }

    const analytics = await Analytics.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    const total = await Analytics.countDocuments(query);

    console.log('Analytics search results:', analytics.length, 'records');
    res.json({
      data: analytics,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (err) {
    console.log('Error searching analytics:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;