import { Router } from 'express';
import { 
  generateAdvisoryHandler, 
  getPlotAdvisoriesHandler, 
  getAdvisoryByIdHandler,
  getAllUserAdvisoriesHandler
} from '../controllers/advisoryController';
import { updateActionItemStatusHandler } from '../controllers/actionItemController';
import { verifySupabaseAuth } from '../middleware/authMiddleware';
import { advisoryRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply auth middleware to all advisory routes
router.use(verifySupabaseAuth);

// POST /api/v1/advisory/generate - Generates structured AI advisory with Gemini 2.5 Pro (Rate limited)
router.post('/generate', advisoryRateLimiter, generateAdvisoryHandler);

// GET /api/v1/advisory - Retrieves all historical advisories for authenticated user
router.get('/', getAllUserAdvisoriesHandler);

// GET /api/v1/advisory/plot/:plotId - Retrieves historical advisories for a specific plot
router.get('/plot/:plotId', getPlotAdvisoriesHandler);

// GET /api/v1/advisory/:id - Retrieves single advisory details with action items
router.get('/:id', getAdvisoryByIdHandler);

// PATCH /api/v1/advisory/action/:id - Updates action item status (PENDING / DONE)
router.patch('/action/:id', updateActionItemStatusHandler);

export default router;
