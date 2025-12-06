const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  videoUrl: { type: String, required: true }, // R2/S3 URL or external URL
  thumbnailUrl: { type: String },
  duration: { type: Number }, // in seconds
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null if system uploaded
  views: { type: Number, default: 0 },
  sourceUrl: { type: String }, // Original URL if scraped
  isPremium: { type: Boolean, default: false }, // Can force premium regardless of daily limit
  tags: { type: [String], default: [] }, // Video tags/categories
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', VideoSchema);
