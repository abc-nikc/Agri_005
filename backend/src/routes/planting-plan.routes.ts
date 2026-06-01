import { Router } from 'express';
import { getPlans, getPlanById, createPlan, updatePlan, deletePlan, getTermRecommendations } from '../controllers/planting-plan.controller';

const router = Router();
router.get('/term-recommendations', ...getTermRecommendations);
router.get('/', ...getPlans);
router.get('/:id', ...getPlanById);
router.post('/', ...createPlan);
router.put('/:id', ...updatePlan);
router.delete('/:id', ...deletePlan);
export default router;
