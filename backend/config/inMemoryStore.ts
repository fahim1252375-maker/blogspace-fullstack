import bcrypt from 'bcryptjs';

export interface InMemoryUser {
  id: string;
  _id: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  bio: string;
  createdAt: string;
  updatedAt: string;
}

export interface InMemoryBlog {
  id: string;
  _id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  coverImage: string;
  author: string;
  authorName: string;
  authorAvatar: string;
  status: 'published' | 'draft';
  readingTime: number;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

// Initial demo users with pre-hashed passwords
const initialUsers: InMemoryUser[] = [
  {
    id: '66f1234567890abcdef12001',
    _id: '66f1234567890abcdef12001',
    name: 'Alex Mercer',
    email: 'alex@blogspace.io',
    password: bcrypt.hashSync('password123', 10),
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    bio: 'Lead Frontend Architect & Design Systems Lead. Passionate about typography, accessibility, and modern web standards.',
    createdAt: new Date('2025-10-01').toISOString(),
    updatedAt: new Date('2025-10-01').toISOString(),
  },
  {
    id: '66f1234567890abcdef12002',
    _id: '66f1234567890abcdef12002',
    name: 'Elena Rostova',
    email: 'elena@blogspace.io',
    password: bcrypt.hashSync('password123', 10),
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
    bio: 'Editorial writer exploring the intersection of creative work, cognitive psychology, and daily habits.',
    createdAt: new Date('2025-11-01').toISOString(),
    updatedAt: new Date('2025-11-01').toISOString(),
  },
];

const initialBlogs: InMemoryBlog[] = [
  {
    id: '66f1234567890abcdef13001',
    _id: '66f1234567890abcdef13001',
    title: 'Architecting Modern Web Applications Without Framework Overkill',
    slug: 'architecting-modern-web-applications-without-framework-overkill',
    description: 'Why returning to vanilla web standards, semantic HTML, and modern CSS brings unparalleled speed, maintainability, and clarity.',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    content: `## The Modern Frontend Fatigue

Over the last decade, web development has seen an explosion of complex build toolchains, hundreds of megabytes of node_modules, and framework abstractions that often solve problems many sites don't actually have.

While heavy SPA frameworks excel for massive real-time SaaS suites, many publishing platforms, editorial portals, and marketing experiences thrive when built close to the metal.

### 1. Semantic HTML Is Your Superpower
Semantic elements like <header>, <article>, <section>, <nav>, and <aside> provide built-in accessibility, seamless search engine discovery, and predictable document outlines.

### 2. CSS in 2026 Has Matured
Modern CSS now includes CSS Variables, Grid, Flexbox, and Native Nesting.

> "Simplicity is prerequisite for reliability." — Edsger W. Dijkstra`,
    author: '66f1234567890abcdef12001',
    authorName: 'Alex Mercer',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    status: 'published',
    readingTime: 4,
    views: 420,
    likes: 84,
    createdAt: new Date('2026-10-18T09:30:00.000Z').toISOString(),
    updatedAt: new Date('2026-10-18T09:30:00.000Z').toISOString(),
  },
  {
    id: '66f1234567890abcdef13002',
    _id: '66f1234567890abcdef13002',
    title: 'The Art of Editorial Typography: Building Rhythm on Digital Screens',
    slug: 'the-art-of-editorial-typography-building-rhythm-on-digital-screens',
    description: 'Exploring typographic scales, optical hierarchy, measure, and proportional leading that make long-form reading effortless.',
    category: 'Design',
    coverImage: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=1200&q=80',
    content: `## Words Are the Interface

Digital design frequently emphasizes colors, cards, and micro-interactions, yet more than 90% of user interface communication is pure written typography.

### The Sacred Measure: Line Length
The ideal line length for long-form body text is between 50 and 75 characters per line. Setting max-width: 68ch on your reading container guarantees comfortable eye movement.

### Visual Hierarchy Principles
1. Deliberate Type Scale
2. Contrast over Multiplicity
3. Vertical Rhythm`,
    author: '66f1234567890abcdef12001',
    authorName: 'Alex Mercer',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    status: 'published',
    readingTime: 3,
    views: 290,
    likes: 62,
    createdAt: new Date('2026-10-21T14:15:00.000Z').toISOString(),
    updatedAt: new Date('2026-10-21T14:15:00.000Z').toISOString(),
  },
  {
    id: '66f1234567890abcdef13003',
    _id: '66f1234567890abcdef13003',
    title: 'The Architecture of Focus: Designing a Cognitive Sanctuary for Deep Work',
    slug: 'the-architecture-of-focus-designing-a-cognitive-sanctuary-for-deep-work',
    description: 'Practical strategies to eliminate cognitive fragmentation, engineer intentional friction, and defend continuous unbroken concentration.',
    category: 'Productivity',
    coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    content: `## The Battle for Mental Bandwidth

In an era of hyper-connected communication channels, the ability to concentrate deeply without distraction is becoming increasingly rare and valuable.

### The Attention Economy Tax
Every context switch costs approximately 23 minutes of cognitive re-alignment. Protecting your morning focus blocks is the single highest leverage habit for intellectual output.`,
    author: '66f1234567890abcdef12002',
    authorName: 'Elena Rostova',
    authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
    status: 'published',
    readingTime: 5,
    views: 512,
    likes: 118,
    createdAt: new Date('2026-10-24T11:00:00.000Z').toISOString(),
    updatedAt: new Date('2026-10-24T11:00:00.000Z').toISOString(),
  },
];

export class InMemoryStore {
  private users: InMemoryUser[] = [...initialUsers];
  private blogs: InMemoryBlog[] = [...initialBlogs];

