/**
 * BlogSpace - Core Data & Storage Management
 * Handles LocalStorage persistence, seed data initialization,
 * post CRUD operations, and cross-page utility functions.
 */

// Storage Keys
export const STORAGE_KEYS = {
  POSTS: 'blogspace_posts',
  MY_POSTS: 'blogspace_my_posts',
  USERS: 'blogspace_users',
  CURRENT_USER: 'blogspace_current_user',
  TOKEN: 'blogspace_token',
  LIKES: 'blogspace_likes',
};

/**
 * Auth token management helpers
 */
export function getAuthToken() {
  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN)
      || sessionStorage.getItem(STORAGE_KEYS.TOKEN)
      || '';
  } catch (e) {
    return '';
  }
}

// Keep sessions in the current tab by default. "Remember me" opts into persistence.
export function setAuthToken(token, rememberMe = false) {
  try {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
    if (token) {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(STORAGE_KEYS.TOKEN, token);
    }
  } catch (e) {
    console.error('Failed to set auth token:', e);
  }
}

export function removeAuthToken() {
  try {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.TOKEN);
  } catch (e) {}
}

/**
 * Synchronize public, published articles from the backend REST API.
 * Drafts are intentionally excluded from this public endpoint.
 */
export async function syncPostsFromApi() {
  try {
    const res = await fetch('/api/blogs');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(json.data));
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[BlogSpace] Using cached public posts from LocalStorage:', err);
  }
  return getAllPosts();
}

/**
 * Synchronize all posts belonging to the signed-in author, including drafts.
 * The backend verifies the JWT and only returns posts owned by that user.
 */
export async function syncMyPostsFromApi() {
  const token = getAuthToken();
  if (!token) throw new Error('Please sign in to load your articles.');

  const res = await fetch('/api/blogs/mine', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success || !Array.isArray(json.data)) {
    throw new Error(json.message || `Unable to load your posts (${res.status})`);
  }

  // Keep private author data separate from the public article cache.
  localStorage.setItem(STORAGE_KEYS.MY_POSTS, JSON.stringify(json.data));
  return json.data;
}

// Default seed users
export const DEFAULT_USERS = [
  {
    id: 'user-alex',
    name: 'Alex Mercer',
    email: 'alex@blogspace.io',
    password: 'password123', // Demo purpose only
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    bio: 'Lead Frontend Architect & Design Systems Lead. Passionate about typography, accessibility, and modern web standards.',
    joinedDate: 'October 2025',
  },
  {
    id: 'user-elena',
    name: 'Elena Rostova',
    email: 'elena@blogspace.io',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
    bio: 'Editorial writer exploring the intersection of creative work, cognitive psychology, and daily habits.',
    joinedDate: 'November 2025',
  },
];

