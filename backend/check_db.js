const mongoose = require('mongoose');
const Video = require('./models/Video');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/videoplatform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  const count = await Video.countDocuments();
  console.log(`Total Videos: ${count}`);
  
  const videos = await Video.find().sort({ createdAt: -1 }).limit(5);
  videos.forEach(v => {
      console.log(`- [${v.sourceUrl ? (v.sourceUrl.includes('mg621') ? 'MG621' : 'H823') : 'Unknown'}] ${v.title} (Tags: ${v.tags.join(', ')})`);
  });
  
  process.exit();
})
.catch(err => console.error(err));
