import { Router } from 'express';
import { 
  createPlotHandler, 
  getUserPlotsHandler, 
  getPlotByIdHandler 
} from '../controllers/plotController';
import { verifySupabaseAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(verifySupabaseAuth);

router.post('/', createPlotHandler);
router.get('/', getUserPlotsHandler);
router.get('/:id', getPlotByIdHandler);

export default router;
