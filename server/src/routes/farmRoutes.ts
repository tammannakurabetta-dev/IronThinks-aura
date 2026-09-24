import { Router } from 'express';
import { 
  createFarmHandler, 
  getUserFarmsHandler, 
  getFarmByIdHandler 
} from '../controllers/farmController';
import { verifySupabaseAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(verifySupabaseAuth);

router.post('/', createFarmHandler);
router.get('/', getUserFarmsHandler);
router.get('/:id', getFarmByIdHandler);

export default router;
