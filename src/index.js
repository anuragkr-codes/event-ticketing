import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import { connectDB } from './db/mongoose.js';
import { swaggerRouter } from './swagger.js';
import { errorHandler } from './middlewares/error.middleware.js';

dotenv.config();

const PORT = process.env.PORT || 4000;
const app = express();

app.use(helmet());
app.use(express.json());
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// routes
app.use('/docs', swaggerRouter);

// health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// global error handler
app.use(errorHandler);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
