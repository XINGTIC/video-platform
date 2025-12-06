require('dotenv').config();
const mongoose = require('mongoose');
const { syncMg621, syncH823 } = require('./routes/sync');
const Video = require('./models/Video');

// Connect to DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/videoplatform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB Connected');
  
  try {
    console.log('Starting Manual Sync...');
    
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
