const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const lotteryRoutes = require('./routes/lottery');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5174',
    'https://api.robertwmassey.com',
    'https://www.robertwmassey.com'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Routes
app.use('/apis/lottopicker', lotteryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // In development, write the port to a file for the frontend
  if (process.env.NODE_ENV !== 'production') {
    const portFile = path.resolve(__dirname, '../../port.txt');
    fs.writeFileSync(portFile, PORT.toString());
  }
}); 