const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isMember: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false }, // Super permissions
  memberExpireDate: { type: Date },
  walletAddress: { type: String }, // For USDT payment tracking
  inviteCode: { type: String, unique: true }, // Unique 6-char code
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Referrer
  inviteCount: { type: Number, default: 0 },
  dailyWatch: {
    date: { type: String }, // Format: YYYY-MM-DD
    count: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