// Rich default seed articles
export const DEFAULT_POSTS = [
  {
    id: 'post-1',
    title: 'Architecting Modern Web Applications Without Framework Overkill',
    slug: 'architecting-modern-web-applications-without-framework-overkill',
    description: 'Why returning to vanilla web standards, semantic HTML, and modern CSS brings unparalleled speed, maintainability, and clarity.',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80',
    content: `## The Modern Frontend Fatigue

Over the last decade, web development has seen an explosion of complex build toolchains, hundreds of megabytes of \`node_modules\`, and framework abstractions that often solve problems many sites don't actually have. 

While heavy SPA frameworks excel for massive real-time SaaS suites, many publishing platforms, editorial portals, and marketing experiences thrive when built close to the metal.

### 1. Semantic HTML Is Your Superpower
Semantic elements like \`<header>\`, \`<article>\`, \`<section>\`, \`<nav>\`, and \`<aside>\` provide built-in accessibility, seamless search engine discovery, and predictable document outlines. Screen readers parse native landmarks instantly without requiring fragile ARIA overlays.

### 2. CSS in 2026 Has Matured
Modern CSS now includes:
- **CSS Custom Properties (Variables):** Dynamic runtime theming without recompiling.
- **CSS Grid & Flexbox:** Robust 2D and 1D layout engines with zero layout shifts.
- **Native Nesting & Subgrid:** Cleaner component styles with high readability.
- **Scroll-driven Animations & Transitions:** Native 60fps animations handled off the main JS thread.

### 3. Sustainable Performance
When an application delivers clean semantic HTML and standard CSS, your First Contentful Paint drops under 100ms. Users on mobile devices with constrained cellular connections will experience instant page loads.

> "Simplicity is prerequisite for reliability." — Edsger W. Dijkstra

By mastering browser fundamentals before reaching for abstractions, developers build more resilient, accessible, and enduring digital products.`,
    authorId: 'user-alex',
    authorName: 'Alex Mercer',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    status: 'published',
    createdAt: '2026-10-18T09:30:00.000Z',
    updatedAt: '2026-10-18T09:30:00.000Z',
    readingTime: 4,
    views: 420,
    likes: 84,
  },
  {
    id: 'post-2',
    title: 'The Art of Editorial Typography: Building Rhythm on Digital Screens',
    slug: 'the-art-of-editorial-typography-building-rhythm-on-digital-screens',
    description: 'Exploring typographic scales, optical hierarchy, measure, and proportional leading that make long-form reading effortless.',
    category: 'Design',
    coverImage: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=1200&q=80',
    content: `## Words Are the Interface

Digital design frequently emphasizes colors, cards, and micro-interactions, yet more than 90% of user interface communication is pure written typography. When typography fails, cognitive friction immediately mounts.

### The Sacred Measure: Line Length
The ideal line length for long-form body text is between 50 and 75 characters per line (including spaces). In CSS, setting \`max-width: 68ch;\` on your reading container guarantees comfortable eye movement without the reader losing their place between lines.

### Proportional Line-Height
Body copy requires adequate breathing space. A line-height between \`1.6\` and \`1.75\` provides comfortable optical channels between lines. Conversely, display headings should tighten down to \`1.1\` to \`1.25\` to keep phrase clusters cohesive.

### Visual Hierarchy Principles
1. **Deliberate Type Scale:** Adopt a musical scale like Major Third (1.25) or Perfect Fourth (1.333).
2. **Contrast over Multiplicity:** Rather than introducing four different typefaces, combine regular, medium, and semi-bold weights of a single robust grotesque or humanist font.
3. **Vertical Rhythm:** Ensure paragraph margins and headings sit on a consistent base metric (e.g. 4px / 8px grid).`,
    authorId: 'user-alex',
    authorName: 'Alex Mercer',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    status: 'published',
    createdAt: '2026-10-22T14:15:00.000Z',
    updatedAt: '2026-10-22T14:15:00.000Z',
    readingTime: 3,
    views: 310,
    likes: 56,
  },
  {
    id: 'post-3',
    title: 'Designing Deep Work Rituals for Knowledge Workers and Creators',
    slug: 'designing-deep-work-rituals-for-knowledge-workers-and-creators',
    description: 'Actionable strategies for cultivating intense cognitive focus, eliminating micro-distractions, and protecting creative flow.',
    category: 'Productivity',
    coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    content: `## The Cost of Context Switching

Every notification, chat ping, or casual inbox refresh incurs an invisible cognitive tax known as *attention residue*. Research shows it takes up to 23 minutes to fully regain deep immersion after a single brief interruption.

### Defining Your Focus Sanctuary
1. **Asynchronous Defaults:** Agree with collaborators that immediate responses are reserved only for genuine system outages.
2. **Time-Blocked Deep Intervals:** Two uninterrupted 90-minute morning blocks will routinely yield more meaningful output than an entire day of fragmented task-switching.
3. **Friction-Rich Distractions:** Place distracting tabs, social feeds, and mobile devices in another physical space or behind deliberate barriers.

> "Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time." — Cal Newport`,
    authorId: 'user-elena',
    authorName: 'Elena Rostova',
    authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
    status: 'published',
    createdAt: '2026-10-25T11:00:00.000Z',
    updatedAt: '2026-10-25T11:00:00.000Z',
    readingTime: 4,
    views: 580,
    likes: 112,
  },
  {
    id: 'post-4',
    title: 'The Evolution of Independent Online Publishing and Creator Economy',
    slug: 'the-evolution-of-independent-online-publishing-and-creator-economy',
    description: 'How writers are reclaiming audience ownership through direct reader relationships, open web protocols, and authentic voices.',
    category: 'Culture',
    coverImage: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=1200&q=80',
    content: `## Reclaiming the Digital Printing Press

For nearly two decades, content creators surrendered their direct relationship with audiences to algorithmically mediated social feeds. Today, a powerful resurgence is underway: the return of thoughtful, long-form, reader-supported publications.

### Why Direct Relationships Matter
Algorithms prioritize controversy, velocity, and emotional agitation. In contrast, thoughtful editorial publications cultivate depth, nuance, and trust.

When readers subscribe directly to a writer's work:
- The writer is incentivized to research deeply and write truthfully.
- Readers receive curated, high-signal knowledge without algorithmic ad interruptions.
- The open web remains decentralised, vibrant, and democratic.`,
    authorId: 'user-elena',
    authorName: 'Elena Rostova',
    authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
    status: 'published',
    createdAt: '2026-10-27T16:20:00.000Z',
    updatedAt: '2026-10-27T16:20:00.000Z',
    readingTime: 3,
    views: 290,
    likes: 47,
  },
  {
    id: 'post-5',
    title: 'Building Sustainable Digital Products: Principles for Bootstrapped Founders',
    slug: 'building-sustainable-digital-products-principles-for-bootstrapped-founders',
    description: 'Essential lessons on product-market validation, customer-funded growth, and maintaining high software quality with small teams.',
    category: 'Business',
    coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    content: `## The Lean Value Proposition

Too many software projects fail not because they couldn't write the code, but because they built complex solutions for problems people weren't willing to pay for.

### 3 Pillars of Bootstrapped Discipline
1. **Solve an Expensive Headache:** Focus on specific operational bottlenecks that save businesses quantifiable hours or direct capital.
2. **Charge from Day Zero:** Early payment is the only genuine validation of product value.
3. **Simplicity as a Competitive Edge:** Giant enterprise competitors are burdened with legacy code and bloated menus. A focused product that does one critical workflow flawlessly will win devoted customers.`,
    authorId: 'user-alex',
    authorName: 'Alex Mercer',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
    status: 'published',
    createdAt: '2026-10-29T10:00:00.000Z',
    updatedAt: '2026-10-29T10:00:00.000Z',
    readingTime: 4,
    views: 410,
    likes: 63,
  },
  {
    id: 'post-6',
    title: 'Minimalist Workspaces: Curating an Environment for Calm and Clarity',
    slug: 'minimalist-workspaces-curating-an-environment-for-calm-and-clarity',
    description: 'How reducing physical clutter, optimizing ambient lighting, and choosing mindful tools transforms your creative output.',
    category: 'Lifestyle',
    coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    content: `## Physical Space Shapes Mental Space

Our surroundings subtly dictate our internal state. When your desk is strewn with loose papers, tangled cords, and visual chaos, your brain constantly processes background stimuli.

### Practical Workspace Principles
- **One Active Project on the Desk:** Keep only the tools required for the task in front of you.
- **Natural Indirect Light:** Position your desk perpendicular to a window to reduce glare while benefiting from circadian alertness.
- **Biophilic Elements:** A single hardy plant (such as a snake plant or pothos) enhances air humidity and introduces natural geometry into a digital setup.`,
    authorId: 'user-elena',
    authorName: 'Elena Rostova',
    authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
    status: 'draft',
    createdAt: '2026-10-30T15:45:00.000Z',
    updatedAt: '2026-10-30T15:45:00.000Z',
    readingTime: 3,
    views: 0,
    likes: 0,
  },
];

