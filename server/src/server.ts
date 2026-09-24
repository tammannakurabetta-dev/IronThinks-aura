import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import advisoryRoutes from './routes/advisoryRoutes';
import farmRoutes from './routes/farmRoutes';
import plotRoutes from './routes/plotRoutes';
import { errorHandler } from './middleware/errorHandler';
import { isGeminiConfigured } from './config/gemini';
import { isSupabaseConfigured } from './config/supabase';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// CORS Configuration
app.use(cors({
  origin: CORS_ORIGIN === '*' ? true : [CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-user-id']
}));

// Request Parsing & Logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health & System Diagnostic Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Agri-Genome OS Backend API',
    version: '1.0.0',
    diagnostics: {
      geminiEngineConfigured: isGeminiConfigured,
      geminiModelTarget: 'gemini-2.5-pro / gemini-2.5-flash',
      supabaseCloudConnected: isSupabaseConfigured,
      rateLimiterActive: true,
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Mount Core API Routes
app.use('/api/v1/advisory', advisoryRoutes);
app.use('/api/v1/farms', farmRoutes);
app.use('/api/v1/plots', plotRoutes);

// Global Error Handler
app.use(errorHandler);

// Bootstrap Server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌱 Agri-Genome OS Server running on port ${PORT}`);
  console.log(`📡 Base API Endpoint: http://localhost:${PORT}/api/v1`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🤖 Gemini SDK Configured: ${isGeminiConfigured ? 'YES (Live Cloud)' : 'NO (Sandbox Heuristic Mode)'}`);
  console.log(`🗄️ Supabase Connected: ${isSupabaseConfigured ? 'YES (Live Cloud)' : 'NO (In-Memory Sandbox)'}`);
  console.log(`====================================================`);
});

export default app;
