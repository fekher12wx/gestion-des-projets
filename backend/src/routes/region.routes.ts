import { Router } from 'express';
import RegionController from '../controllers/region.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all regions
router.get('/', authorize('regions', 'read'), RegionController.list);

// Get region by ID
router.get('/:id', authorize('regions', 'read'), RegionController.getById);

// Create new region
router.post('/', authorize('regions', 'create'), RegionController.create);

// Update region
router.put('/:id', authorize('regions', 'update'), RegionController.update);

// Delete region
router.delete('/:id', authorize('regions', 'delete'), RegionController.delete);

export default router;