/**
 * Initialize storage with default users and posts if not already present
 */
export function initStorage() {
  try {
    if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(DEFAULT_POSTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
    }
    // Note: Guests remain guests until they explicitly sign in or choose demo mode.
    if (!localStorage.getItem(STORAGE_KEYS.LIKES)) {
      localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify([]));
    }
  } catch (e) {
    console.error('LocalStorage initialization error:', e);
  }
}

/**
 * Reset posts to default seed data
 */
export function resetSeedData() {
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(DEFAULT_POSTS));
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  showToast('Sample posts restored successfully!', 'success');
}

/**
 * Retrieve all posts
 */
export function getAllPosts() {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!raw) return DEFAULT_POSTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_POSTS;
  } catch (e) {
    console.error('Failed to parse posts from LocalStorage:', e);
    return DEFAULT_POSTS;
  }
}

/**
 * Retrieve the authenticated user's cached posts. Never use the public cache
 * for private dashboard or editor data.
 */
export function getMyPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MY_POSTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse private posts from LocalStorage:', e);
    return [];
  }
}

/**
 * Retrieve a single public post by ID.
 */
export function getPostById(id) {
  if (!id) return null;
  return getAllPosts().find((p) => p && (p.id === id || p._id === id)) || null;
}

/**
 * Retrieve a single post from the authenticated user's private cache.
 */
