import { Router } from 'express';
import {
  getOperations,
  getOperationById,
  createOperation,
  updateOperation,
  deleteOperation,
} from '../controllers/farming-operation.controller';

const router = Router();

router.get('/', ...getOperations);
router.get('/:id', ...getOperationById);
router.post('/', ...createOperation);
router.put('/:id', ...updateOperation);
router.delete('/:id', ...deleteOperation);

export default router;