  // User operations
  async findUserByEmail(email: string): Promise<InMemoryUser | null> {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  }

  async findUserById(id: string): Promise<InMemoryUser | null> {
    return this.users.find((u) => u.id === id || u._id === id) || null;
  }

  async createUser(userData: {
    name: string;
    email: string;
    password?: string;
    avatar?: string;
    bio?: string;
  }): Promise<InMemoryUser> {
    const id = '66f' + Math.random().toString(16).substring(2, 10) + Date.now().toString(16).substring(4);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = userData.password ? await bcrypt.hash(userData.password, salt) : undefined;
    const now = new Date().toISOString();

    const newUser: InMemoryUser = {
      id,
      _id: id,
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      bio: userData.bio || 'Author on BlogSpace.',
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(newUser);
    return newUser;
  }

  // Blog operations
  async findAllBlogs(filter?: { status?: string; category?: string; author?: string }): Promise<InMemoryBlog[]> {
    let result = [...this.blogs];
    if (filter?.status) {
      result = result.filter((b) => b.status === filter.status);
    }
    if (filter?.category && filter.category !== 'All') {
      result = result.filter((b) => b.category.toLowerCase() === filter.category!.toLowerCase());
    }
    if (filter?.author) {
      result = result.filter((b) => b.author === filter.author);
    }
    // Sort descending by createdAt
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findBlogById(id: string): Promise<InMemoryBlog | null> {
    return this.blogs.find((b) => b.id === id || b._id === id) || null;
  }

  async createBlog(blogData: {
    title: string;
    description?: string;
    content: string;
    category?: string;
    coverImage?: string;
    author: string;
    authorName: string;
    authorAvatar?: string;
    status?: 'published' | 'draft';
  }): Promise<InMemoryBlog> {
    const id = '66f' + Math.random().toString(16).substring(2, 10) + Date.now().toString(16).substring(4);
    const now = new Date().toISOString();
    const slug = blogData.title
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');

    const wordCount = (blogData.content || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const newBlog: InMemoryBlog = {
      id,
      _id: id,
      title: blogData.title,
      slug,
      description: blogData.description || '',
      content: blogData.content,
      category: blogData.category || 'General',
      coverImage: blogData.coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
      author: blogData.author,
      authorName: blogData.authorName,
      authorAvatar: blogData.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      status: blogData.status || 'published',
      readingTime,
      views: 0,
      likes: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.blogs.unshift(newBlog);
    return newBlog;
  }

  async updateBlog(id: string, updates: Partial<InMemoryBlog>): Promise<InMemoryBlog | null> {
    const index = this.blogs.findIndex((b) => b.id === id || b._id === id);
    if (index === -1) return null;

    if (updates.title && !updates.slug) {
      updates.slug = updates.title
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
    }

    if (updates.content) {
      const wordCount = updates.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
      updates.readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }

    this.blogs[index] = {
      ...this.blogs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return this.blogs[index];
  }

  async deleteBlog(id: string): Promise<boolean> {
    const initialLen = this.blogs.length;
    this.blogs = this.blogs.filter((b) => b.id !== id && b._id !== id);
    return this.blogs.length < initialLen;
  }
}

export const inMemoryStore = new InMemoryStore();