export function getMyPostById(id) {
  if (!id) return null;
  return getMyPosts().find((p) => p && (p.id === id || p._id === id)) || null;
}

/**
 * Calculate reading time in minutes
 */
export function calculateReadingTime(text = '') {
  if (!text || !text.trim()) return 1;
  const clean = text.replace(/<[^>]*>/g, ' ');
  const wordCount = clean.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

/**
 * Generate URL slug from title
 */
export function slugify(text) {
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
 * Save (create or update) a post — Synchronizes with Backend REST API and LocalStorage
 */
export async function savePost(postData) {
  const token = getAuthToken();
  if (!token) throw new Error('Please sign in before creating or editing a story.');

  const isUpdate = Boolean(postData.id);
  const url = isUpdate ? `/api/blogs/${postData.id}` : '/api/blogs';
  const method = isUpdate ? 'PUT' : 'POST';
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: postData.title,
      description: postData.description,
      content: postData.content,
      category: postData.category,
      coverImage: postData.coverImage,
      status: postData.status,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success || !data.data) {
    throw new Error(data.message || `Unable to save story (${response.status}).`);
  }

  const posts = getMyPosts();
  if (isUpdate) {
    const index = posts.findIndex((post) => post.id === postData.id || post._id === postData.id);
    if (index !== -1) posts[index] = data.data;
    else posts.unshift(data.data);
  } else {
    posts.unshift(data.data);
  }
  localStorage.setItem(STORAGE_KEYS.MY_POSTS, JSON.stringify(posts));
  return data.data;
}

/**
 * Delete a post by ID — Synchronizes with Backend REST API and LocalStorage
 */
export async function deletePost(id) {
  const token = getAuthToken();
  if (!token) throw new Error('Please sign in before deleting a story.');

  const response = await fetch(`/api/blogs/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.message || `Unable to delete story (${response.status}).`);
  }

  const posts = getMyPosts().filter((post) => post.id !== id && post._id !== id);
  localStorage.setItem(STORAGE_KEYS.MY_POSTS, JSON.stringify(posts));
  return true;
}

/**
 * Toggle post status between published and draft — Synchronizes with Backend REST API
 */
export async function togglePostStatus(id) {
  const token = getAuthToken();
  if (!token) throw new Error('Please sign in before changing a story.');

  const posts = getMyPosts();
  const post = posts.find((item) => item.id === id || item._id === id);
  if (!post) return null;

  const nextStatus = post.status === 'published' ? 'draft' : 'published';
  const response = await fetch(`/api/blogs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status: nextStatus }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success || !data.data) {
    throw new Error(data.message || `Unable to update story (${response.status}).`);
  }

  const index = posts.findIndex((item) => item.id === id || item._id === id);
  if (index !== -1) posts[index] = data.data;
  localStorage.setItem(STORAGE_KEYS.MY_POSTS, JSON.stringify(posts));
  return data.data;
}

/**
 * Toggle like for a post
 */
