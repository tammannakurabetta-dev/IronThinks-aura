import { Router, Request, Response } from 'express';
import { lookupKnowledge } from '../lib/knowledge';

export const knowledgeRouter = Router();

/**
 * GET /api/knowledge/lookup?q=:query
 * Fast encyclopedic lookup on any name, person, technology, or concept via Wikipedia & knowledge tools.
 */
knowledgeRouter.get('/lookup', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    const entity = await lookupKnowledge(query);
    return res.json({ entity });
  } catch (err: any) {
    console.error('[Knowledge Route Error]:', err);
    return res.status(500).json({ error: 'Failed to lookup knowledge entity: ' + err.message });
  }
});
