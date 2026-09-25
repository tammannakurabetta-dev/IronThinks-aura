import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../db/connection';
import { ai, getGeminiClient, GEMINI_FAST_MODEL } from '../lib/gemini';
import { sendEmailReport } from '../lib/email';

export const settingsRouter = Router();

settingsRouter.get('/', async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseConnection();

  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('placeholder'));
  const resendConfigured = Boolean(process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('placeholder'));
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  res.json({
    environment: process.env.NODE_ENV || 'development',
    serverPort: process.env.PORT || 5000,
    database: {
      status: dbHealth.connected ? 'ONLINE' : 'OFFLINE',
      driver: dbHealth.driver,
      message: dbHealth.message,
    },
    aiProvider: {
      provider: 'Google Gemini (@google/genai)',
      isKeyConfigured: geminiConfigured,
      models: {
        reasoning: 'gemini-2.5-pro',
        fast: 'gemini-2.5-flash',
      },
      status: geminiConfigured ? 'READY' : 'SIMULATED_FAILSAFE'
    },
    emailProvider: {
      activeProvider: process.env.EMAIL_PROVIDER || 'nodemailer',
      fromEmail: process.env.SYSTEM_FROM_EMAIL || 'reports@researchflow.ai',
      resendConfigured,
      smtpConfigured,
      status: resendConfigured || smtpConfigured ? 'CONFIGURED' : 'SANDBOX_ETHEREAL'
    },
    scraper: {
      maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SCRAPES || '3', 10),
      timeoutMs: parseInt(process.env.SCRAPER_TIMEOUT_MS || '8000', 10),
      maxSourcePages: parseInt(process.env.MAX_SOURCE_PAGES || '5', 10),
      ssrfGuardrails: 'ENABLED'
    }
  });
});

settingsRouter.post('/verify-gemini', async (req: Request, res: Response) => {
  try {
    const client = getGeminiClient(req.body?.apiKey);
    if (!client) {
      return res.json({
        success: false,
        status: 'FALLBACK_MODE',
        message: 'GEMINI_API_KEY is not configured or using placeholder. Running in grounded fallback mode.'
      });
    }

    const testResponse = await client.models.generateContent({
      model: GEMINI_FAST_MODEL,
      contents: 'Ping: Return "PONG: ResearchFlow Gemini 2.5 Active"'
    });

    return res.json({
      success: true,
      status: 'VERIFIED',
      response: testResponse.text || 'OK'
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

settingsRouter.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const targetEmail = req.body.email || 'operator@researchflow.ai';
    const result = await sendEmailReport({
      to: [targetEmail],
      subject: 'ResearchFlow AI - Test Delivery Verification',
      html: `<h2>System Dispatch Verification</h2><p>This is a verification dispatch from ResearchFlow AI Server.</p>`
    });

    return res.json({
      success: true,
      result
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

settingsRouter.get('/db-health', async (_req: Request, res: Response) => {
  const health = await checkDatabaseConnection();
  res.json(health);
});
