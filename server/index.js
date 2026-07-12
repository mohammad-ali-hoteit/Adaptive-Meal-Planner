// Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Config
const connectDB = require('./config/db');
const imagekit = require('./config/imagekit');

// Middleware
const errorHandler = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/authRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const foodRoutes = require('./routes/foodRoutes');
const customMealRoutes = require('./routes/customMealRoutes');
const communityMealRoutes = require('./routes/communityMealRoutes');
const ingredientRoutes = require('./routes/ingredientRoutes');
const historyRoutes = require('./routes/historyRoutes');
const progressRoutes = require('./routes/progressRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

// Global middleware
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Health check route
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ImageKit auth endpoint
app.get('/api/imagekit/auth', (req, res) => {
  const result = imagekit.getAuthenticationParameters();
  res.json(result);
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/custom-meals', customMealRoutes);
app.use('/api/community-meals', communityMealRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/profile', profileRoutes);

// Error handler (AFTER all routes)
app.use(errorHandler);

// Connect to DB and start server
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
