const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, inviteCode } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: '所有字段都是必填的' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: '密码长度必须至少为8位' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    // Generate unique invite code
    let newInviteCode = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let isUnique = false;
    while (!isUnique) {
      for (let i = 0; i < 6; i++) {
        newInviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      const check = await User.findOne({ inviteCode: newInviteCode });
      if (!check) isUnique = true;
      else newInviteCode = '';
    }

    // Handle referral
    let referrer = null;
    let inviteRewardDays = 0;
    
    if (inviteCode) {
      referrer = await User.findOne({ inviteCode });
      if (referrer) {
        // Award referrer (3 days VIP)
        const now = new Date();
        const currentExpire = referrer.memberExpireDate && referrer.memberExpireDate > now 
            ? referrer.memberExpireDate 
            : now;
        referrer.memberExpireDate = new Date(currentExpire.getTime() + 3 * 24 * 60 * 60 * 1000);
        referrer.isMember = true;
        referrer.inviteCount = (referrer.inviteCount || 0) + 1;
        await referrer.save();

        // New user reward (1 day VIP)
        inviteRewardDays = 1;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      email, 
      password: hashedPassword,
      inviteCode: newInviteCode,
      invitedBy: referrer ? referrer._id : null
    });

    if (inviteRewardDays > 0) {
      user.isMember = true;
      user.memberExpireDate = new Date(Date.now() + inviteRewardDays * 24 * 60 * 60 * 1000);
    }

    await user.save();
    res.status(201).json({ message: '用户已创建' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Invite Stats
router.get('/invite-stats', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: '未授权' });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('inviteCode inviteCount isMember memberExpireDate');
        
        if (!user) return res.status(404).json({ message: '用户不存在' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: '用户不存在' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: '用户名或密码错误' });

    const token = jwt.sign({ id: user._id, isMember: user.isMember }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, username: user.username, isMember: user.isMember } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
