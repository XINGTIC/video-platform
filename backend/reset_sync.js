require('dotenv').config();
const mongoose = require('mongoose');
const Video = require('./models/Video');
const { syncMg621, syncH823 } = require('./routes/sync');

// Use the correct connection string
const MONGO_URI = 'mongodb+srv://appuser:appuser123@cluster0.rlv7zxw.mongodb.net/videoplatform?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB Connected');
  
  try {
    console.log('Clearing old synced videos...');
    // Delete videos that have a sourceUrl (imported ones)
    const res = await Video.deleteMany({ sourceUrl: { $exists: true, $ne: null } });
    console.log(`Deleted ${res.deletedCount} videos.`);
    
    console.log('Starting fresh sync...');
    
    const limit = 10;
    
    // Sync MG621
    const c1 = await syncMg621(limit);
    console.log(`MG621 Sync Finished. Saved: ${c1}`);
    
    // Sync H823
    const c2 = await syncH823(limit);
    console.log(`H823 Sync Finished. Saved: ${c2}`);
    
    console.log(`Total Saved: ${c1 + c2}`);
    
  } catch (e) {
    console.error('Sync Failed:', e);
  } finally {
    mongoose.disconnect();
    console.log('Done');
  }
})
.catch(err => console.error('MongoDB Connection Error:', err));