require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded camera frames statically
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api', require('./routes/api'));

// Root Endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ESP32 Security Camera Server',
    status: 'Running',
    documentation: '/api'
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
