require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/video');
const paymentRoutes = require('./routes/payment');
const proxyRoutes = require('./routes/proxy');
const { router: syncRoutes, syncMg621, syncH823 } = require('./routes/sync');
const cron = require('node-cron');
const axios = require('axios');
const Video = require('./models/Video');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connection.on('connected', () => console.log('Mongoose connected'));
mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/videoplatform', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB Connected');
  
  // Check if DB is empty and trigger initial sync
  try {
    const count = await Video.countDocuments();
    console.log(`[Startup] Current video count: ${count}`);
    if (count === 0) {
      console.log('[Startup] Database is empty. Triggering initial sync...');
      // Run in background so we don't block server startup
      (async () => {
         try {
           const c1 = await syncMg621(10);
           const c2 = await syncH823(10);
           console.log(`[Startup] Initial sync completed. Saved: ${c1 + c2}`);
         } catch (e) {
           console.error('[Startup] Initial sync failed:', e.message);
         }
      })();
    }
  } catch (e) {
    console.error('[Startup] Failed to check video count:', e.message);
  }
})
.catch(err => console.error('MongoDB Connection Error:', err));

// Health Check Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mongoState: mongoose.connection.readyState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
        timestamp: new Date(),
        envCheck: {
            hasMongoURI: !!process.env.MONGO_URI
        }
    });
});

// Scheduled Sync (Runs every 12 hours)
// "0 */12 * * *"
cron.schedule('0 */12 * * *', async () => {
  console.log('[Cron] Starting scheduled sync...');
  try {
    // Assuming server runs on localhost:5000
    // We call the internal route logic or just trigger via axios
    await axios.post('http://localhost:5000/api/sync/run', {});
  } catch (error) {
    console.error('[Cron] Sync failed:', error.message);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/sync', syncRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
