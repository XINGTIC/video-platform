const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isMember: { type: Boolean, default: false },
  memberExpireDate: { type: Date },
  walletAddress: { type: String }, // For USDT payment tracking
  dailyWatch: {
    date: { type: String }, // Format: YYYY-MM-DD
    count: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
