import { Router } from 'express';
import {
  getBlogs,
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

router.route('/:id')
  .get(getBlogById)
  .put(protect as any, updateBlog as any)
  .delete(protect as any, deleteBlog as any);

export default router;
