const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const { swaggerRouter } = require('./swagger');
const { errorHandler } = require('./middlewares/error.middleware');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const eventRoutes = require('./routes/event.routes');

const app = express();

app.use(helmet());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// mount routes (DB connection is handled in index.js start)
// root route
app.get('/', (req, res) => {
  res.json({
    message: 'Event Ticketing API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      events: '/api/v1/events',
      docs: '/docs',
      health: '/health',
    },
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/docs', swaggerRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// global error handler
app.use(errorHandler);

module.exports = app;