export function toggleLike(postId) {
  if (!postId) return { liked: false, count: 0 };
  let likes = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LIKES);
    const parsed = raw ? JSON.parse(raw) : [];
    likes = Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    likes = [];
  }

  const posts = getAllPosts();
  const post = posts.find((p) => p && p.id === postId);
  if (!post) return { liked: false, count: 0 };

  const alreadyLiked = likes.includes(postId);
  if (alreadyLiked) {
    likes = likes.filter((id) => id !== postId);
    post.likes = Math.max(0, (post.likes || 1) - 1);
  } else {
    likes.push(postId);
    post.likes = (post.likes || 0) + 1;
  }

  localStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(likes));
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
  return { liked: !alreadyLiked, count: post.likes };
}

/**
 * Check if a post is liked by current user
 */
export function isPostLiked(postId) {
  if (!postId) return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LIKES);
    const likes = raw ? JSON.parse(raw) : [];
    return Array.isArray(likes) ? likes.includes(postId) : false;
  } catch (e) {
    return false;
  }
}

/**
 * Increment view count
 */
export function incrementPostViews(postId) {
  const posts = getAllPosts();
  const post = posts.find((p) => p.id === postId);
  if (post) {
    post.views = (post.views || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    return post.views;
  }
  return 0;
}

/**
 * Get current logged in user
 */
export function getCurrentUser() {
  initStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * Verify the saved JWT with the backend and refresh the local profile.
 * A cached LocalStorage user alone is never treated as an authenticated session.
 */
export async function getAuthenticatedUser() {
  const token = getAuthToken();
  if (!token) {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.MY_POSTS);
    return null;
  }

  const response = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401 || response.status === 403) {
    removeAuthToken();
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.MY_POSTS);
    return null;
  }
  if (!response.ok || !data.success || !data.user) {
    throw new Error(data.message || 'Unable to verify your session.');
  }

  const previousUser = getCurrentUser();
  if (previousUser?.id && previousUser.id !== data.user.id) {
    localStorage.removeItem(STORAGE_KEYS.MY_POSTS);
  }
  setCurrentUser(data.user);
  return data.user;
}

/**
 * Hashes password using SHA-256 with salt for secure storage
 */
export async function hashPassword(password) {
  if (!password) return '';
  const salt = 'blogspace_v1_salt:';
  const data = new TextEncoder().encode(salt + password);

  if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return 'sha256:' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('Crypto subtle digest error, using fallback:', e);
    }
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
 * Verifies a plaintext password against a stored credential (hashed or legacy demo plaintext)
 */
export async function verifyPassword(inputPassword, storedCredential) {
  if (!inputPassword || !storedCredential) return false;
  if (storedCredential.startsWith('sha256:') || storedCredential.startsWith('hash:')) {
    const hashed = await hashPassword(inputPassword);
    return hashed === storedCredential;
  }
  // Legacy demo password verification
  return inputPassword === storedCredential;
}

/**
 * Set current logged in user (sanitizes user to never persist password in session)
 */
export function setCurrentUser(user) {
  if (!user) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.MY_POSTS);
    return;
  }

  let previousUser = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    previousUser = raw ? JSON.parse(raw) : null;
  } catch (e) {
    previousUser = null;
  }

  // Never carry one author's private cached articles into another account.
  if (previousUser?.id && user.id && previousUser.id !== user.id) {
    localStorage.removeItem(STORAGE_KEYS.MY_POSTS);
  }

  const { password, ...safeUser } = user;
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
}

/**
 * Logout current user
 */
export function logoutUser() {
  removeAuthToken();
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.MY_POSTS);
  showToast('You have been logged out.', 'info');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 600);
}

/**
 * Format ISO date string into readable format (e.g. Oct 24, 2026)
 */
export function formatDate(dateString) {
  if (!dateString) return 'Recently';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return 'Recently';
  }
}

/**
 * Toast notification system
 */
export function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" aria-label="Close notification">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 250);
  });

  container.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 250);
    }
  }, duration);
}

/**
 * Basic HTML escaping helper to prevent XSS
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Updates dynamic header auth controls across all pages
 */
