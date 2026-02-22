import { Router } from 'express';
import ClientController from '../controllers/client.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all clients
router.get('/', authorize('clients', 'read'), ClientController.list);

// Get client by ID
router.get('/:id', authorize('clients', 'read'), ClientController.getById);

// Create new client
router.post('/', authorize('clients', 'create'), ClientController.create);

// Update client
router.put('/:id', authorize('clients', 'update'), ClientController.update);

// Delete client
router.delete('/:id', authorize('clients', 'delete'), ClientController.delete);

export default router;
