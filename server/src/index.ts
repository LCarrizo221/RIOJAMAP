import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import obrasRoutes from './routes/obras.js';
import authRoutes from './routes/auth.js';
import importRoutes from './routes/import.js';
import conveniosMunicRoutes from './routes/conveniosMunic.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const allowedOrigins = [
  'http://localhost:5173',
  'https://localhost:5173',
  'http://localhost:3000',
  'https://riojamap.devlab1.online',
  'https://6fbrnqmj-5173.brs.devtunnels.ms',
  'https://6fbrnqmj-3003.brs.devtunnels.ms'
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/obras', obrasRoutes);
app.use('/api/import', importRoutes);
app.use('/api/convenios-munic', conveniosMunicRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
});