export function updateNavAuthUI() {
  const authNavContainer = document.getElementById('nav-auth-container');
  if (!authNavContainer) return;

  const currentUser = getCurrentUser();

  if (currentUser) {
    authNavContainer.innerHTML = `
      <div class="user-menu-dropdown">
        <a href="create-blog.html" class="btn btn-sm btn-primary nav-write-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span>Write</span>
        </a>
        <div class="user-badge" id="user-badge-btn" tabindex="0" role="button" aria-haspopup="true" aria-expanded="false">
          <img src="${currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80'}" alt="${escapeHtml(currentUser.name)}" class="user-avatar-sm" />
          <span class="user-name-text">${escapeHtml(currentUser.name.split(' ')[0])}</span>
          <svg class="chevron-down-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="dropdown-menu" id="user-dropdown-menu">
          <div class="dropdown-header">
            <span class="dropdown-user-name">${escapeHtml(currentUser.name)}</span>
            <span class="dropdown-user-email">${escapeHtml(currentUser.email)}</span>
          </div>
          <div class="dropdown-divider"></div>
          <a href="dashboard.html" class="dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
            <span>Author Dashboard</span>
          </a>
          <a href="create-blog.html" class="dropdown-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            <span>Create New Story</span>
          </a>
          <div class="dropdown-divider"></div>
          <button type="button" class="dropdown-item text-danger" id="nav-logout-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    `;

    const badge = document.getElementById('user-badge-btn');
    const menu = document.getElementById('user-dropdown-menu');
    if (badge && menu) {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.toggle('show');
        badge.setAttribute('aria-expanded', String(isOpen));
      });

      document.addEventListener('click', () => {
        menu.classList.remove('show');
        badge.setAttribute('aria-expanded', 'false');
      });
    }

    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        logoutUser();
      });
    }
  } else {
    authNavContainer.innerHTML = `
      <div class="guest-nav-actions">
        <a href="login.html" class="btn btn-outline btn-sm">Log In</a>
        <a href="register.html" class="btn btn-primary btn-sm">Get Started</a>
      </div>
    `;
  }
}

/**
 * Image presets for quick cover image selection in the editor
 */
export const IMAGE_PRESETS = [
  { label: 'Technology', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Design', url: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Workspace', url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Minimal', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Books/Culture', url: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Strategy', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80' },
];

/**
 * Initialize Blog Editor (Create & Edit Mode)
 */
