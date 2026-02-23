const express = require('express');
const cors = require('cors');
const config = require('./src/config/env');
const apiLimiter = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');
const askRoutes = require('./src/routes/askRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Apply rate limiting to /ask routes
app.use('/ask', apiLimiter);

// Routes
app.use('/ask', askRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error Handling Middleware
app.use(errorHandler);

// Start Server
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
