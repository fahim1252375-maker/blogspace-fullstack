import { Router } from 'express';
import {
  getBlogs,
  getMyBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../controllers/blogController.ts';
import { protect } from '../middleware/authMiddleware.ts';

const router = Router();

router.route('/')
  .get(getBlogs)
  .post(protect as any, createBlog as any);

// Must be declared before /:id so "mine" is matched as a route, not an ID.
router.get('/mine', protect as any, getMyBlogs as any);

router.route('/:id')
  .get(getBlogById)
  .put(protect as any, updateBlog as any)
  .delete(protect as any, deleteBlog as any);

export default router;
