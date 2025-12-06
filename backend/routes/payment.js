const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

const getUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (e) {}
  }
  next();
};

// Mock Payment Verification
// In production, verify TX hash on-chain or use a payment gateway webhook
router.post('/verify', getUser, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  
  const { txHash } = req.body;
  
  if (!txHash) return res.status(400).json({ message: 'Transaction hash required' });

  // MOCK LOGIC: If hash starts with "0x", approve it.
  if (txHash.startsWith('0x')) {
    try {
      const user = await User.findById(req.user.id);
      user.isMember = true;
      // Set expire date to 30 days from now
      const date = new Date();
      date.setDate(date.getDate() + 30);
      user.memberExpireDate = date;
      await user.save();
      
      return res.json({ success: true, message: 'Membership activated' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(400).json({ success: false, message: 'Invalid transaction' });
  }
});

module.exports = router;
