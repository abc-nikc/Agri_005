import { Router } from 'express';
import { getAll, getValue, updateSetting, batchUpdate } from '../controllers/system-settings.controller';

const router = Router();
router.get('/', ...getAll);
router.get('/:key', ...getValue);
router.put('/:key', ...updateSetting);
router.put('/', ...batchUpdate);
export default router;
