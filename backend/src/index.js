const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const lotteryRoutes = require('./routes/lottery');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5174',
    'https://api.robertwmassey.com',
    'https://www.robertwmassey.com',
    'https://portfolio.robertwmassey.com',
    'https://lottopicker.robertwmassey.com'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
};

// Production-specific middleware
if (NODE_ENV === 'production') {
  // Enable trust proxy for secure headers
  app.set('trust proxy', 1);
  
  // Add security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
}

app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Routes
app.use('/api/lottery', lotteryRoutes);
app.use('/api/portfolio-projects', (req, res) => {
  // Forward the request to the portfolio API
  res.redirect('https://api.robertwmassey.com/api/portfolio-projects');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running in ${NODE_ENV} mode on port ${PORT}`);
  
  // In development, write the port to a file for the frontend
  if (NODE_ENV !== 'production') {
    const portFile = path.resolve(__dirname, '../../port.txt');
    fs.writeFileSync(portFile, PORT.toString());
  }
}); 