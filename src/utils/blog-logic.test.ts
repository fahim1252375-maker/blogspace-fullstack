import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateReadingTime,
  validateEmail,
  checkPasswordStrength,
  slugify,
  truncateText,
  filterPosts,
  calculateDashboardStats,
  sanitizeUserSession,
  hashPassword,
  verifyPassword,
  BlogPost,
} from './blog-logic';

test('calculateReadingTime handles empty, short and long content', () => {
  assert.equal(calculateReadingTime(''), 1);
  assert.equal(calculateReadingTime('Hello world!'), 1);

  // 400 words should be 2 minutes
  const words400 = new Array(400).fill('word').join(' ');
  assert.equal(calculateReadingTime(words400), 2);

  // 650 words should be 4 minutes (Math.ceil(650 / 200) = 4)
  const words650 = new Array(650).fill('content').join(' ');
  assert.equal(calculateReadingTime(words650), 4);
});

test('validateEmail correctly validates email formats', () => {
  assert.equal(validateEmail('test@example.com'), true);
  assert.equal(validateEmail('alex.developer@blogspace.io'), true);
  assert.equal(validateEmail('invalid-email'), false);
  assert.equal(validateEmail('test@'), false);
  assert.equal(validateEmail(''), false);
});

test('checkPasswordStrength computes score and labels', () => {
  assert.equal(checkPasswordStrength('').score, 0);
  assert.equal(checkPasswordStrength('12345').score, 0); // < 6 chars
  assert.equal(checkPasswordStrength('abcdef').score >= 1, true);
  const strong = checkPasswordStrength('MyStr0ng!Pass');
  assert.equal(strong.score >= 4, true);
  assert.equal(strong.label, 'Strong');
});

test('slugify transforms strings to clean slugs', () => {
  assert.equal(slugify('The Future of Web Design in 2026!'), 'the-future-of-web-design-in-2026');
  assert.equal(slugify('  Spaced  Out  Title  '), 'spaced-out-title');
});

test('truncateText truncates text and appends ellipsis', () => {
  assert.equal(truncateText('Short text', 20), 'Short text');
  assert.equal(truncateText('This is a longer text that needs to be truncated', 15), 'This is a longe...');
});

const mockPosts: BlogPost[] = [
  {
    id: 'post-1',
    title: 'Modern CSS Architectures',
    slug: 'modern-css-architectures',
    description: 'Learn modern CSS without frameworks.',
    content: 'Full article content discussing CSS Grid, Flexbox, and CSS Variables...',
    category: 'Technology',
    coverImage: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8',
    authorId: 'user-1',
    authorName: 'Alex Mercer',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    status: 'published',
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
    readingTime: 4,
    views: 120,
  },
  {
    id: 'post-2',
    title: 'Typography Mastery in UI Design',
    slug: 'typography-mastery-in-ui-design',
    description: 'Why typography is the backbone of exceptional digital craft.',
    content: 'Deep dive into editorial typography, optical sizing, and hierarchy...',
    category: 'Design',
    coverImage: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f',
    authorId: 'user-1',
    authorName: 'Alex Mercer',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    status: 'draft',
    createdAt: '2026-10-20T12:00:00.000Z',
    updatedAt: '2026-10-20T12:00:00.000Z',
    readingTime: 3,
    views: 0,
  },
  {
    id: 'post-3',
    title: 'Productivity Habits for Writers',
    slug: 'productivity-habits-for-writers',
    description: 'Consistent routines for creative flow.',
    content: 'Exploring deep work habits and distraction-free writing environments...',
    category: 'Productivity',
    coverImage: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643',
    authorId: 'user-2',
    authorName: 'Elena Rostova',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    status: 'published',
    createdAt: '2026-10-25T08:00:00.000Z',
    updatedAt: '2026-10-25T08:00:00.000Z',
    readingTime: 5,
    views: 350,
  },
];

test('filterPosts filters correctly by category, status, and query', () => {
  // Category filter
  const techPosts = filterPosts(mockPosts, { category: 'Technology' });
  assert.equal(techPosts.length, 1);
  assert.equal(techPosts[0].title, 'Modern CSS Architectures');

  // Query filter
  const searchResults = filterPosts(mockPosts, { query: 'typography' });
  assert.equal(searchResults.length, 1);
  assert.equal(searchResults[0].category, 'Design');

  // Status filter
  const publishedOnly = filterPosts(mockPosts, { status: 'published' });
  assert.equal(publishedOnly.length, 2);

  const draftsOnly = filterPosts(mockPosts, { status: 'draft' });
  assert.equal(draftsOnly.length, 1);

  // Author filter
  const user1Posts = filterPosts(mockPosts, { authorId: 'user-1' });
  assert.equal(user1Posts.length, 2);

  // Edge cases with empty or partial post
  const partialPosts = [
    ...mockPosts,
    {
      id: 'post-empty',
      title: 'Empty meta',
      slug: 'empty-meta',
      description: '',
      content: '',
      category: '',
      coverImage: '',
      authorId: 'user-3',
      authorName: '',
      authorAvatar: '',
      status: 'draft' as const,
      createdAt: '2026-10-31T00:00:00.000Z',
      updatedAt: '2026-10-31T00:00:00.000Z',
      readingTime: 1,
    },
  ];
  const edgeFilter = filterPosts(partialPosts, { category: 'Technology' });
  assert.equal(edgeFilter.length, 1);
});

test('calculateDashboardStats computes author post counts and total views', () => {
  const statsUser1 = calculateDashboardStats(mockPosts, 'user-1');
  assert.equal(statsUser1.total, 2);
  assert.equal(statsUser1.published, 1);
  assert.equal(statsUser1.drafts, 1);
  assert.equal(statsUser1.totalViews, 120);

  const statsAll = calculateDashboardStats(mockPosts);
  assert.equal(statsAll.total, 3);
  assert.equal(statsAll.published, 2);
  assert.equal(statsAll.drafts, 1);
  assert.equal(statsAll.totalViews, 470);
});

test('sanitizeUserSession removes password and preserves safe fields', () => {
  const userWithPassword = {
    id: 'user-123',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'superSecretPassword!',
    avatar: 'https://example.com/avatar.jpg',
  };

  const safe = sanitizeUserSession(userWithPassword);
  assert.ok(safe);
  assert.equal(safe.id, 'user-123');
  assert.equal(safe.name, 'Jane Doe');
  assert.equal(safe.email, 'jane@example.com');
  assert.equal((safe as any).password, undefined);
  assert.equal('password' in (safe as any), false);
  assert.equal(sanitizeUserSession(null), null);
});

test('hashPassword produces salt-based hash and verifyPassword validates it', async () => {
  const rawPassword = 'SecurePassword2026!';
  const hashed = await hashPassword(rawPassword);

  assert.ok(hashed.startsWith('sha256:') || hashed.startsWith('hash:'));
  assert.notEqual(hashed, rawPassword);

  // Correct verification
  const isValid = await verifyPassword(rawPassword, hashed);
  assert.equal(isValid, true);

  // Wrong password fails
  const isInvalid = await verifyPassword('WrongPassword', hashed);
  assert.equal(isInvalid, false);

  // Legacy demo password verification
  const isDemoValid = await verifyPassword('password123', 'password123');
  assert.equal(isDemoValid, true);

  const isDemoInvalid = await verifyPassword('wrongpassword', 'password123');
  assert.equal(isDemoInvalid, false);
});

