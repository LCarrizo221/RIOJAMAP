import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import obrasRoutes from './routes/obras.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://riojamap.devlab1.online'
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/obras', obrasRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
