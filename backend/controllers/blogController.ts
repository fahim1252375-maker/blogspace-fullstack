import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Blog } from '../models/Blog.ts';
import { isDbConnected, isInMemoryFallbackActive } from '../config/db.ts';
import { inMemoryStore } from '../config/inMemoryStore.ts';
import { AuthRequest } from '../middleware/authMiddleware.ts';

// Helper to escape special characters for safe regular expression creation (ReDoS prevention)
const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Helper to compute reading time
const computeReadingTime = (content: string): number => {
  const clean = (content || '').replace(/<[^>]*>/g, ' ');
  const words = clean.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

/**
 * @desc    Get all blogs with optional filtering & search
 * @route   GET /api/blogs
 * @access  Public
 */
export const getBlogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, category, author, search } = req.query;

    if (isDbConnected()) {
      const query: any = {};

      if (status && status !== 'all') {
        query.status = status;
      }
      if (category && category !== 'All') {
        const safeCategory = escapeRegExp(String(category).trim());
        query.category = new RegExp(`^${safeCategory}$`, 'i');
      }
      if (author && mongoose.Types.ObjectId.isValid(String(author))) {
        query.author = author;
      }
      if (search) {
        const safeSearch = escapeRegExp(String(search).trim());
        const searchRegex = new RegExp(safeSearch, 'i');
        query.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { content: searchRegex },
          { authorName: searchRegex },
        ];
      }

      const blogs = await Blog.find(query).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: blogs.length,
        data: blogs.map((b) => ({
          id: (b._id as any).toString(),
          _id: (b._id as any).toString(),
          title: b.title,
          slug: b.slug,
          description: b.description,
          content: b.content,
          category: b.category,
          coverImage: b.coverImage,
          authorId: b.author ? b.author.toString() : '',
          authorName: b.authorName,
          authorAvatar: b.authorAvatar,
          status: b.status,
          readingTime: b.readingTime,
          views: b.views,
          likes: b.likes,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        })),
      });
    } else if (isInMemoryFallbackActive()) {
      // Explicit opt-in fallback only
      let blogs = await inMemoryStore.findAllBlogs({
        status: status && status !== 'all' ? String(status) : undefined,
        category: category ? String(category) : undefined,
        author: author ? String(author) : undefined,
      });

      if (search) {
        const q = String(search).toLowerCase();
        blogs = blogs.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q) ||
            b.content.toLowerCase().includes(q) ||
            b.authorName.toLowerCase().includes(q)
        );
      }

      res.status(200).json({
        success: true,
        count: blogs.length,
        data: blogs.map((b) => ({
          ...b,
          authorId: b.author,
        })),
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Database service unavailable: MongoDB Atlas is required and not connected.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single blog by ID
 * @route   GET /api/blogs/:id
 * @access  Public
 */
export const getBlogById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: `Invalid blog ID format: '${id}'. Must be a valid 24-character hexadecimal ObjectId.`,
        });
        return;
      }

      const blog = await Blog.findById(id);

      if (!blog) {
        res.status(404).json({
          success: false,
          message: `Blog story not found with id: ${id}`,
        });
        return;
      }

      // Increment view count
      blog.views = (blog.views || 0) + 1;
      await blog.save();

      res.status(200).json({
        success: true,
        data: {
          id: (blog._id as any).toString(),
          _id: (blog._id as any).toString(),
          title: blog.title,
          slug: blog.slug,
          description: blog.description,
          content: blog.content,
          category: blog.category,
          coverImage: blog.coverImage,
          authorId: blog.author ? blog.author.toString() : '',
          authorName: blog.authorName,
          authorAvatar: blog.authorAvatar,
          status: blog.status,
          readingTime: blog.readingTime,
          views: blog.views,
          likes: blog.likes,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
        },
      });
    } else if (isInMemoryFallbackActive()) {
      // Explicit opt-in fallback only
      const blog = await inMemoryStore.findBlogById(id);

      if (!blog) {
        res.status(404).json({
          success: false,
          message: `Blog story not found with id: ${id}`,
        });
        return;
      }

      blog.views = (blog.views || 0) + 1;

      res.status(200).json({
        success: true,
        data: {
          ...blog,
          authorId: blog.author,
        },
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Database service unavailable: MongoDB Atlas is required and not connected.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new blog story
 * @route   POST /api/blogs
 * @access  Private
 */
export const createBlog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description, content, category, coverImage, status } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({
        success: false,
        message: 'Story title is required',
      });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({
        success: false,
        message: 'Story content is required',
      });
      return;
    }

    const user = req.user!;
    const readingTime = computeReadingTime(content);

    if (isDbConnected()) {
      const blog = await Blog.create({
        title: title.trim(),
        description: (description || '').trim(),
        content,
        category: category || 'General',
        coverImage:
          coverImage ||
          'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
        author: user.id,
        authorName: user.name,
        authorAvatar:
          user.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
        status: status || 'published',
        readingTime,
      });

      res.status(201).json({
        success: true,
        message: 'Blog published successfully in MongoDB',
        data: {
          id: (blog._id as any).toString(),
          _id: (blog._id as any).toString(),
          title: blog.title,
          slug: blog.slug,
          description: blog.description,
          content: blog.content,
          category: blog.category,
          coverImage: blog.coverImage,
          authorId: user.id,
          authorName: blog.authorName,
          authorAvatar: blog.authorAvatar,
          status: blog.status,
          readingTime: blog.readingTime,
          views: blog.views,
          likes: blog.likes,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
        },
      });
    } else if (isInMemoryFallbackActive()) {
      // Explicit opt-in fallback only
      const blog = await inMemoryStore.createBlog({
        title: title.trim(),
        description: (description || '').trim(),
        content,
        category: category || 'General',
        coverImage:
          coverImage ||
          'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
        author: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
        status: status || 'published',
      });

      res.status(201).json({
        success: true,
        message: 'Blog published successfully (In-memory storage active - opt-in dev only)',
        data: {
          ...blog,
          authorId: user.id,
        },
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Database service unavailable: MongoDB Atlas is required and not connected.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing blog story
 * @route   PUT /api/blogs/:id
 * @access  Private
 */
export const updateBlog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, content, category, coverImage, status } = req.body;
    const currentUser = req.user!;

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: `Invalid blog ID format: '${id}'. Must be a valid 24-character hexadecimal ObjectId.`,
        });
        return;
      }

      const blog = await Blog.findById(id);

      if (!blog) {
        res.status(404).json({
          success: false,
          message: `Blog story not found with id: ${id}`,
        });
        return;
      }

      // Check authorization: must be author
      if (blog.author.toString() !== currentUser.id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to update another user’s story',
        });
        return;
      }

      if (title) blog.title = title.trim();
      if (description !== undefined) blog.description = description.trim();
      if (content) {
        blog.content = content;
        blog.readingTime = computeReadingTime(content);
      }
      if (category) blog.category = category;
      if (coverImage) blog.coverImage = coverImage;
      if (status) blog.status = status;

      await blog.save();

      res.status(200).json({
        success: true,
        message: 'Story updated successfully in MongoDB',
        data: {
          id: (blog._id as any).toString(),
          _id: (blog._id as any).toString(),
          title: blog.title,
          slug: blog.slug,
          description: blog.description,
          content: blog.content,
          category: blog.category,
          coverImage: blog.coverImage,
          authorId: blog.author.toString(),
          authorName: blog.authorName,
          authorAvatar: blog.authorAvatar,
          status: blog.status,
          readingTime: blog.readingTime,
          views: blog.views,
          likes: blog.likes,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
        },
      });
    } else if (isInMemoryFallbackActive()) {
      // Explicit opt-in fallback only
      const blog = await inMemoryStore.findBlogById(id);

      if (!blog) {
        res.status(404).json({
          success: false,
          message: `Blog story not found with id: ${id}`,
        });
        return;
      }

      // Check author ownership
      if (blog.author !== currentUser.id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to update another user’s story',
        });
        return;
      }

      const updated = await inMemoryStore.updateBlog(id, {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(content && { content }),
        ...(category && { category }),
        ...(coverImage && { coverImage }),
        ...(status && { status }),
      });

      res.status(200).json({
        success: true,
        message: 'Story updated successfully (In-memory storage active - opt-in dev only)',
        data: {
          ...updated!,
          authorId: blog.author,
        },
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Database service unavailable: MongoDB Atlas is required and not connected.',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a blog story
 * @route   DELETE /api/blogs/:id
 * @access  Private
 */
export const deleteBlog = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (isDbConnected()) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          message: `Invalid blog ID format: '${id}'. Must be a valid 24-character hexadecimal ObjectId.`,
        });
        return;
      }

      const blog = await Blog.findById(id);

      if (!blog) {
        res.status(404).json({
          success: false,
          message: `Blog story not found with id: ${id}`,
        });
        return;
      }

      // Check author ownership
      if (blog.author.toString() !== currentUser.id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to delete another user’s story',
        });
        return;
      }

      await Blog.findByIdAndDelete(id);

      res.status(200).json({
        success: true,
        message: 'Story deleted successfully from MongoDB',
      });
    } else if (isInMemoryFallbackActive()) {
      // Explicit opt-in fallback only
      const blog = await inMemoryStore.findBlogById(id);

      if (!blog) {
        res.status(404).json({
          success: false,
          message: `Blog story not found with id: ${id}`,
        });
        return;
      }

      if (blog.author !== currentUser.id) {
        res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to delete another user’s story',
        });
        return;
      }

      await inMemoryStore.deleteBlog(id);

      res.status(200).json({
        success: true,
        message: 'Story deleted successfully (In-memory storage active - opt-in dev only)',
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Database service unavailable: MongoDB Atlas is required and not connected.',
      });
    }
  } catch (error) {
    next(error);
  }
};
