import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import vehicleRouter from './routes/vehicles';
import queueRouter from './routes/queues';
import serviceHistoryRouter from './routes/serviceHistory';
import queueLogsRouter from './routes/queueLogs';
import adminRouter from './routes/admin';
import { errorHandler } from './middleware/auth';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '4000', 10);

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (_, res) => {
  res.json({ success: true, message: 'Smart Queue Backend is running' });
});

app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehicleRouter);
app.use('/api/queues', queueRouter);
app.use('/api/service-history', serviceHistoryRouter);
app.use('/api/queue-logs', queueLogsRouter);
app.use('/api/admin', adminRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Smart Queue Backend listening on port ${port}`);
});
