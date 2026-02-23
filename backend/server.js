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

const { extractDatabaseSchema } = require('./src/services/dbService');
const { updateSchema } = require('./src/services/sqlAgent');
const { extractAllTableNames, getAICuratedTables } = require('./src/services/schemaPruner');

// Start Server
app.listen(config.port, async () => {
  console.log(`Server is running on port ${config.port}`);

  try {
    // 1. Get raw list of all tables
    const rawTables = await extractAllTableNames();

    // 2. Ask AI to filter out system noise and return a whitelist
    const aiCuratedTables = await getAICuratedTables(rawTables);

    // 3. Introspect DB schema dynamically ONLY for those curated tables
    const schemaString = await extractDatabaseSchema(aiCuratedTables);

    // 4. Inject dynamically into the SQL Agent
    updateSchema(schemaString);
    console.log('[Server] AI Platform Boot Sequence Complete. Ready for queries.');
  } catch (err) {
    console.error("Failed to initialize dynamic schema on boot.", err);
  }
});
