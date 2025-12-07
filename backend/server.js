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
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

// Database Connection
mongoose.connection.on('connected', () => console.log('Mongoose connected'));
mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));

const startDB = async () => {
  let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/videoplatform';
  
  try {
    // Try primary connection
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Fail fast if not running
    });
    console.log('MongoDB Connected (Primary)');
  } catch (err) {
    console.warn('Primary MongoDB connection failed. Attempting in-memory fallback...');
    try {
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB Connected (In-Memory Fallback)');
    } catch (fallbackErr) {
      console.error('Fatal: All MongoDB connection attempts failed.', fallbackErr);
      return;
    }
  }

  // Initial Sync Logic
  try {
    // Seed Admin User
    const adminUser = await User.findOne({ username: 'xingtic' });
    if (!adminUser) {
        const hashedPassword = await bcrypt.hash('Xingtic.0.', 10);
        await User.create({
            username: 'xingtic',
            email: 'xingtic@admin.com', // Dummy email
            password: hashedPassword,
            isAdmin: true,
            isMember: true, // Also give member status to be safe, though we will check isAdmin
            inviteCode: 'ADMIN1'
        });
        console.log('[Startup] Admin user "xingtic" created.');
    } else {
        // Ensure admin rights if user exists
        if (!adminUser.isAdmin) {
            adminUser.isAdmin = true;
            adminUser.isMember = true;
            await adminUser.save();
            console.log('[Startup] Admin user "xingtic" updated with super permissions.');
        }
    }

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
};

startDB();

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
    await axios.post('http://localhost:5000/api/sync/run', { limit: 100 });
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
