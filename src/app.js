import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import { swaggerRouter } from './swagger.js';
import { errorHandler } from './middlewares/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';

const app = express();

app.use(helmet());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// mount routes (DB connection is handled in index.js start)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/docs', swaggerRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// global error handler
app.use(errorHandler);

export default app;
