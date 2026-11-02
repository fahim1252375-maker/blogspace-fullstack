/**
 * Core business and calculation logic for BlogSpace
 * Pure functions decoupled from DOM for testing and reliability
 */

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  coverImage: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
  readingTime: number; // in minutes
  views?: number;
  likes?: number;
}

export interface DashboardStats {
  total: number;
  published: number;
  drafts: number;
  totalViews: number;
}

/**
 * Calculates estimated reading time in minutes based on average 200 words per minute
 */
export function calculateReadingTime(content: string = ''): number {
  if (!content || !content.trim()) return 1;
  // Strip HTML tags if any
  const cleanText = content.replace(/<[^>]*>/g, ' ');
  const wordCount = cleanText.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.ceil(wordCount / 200);
  return Math.max(1, minutes);
}

/**
 * Validates standard email address format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  return emailRegex.test(email.trim());
}

/**
 * Evaluates password strength and returns a numeric score (0-4) and label
 */
export function checkPasswordStrength(password: string = ''): { score: number; label: string } {
  if (!password || password.length < 6) {
    return { score: 0, label: 'Too short (min 6 chars)' };
  }
  let score = 1;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

  let label = 'Weak';
  if (score === 2) label = 'Fair';
  if (score === 3) label = 'Good';
  if (score >= 4) label = 'Strong';

  return { score, label };
}

/**
 * Converts blog title to URL slug
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Truncates text cleanly to given character limit
 */
export function truncateText(text: string = '', maxLength: number = 120): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Filters and searches posts by category, status, author, and search keyword
 */
export function filterPosts(
  posts: BlogPost[] = [],
  options: {
    query?: string;
    category?: string;
    authorId?: string;
    status?: 'published' | 'draft' | 'all';
  } = {}
): BlogPost[] {
  const { query = '', category = 'All', authorId, status = 'all' } = options;
  const cleanQuery = query.toLowerCase().trim();

  return posts.filter((post) => {
    // Filter by author if provided
    if (authorId && post.authorId !== authorId) {
      return false;
    }

    // Filter by status if not 'all'
    if (status !== 'all' && post.status !== status) {
      return false;
    }

    // Filter by category
    if (category && category !== 'All' && (post.category || '').toLowerCase() !== category.toLowerCase()) {
      return false;
    }

    // Search query matches title, description, content, author, or category
    if (cleanQuery) {
      const matchTitle = post.title?.toLowerCase().includes(cleanQuery);
      const matchDesc = post.description?.toLowerCase().includes(cleanQuery);
      const matchContent = post.content?.toLowerCase().includes(cleanQuery);
      const matchAuthor = post.authorName?.toLowerCase().includes(cleanQuery);
      const matchCat = post.category?.toLowerCase().includes(cleanQuery);
      return matchTitle || matchDesc || matchContent || matchAuthor || matchCat;
    }

    return true;
  });
}

/**
 * Calculates dashboard statistics for an author
 */
export function calculateDashboardStats(posts: BlogPost[] = [], authorId?: string): DashboardStats {
  const userPosts = authorId ? posts.filter((p) => p.authorId === authorId) : posts;
  const published = userPosts.filter((p) => p.status === 'published').length;
  const drafts = userPosts.filter((p) => p.status === 'draft').length;
  const totalViews = userPosts.reduce((sum, p) => sum + (p.views || 0), 0);

  return {
    total: userPosts.length,
    published,
    drafts,
    totalViews,
  };
}

/**
 * Strips sensitive fields (like password) from user object before persisting in session
 */
export function sanitizeUserSession<T extends Record<string, any>>(user: T | null): Omit<T, 'password'> | null {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

/**
 * Hashes password using SHA-256 with salt (works in both Node.js and Browser Web Crypto)
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  const salt = 'blogspace_v1_salt:';
  const data = new TextEncoder().encode(salt + password);

  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return 'sha256:' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for non-subtle crypto environments
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return 'hash:' + Math.abs(hash).toString(16);
}

/**
 * Verifies a plaintext password against a stored credential (hashed or legacy plaintext)
 */
export async function verifyPassword(inputPassword: string, storedCredential: string): Promise<boolean> {
  if (!inputPassword || !storedCredential) return false;
  if (storedCredential.startsWith('sha256:') || storedCredential.startsWith('hash:')) {
    const hashed = await hashPassword(inputPassword);
    return hashed === storedCredential;
  }
  // Fallback / legacy support for default demo passwords
  return inputPassword === storedCredential;
}

