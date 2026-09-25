import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { workflowRouter } from './routes/workflows';
import { templatesRouter } from './routes/templates';
import { settingsRouter } from './routes/settings';
import { knowledgeRouter } from './routes/knowledge';
import { checkDatabaseConnection } from './db/connection';
import { ai } from './lib/gemini';

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:5173';

// Security Headers (Configured for SSE streams & email preview iframes)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration
app.use(cors({
  origin: CLIENT_ORIGIN === '*' ? true : [CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With']
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate Limiting on workflow creation / execution routes
const workflowCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 workflow launches per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded: Too many research workflows created. Please wait a minute.' }
});

// Mount Routes
app.use('/api/workflows', workflowCreationLimiter, workflowRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/knowledge', knowledgeRouter);

// Health Endpoint
app.get('/api/health', async (_req, res) => {
  const dbHealth = await checkDatabaseConnection();
  res.json({
    status: 'healthy',
    service: 'ResearchFlow AI Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbHealth,
    geminiLive: Boolean(ai),
    uptime: process.uptime()
  });
});

// Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected server error occurred.'
  });
});

// Start Server
app.listen(PORT, async () => {
  const dbHealth = await checkDatabaseConnection();
  console.log('================================================================');
  console.log(`⚡ ResearchFlow AI Server running on port ${PORT}`);
  console.log(`🌐 Base API: http://localhost:${PORT}/api/workflows`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️ Database: ${dbHealth.driver} (${dbHealth.message})`);
  console.log(`🤖 Google Gemini 2.5 SDK: ${ai ? 'LIVE ACTIVE' : 'SANDBOX / GROUNDED FALLBACK'}`);
  console.log('================================================================');
});

export default app;
