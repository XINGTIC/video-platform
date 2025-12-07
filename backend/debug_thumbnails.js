require('dotenv').config();
const mongoose = require('mongoose');
const Video = require('./models/Video');

// Connect to DB
const MONGO_URI = 'mongodb+srv://appuser:appuser123@cluster0.rlv7zxw.mongodb.net/videoplatform?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB Connected');
  
  try {
    const videos = await Video.find().limit(20);
    console.log(`Found ${videos.length} videos`);
    
    videos.forEach((v, i) => {
        console.log(`\n[${i+1}] ${v.title}`);
        console.log(`Provider: ${v.provider}`);
        console.log(`Thumbnail: ${v.thumbnailUrl}`);
        console.log(`Video URL: ${v.videoUrl}`);
    });
    
  } catch (e) {
    console.error('Error:', e);
  } finally {
    mongoose.disconnect();
  }
})
.catch(err => console.error('MongoDB Connection Error:', err));
