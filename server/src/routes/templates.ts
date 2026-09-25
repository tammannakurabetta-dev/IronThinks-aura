import { Router, Request, Response } from 'express';
import { WorkflowRepository } from '../db/repository';

export const templatesRouter = Router();

templatesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const templates = await WorkflowRepository.getTemplates();
    res.json(templates);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

templatesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const template = await WorkflowRepository.getTemplateById(String(req.params.id));
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    return res.json(template);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
