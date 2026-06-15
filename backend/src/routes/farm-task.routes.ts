import { Router } from 'express';
import { FarmTaskController } from '../controllers/farm-task.controller';

const router = Router();
const ctrl = new FarmTaskController();

router.get('/stats', (req, res) => ctrl.stats(req, res));
router.get('/ai-schedule', (req, res) => ctrl.aiSchedule(req, res));
router.get('/:id', (req, res) => ctrl.get(req, res));
router.get('/', (req, res) => ctrl.list(req, res));
router.post('/ai-create', (req, res) => ctrl.aiCreateTasks(req, res));
router.post('/', (req, res) => ctrl.create(req, res));
router.put('/:id', (req, res) => ctrl.update(req, res));
router.delete('/:id', (req, res) => ctrl.delete(req, res));

export default router;
