const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images

const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

// Routes
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const mealRoutes = require('./routes/mealRoutes');
const progressRoutes = require('./routes/progressRoutes');
const ingredientRoutes = require('./routes/ingredientRoutes');

app.use('/api', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/ingredients', ingredientRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