export async function initBlogEditor() {
  initStorage();

  let currentUser = null;
  try {
    currentUser = await getAuthenticatedUser();
  } catch (error) {
    console.error('[BlogSpace Editor] Session verification failed:', error);
    showToast('Unable to verify your session. Please sign in again.', 'error');
    window.location.replace('login.html');
    return;
  }

  if (!currentUser) {
    updateNavAuthUI();
    showToast('Please sign in to write or edit stories.', 'warning');
    window.location.replace('login.html');
    return;
  }

  updateNavAuthUI();
  try {
    await syncMyPostsFromApi();
  } catch (error) {
    console.error('[BlogSpace Editor] Unable to load your articles:', error);
    showToast('Your articles could not be loaded. Please refresh and try again.', 'error');
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id');

  const form = document.getElementById('blog-editor-form');
  const titleInput = document.getElementById('blog-title');
  const descInput = document.getElementById('blog-description');
  const categorySelect = document.getElementById('blog-category');
  const coverUrlInput = document.getElementById('blog-cover-url');
  const imagePreview = document.getElementById('cover-preview-img');
  const imagePreviewContainer = document.getElementById('cover-preview-container');
  const contentTextarea = document.getElementById('blog-content');
  const previewTabBtn = document.getElementById('editor-tab-preview');
  const writeTabBtn = document.getElementById('editor-tab-write');
  const previewContainer = document.getElementById('editor-live-preview');
  const wordCountEl = document.getElementById('editor-word-count');
  const readTimeEl = document.getElementById('editor-reading-time');
  const saveDraftBtn = document.getElementById('save-draft-btn');
  const publishBtn = document.getElementById('publish-blog-btn');
  const cancelBtn = document.getElementById('cancel-edit-btn');
  const pageHeading = document.getElementById('editor-page-heading');
  const pageSubheading = document.getElementById('editor-page-subheading');

  let currentPost = null;

  // Load existing post if editing
  if (editId) {
    currentPost = getMyPostById(editId);
    if (currentPost) {
      // Author ownership check
      if (currentPost.authorId && currentPost.authorId !== currentUser.id) {
        showToast('You can only edit stories that you authored.', 'warning');
        setTimeout(() => (window.location.href = 'dashboard.html'), 1200);
        return;
      }

      if (pageHeading) pageHeading.textContent = 'Edit Story';
      if (pageSubheading) pageSubheading.textContent = 'Refine and polish your published or draft story.';
      if (titleInput) titleInput.value = currentPost.title;
      if (descInput) descInput.value = currentPost.description;
      if (categorySelect) categorySelect.value = currentPost.category;
      if (coverUrlInput) coverUrlInput.value = currentPost.coverImage;
      if (contentTextarea) contentTextarea.value = currentPost.content;
      if (publishBtn) {
        publishBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          <span>Update & Publish</span>
        `;
      }
      updateImagePreview(currentPost.coverImage);
      updateStats();
    } else {
      showToast('Article not found for editing. Starting a new article.', 'warning');
    }
  }

  // Cover image update handler
  function updateImagePreview(url) {
    if (!url || !imagePreview || !imagePreviewContainer) return;
    imagePreview.src = url;
    imagePreviewContainer.classList.remove('hidden');
    imagePreview.onerror = () => {
      imagePreview.src = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80';
    };
  }

  coverUrlInput?.addEventListener('input', (e) => {
    updateImagePreview(e.target.value.trim());
  });

  // Preset Image chips
  const presetsContainer = document.getElementById('cover-presets-list');
  if (presetsContainer) {
    presetsContainer.innerHTML = IMAGE_PRESETS.map(
      (p) => `<button type="button" class="preset-chip" data-url="${p.url}">${p.label}</button>`
    ).join('');

    presetsContainer.querySelectorAll('.preset-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const url = chip.getAttribute('data-url');
        if (url && coverUrlInput) {
          coverUrlInput.value = url;
          updateImagePreview(url);
          showToast(`Preset "${chip.textContent}" applied!`, 'info', 2000);
        }
      });
    });
  }

  // Live word count and reading time
  function updateStats() {
    const text = contentTextarea?.value || '';
    const clean = text.replace(/<[^>]*>/g, ' ');
    const words = clean.trim().split(/\s+/).filter(Boolean).length;
    const minutes = calculateReadingTime(text);

    if (wordCountEl) wordCountEl.textContent = `${words} word${words === 1 ? '' : 's'}`;
    if (readTimeEl) readTimeEl.textContent = `~${minutes} min read`;
  }

  contentTextarea?.addEventListener('input', updateStats);

  // Formatting Toolbar
  const formatButtons = document.querySelectorAll('.toolbar-btn');
  formatButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const format = btn.getAttribute('data-format');
      applyFormatting(format);
    });
  });

  function applyFormatting(format) {
    if (!contentTextarea) return;
    const start = contentTextarea.selectionStart;
    const end = contentTextarea.selectionEnd;
    const text = contentTextarea.value;
    const selected = text.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`;
        cursorOffset = selected ? replacement.length : 2;
        break;
      case 'italic':
        replacement = `*${selected || 'italic text'}*`;
        cursorOffset = selected ? replacement.length : 1;
        break;
      case 'h2':
        replacement = `\n## ${selected || 'Heading 2'}\n`;
        cursorOffset = replacement.length;
        break;
      case 'h3':
        replacement = `\n### ${selected || 'Heading 3'}\n`;
        cursorOffset = replacement.length;
        break;
      case 'quote':
        replacement = `\n> ${selected || 'Meaningful quotation...'}\n`;
        cursorOffset = replacement.length;
        break;
      case 'ul':
        replacement = `\n- ${selected || 'List item'}\n`;
        cursorOffset = replacement.length;
        break;
      case 'code':
        replacement = `\`${selected || 'code snippet'}\``;
        cursorOffset = selected ? replacement.length : 1;
        break;
      default:
        return;
    }

    contentTextarea.setRangeText(replacement, start, end, 'end');
    contentTextarea.focus();
    updateStats();
  }

  // Edit / Live Preview Tabs
  if (previewTabBtn && writeTabBtn && previewContainer && contentTextarea) {
    previewTabBtn.addEventListener('click', () => {
      previewTabBtn.classList.add('active');
      writeTabBtn.classList.remove('active');
      contentTextarea.classList.add('hidden');
      previewContainer.classList.remove('hidden');

      // Render markdown preview
      const content = contentTextarea.value || '*No content yet. Switch to write mode to start writing.*';
      const formatted = content
        .split('\n\n')
        .map((block) => {
          const t = block.trim();
          if (t.startsWith('## ')) return `<h2>${escapeHtml(t.replace('## ', ''))}</h2>`;
          if (t.startsWith('### ')) return `<h3>${escapeHtml(t.replace('### ', ''))}</h3>`;
          if (t.startsWith('> ')) return `<blockquote>${escapeHtml(t.replace('> ', ''))}</blockquote>`;
          if (t.startsWith('- ')) {
            const lis = t.split('\n').map((li) => `<li>${escapeHtml(li.replace(/^-\s*/, ''))}</li>`).join('');
            return `<ul>${lis}</ul>`;
          }
          return `<p>${escapeHtml(t)}</p>`;
        })
        .join('');

      previewContainer.innerHTML = `
        <div class="live-preview-box">
          <h1 class="preview-title">${escapeHtml(titleInput?.value || 'Untitled Story')}</h1>
          <p class="preview-lead">${escapeHtml(descInput?.value || '')}</p>
          <div class="preview-body">${formatted}</div>
        </div>
      `;
    });

    writeTabBtn.addEventListener('click', () => {
      writeTabBtn.classList.add('active');
      previewTabBtn.classList.remove('active');
      previewContainer.classList.add('hidden');
      contentTextarea.classList.remove('hidden');
      contentTextarea.focus();
    });
  }

  // Validation & Save Handler
  async function handleSave(status) {
    const title = titleInput?.value.trim() || '';
    const description = descInput?.value.trim() || '';
    const category = categorySelect?.value || 'Technology';
    const coverImage = coverUrlInput?.value.trim() || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80';
    const content = contentTextarea?.value.trim() || '';

    // Validation
    if (!title || title.length < 5) {
      showToast('Please enter an engaging story title (at least 5 characters).', 'warning');
      titleInput?.focus();
      return;
    }

    if (!description || description.length < 10) {
      showToast('Please provide a short excerpt or summary (at least 10 characters).', 'warning');
      descInput?.focus();
      return;
    }

    if (!category) {
      showToast('Please select a category.', 'warning');
      categorySelect?.focus();
      return;
    }

    if (!content || content.length < 20) {
      showToast('Story content is too short. Please write at least a couple of paragraphs.', 'warning');
      contentTextarea?.focus();
      return;
    }

    const postPayload = {
      id: currentPost ? currentPost.id : undefined,
      title,
      description,
      category,
      coverImage,
      content,
      status, // 'published' or 'draft'
    };

    if (publishBtn) publishBtn.disabled = true;
    if (saveDraftBtn) saveDraftBtn.disabled = true;

    try {
      await savePost(postPayload);
      const msg = status === 'published' ? 'Story published successfully!' : 'Draft saved successfully!';
      showToast(msg, 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 700);
    } catch (err) {
      if (publishBtn) publishBtn.disabled = false;
      if (saveDraftBtn) saveDraftBtn.disabled = false;
      showToast('Failed to save story. Please try again.', 'error');
    }
  }

  // Publish button click
  publishBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    handleSave('published');
  });

  // Save Draft button click
  saveDraftBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    handleSave('draft');
  });

  // Cancel button
  cancelBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'dashboard.html';
  });
}

