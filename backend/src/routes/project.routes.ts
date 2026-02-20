import { Router } from 'express';
import ProjectController from '../controllers/project.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all projects
router.get('/', authorize('projects', 'read'), ProjectController.list);

// Get project by ID
router.get('/:id', authorize('projects', 'read'), ProjectController.getById);

// Create new project
router.post('/', authorize('projects', 'create'), ProjectController.create);

// Update project
router.put('/:id', authorize('projects', 'update'), ProjectController.update);

// Delete project
router.delete('/:id', authorize('projects', 'delete'), ProjectController.delete);

export default router;
