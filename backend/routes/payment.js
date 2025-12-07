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

const USDT_ADDRESS = 'TFdSk3jPR3XysH3AhYMXyHioSE6nH8pj3L';

router.get('/config', (req, res) => {
    res.json({ address: USDT_ADDRESS, network: 'TRON (TRC20)' });
});

// Mock Payment Verification
// In production, verify TX hash on-chain or use a payment gateway webhook
router.post('/verify', getUser, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: '未授权' });
  
  const { txHash } = req.body;
  
  if (!txHash) return res.status(400).json({ message: '需要交易哈希' });

  // Accept TRON TXID (usually 64 hex chars)
  // Simple length check for now to allow user testing
  if (txHash.length >= 64 || txHash.startsWith('0x')) {
    try {
      const user = await User.findById(req.user.id);
      
      const { planType } = req.body; // monthly, quarterly, yearly
      let daysToAdd = 30; // Default to monthly
      
      if (planType === 'quarterly') daysToAdd = 90;
      if (planType === 'yearly') daysToAdd = 365;
      
      user.isMember = true;
      
      // Calculate new expiry date
      const currentExpiry = user.memberExpireDate && user.memberExpireDate > new Date() 
        ? new Date(user.memberExpireDate) 
        : new Date();
        
      currentExpiry.setDate(currentExpiry.getDate() + daysToAdd);
      user.memberExpireDate = currentExpiry;
      
      await user.save();
      
      return res.json({ 
        success: true, 
        message: '会员已激活',
        expiry: user.memberExpireDate 
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  } else {
    return res.status(400).json({ success: false, message: '无效的交易' });
  }
});

module.exports = router;
