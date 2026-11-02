/**
 * BlogSpace - Main Homepage Script
 * Coordinates Hero showcase, featured story, latest articles grid,
 * category filtering, live search, article reader modal, and mobile navigation.
 */

import {
  getAllPosts,
  getPostById,
  initStorage,
  updateNavAuthUI,
  formatDate,
  calculateReadingTime,
  toggleLike,
  isPostLiked,
  incrementPostViews,
  showToast,
  escapeHtml,
  syncPostsFromApi,
} from './blog.js';

// State
let allPosts = [];
let currentCategory = 'All';
let currentSearchQuery = '';

// Preset Categories
const CATEGORIES = ['All', 'Technology', 'Design', 'Productivity', 'Culture', 'Business', 'Lifestyle'];

/**
 * Initialize Homepage
 */
export async function initHomePage() {
  initStorage();
  updateNavAuthUI();
  setupMobileNav();
  setupNewsletter();

  allPosts = getAllPosts();

  renderCategories();
  renderArticles();
  setupSearchInput();
  setupUrlParams();

  // Fetch live articles from Backend REST API
  try {
    const livePosts = await syncPostsFromApi();
    if (livePosts && livePosts.length > 0) {
      allPosts = livePosts;
      renderCategories();
      renderArticles();
    }
  } catch (err) {
    console.warn('[BlogSpace] Using offline posts:', err);
  }
}

/**
 * Check if URL contains direct article view parameter (?read=post-1)
 */
function setupUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const readId = params.get('read');
  if (readId) {
    openArticleModal(readId);
  }
}

/**
 * Mobile Navigation Bar Toggle
 */
function setupMobileNav() {
  const hamburgerBtn = document.getElementById('mobile-nav-toggle');
  const mobileNavMenu = document.getElementById('mobile-nav-menu');
  const mobileNavClose = document.getElementById('mobile-nav-close');

  if (hamburgerBtn && mobileNavMenu) {
    hamburgerBtn.addEventListener('click', () => {
      const isExpanded = hamburgerBtn.getAttribute('aria-expanded') === 'true';
      hamburgerBtn.setAttribute('aria-expanded', String(!isExpanded));
      mobileNavMenu.classList.toggle('is-active');
    });

    mobileNavClose?.addEventListener('click', () => {
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      mobileNavMenu.classList.remove('is-active');
    });
  }
}

/**
 * Newsletter Form Simulation
 */
function setupNewsletter() {
  const form = document.getElementById('newsletter-form');
  const input = document.getElementById('newsletter-email');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = input?.value.trim();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }
    showToast('Thank you for subscribing to BlogSpace Weekly!', 'success');
    if (input) input.value = '';
  });
}

/**
 * Setup live search input
 */
function setupSearchInput() {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear-btn');

  searchInput?.addEventListener('input', (e) => {
    currentSearchQuery = (e.target.value || '').trim();
    if (clearBtn) {
      clearBtn.style.display = currentSearchQuery ? 'flex' : 'none';
    }
    renderArticles();
  });

  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    currentSearchQuery = '';
    clearBtn.style.display = 'none';
    renderArticles();
    searchInput?.focus();
  });
}

/**
 * Render Category filter buttons
 */
function renderCategories() {
  const container = document.getElementById('category-filters');
  if (!container) return;

  // Compute counts for published posts
  const publishedPosts = allPosts.filter((p) => p.status === 'published');
  const counts = { All: publishedPosts.length };

  publishedPosts.forEach((p) => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });

  container.innerHTML = CATEGORIES.map((cat) => {
    const isActive = cat.toLowerCase() === currentCategory.toLowerCase();
    const count = counts[cat] || 0;
    return `
      <button type="button" class="category-pill ${isActive ? 'active' : ''}" data-category="${cat}">
        <span>${cat}</span>
        <span class="category-count">${count}</span>
      </button>
    `;
  }).join('');

  // Wire click events
  container.querySelectorAll('.category-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category') || 'All';
      currentCategory = cat;
      container.querySelectorAll('.category-pill').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderArticles();
    });
  });
}

/**
 * Filter and render both Featured Article & Latest Articles Grid
 */
export function renderArticles() {
  // Re-fetch latest posts in case any were updated in another tab
  allPosts = getAllPosts();
  const publishedPosts = allPosts.filter((p) => p.status === 'published');

  // Filter by category
  let filtered = publishedPosts;
  if (currentCategory && currentCategory !== 'All') {
    filtered = filtered.filter((p) => p.category.toLowerCase() === currentCategory.toLowerCase());
  }

  // Filter by search query
  if (currentSearchQuery) {
    const q = currentSearchQuery.toLowerCase();
    filtered = filtered.filter((p) => {
      return (
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.authorName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }

  // Render Results Count
  const resultsCountEl = document.getElementById('search-results-count');
  if (resultsCountEl) {
    if (currentSearchQuery || currentCategory !== 'All') {
      resultsCountEl.textContent = `Showing ${filtered.length} article${filtered.length === 1 ? '' : 's'}${
        currentCategory !== 'All' ? ` in "${currentCategory}"` : ''
      }${currentSearchQuery ? ` matching "${escapeHtml(currentSearchQuery)}"` : ''}`;
      resultsCountEl.classList.remove('hidden');
    } else {
      resultsCountEl.classList.add('hidden');
    }
  }

  const featuredContainer = document.getElementById('featured-post-container');
  const gridContainer = document.getElementById('articles-grid');
  const emptyState = document.getElementById('articles-empty-state');

  // Empty state handling
  if (filtered.length === 0) {
    if (featuredContainer && (currentSearchQuery || currentCategory !== 'All')) {
      featuredContainer.classList.add('hidden');
    }
    if (gridContainer) gridContainer.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // If no search and category is 'All', pick the first article as Featured
  let gridArticles = filtered;
  if (!currentSearchQuery && currentCategory === 'All' && filtered.length > 0) {
    const featuredPost = filtered[0];
    renderFeaturedPost(featuredPost);
    if (featuredContainer) featuredContainer.classList.remove('hidden');
    // Remaining articles go to the grid
    gridArticles = filtered.slice(1);
  } else {
    // Hide featured hero banner when searching or filtering by specific category
    if (featuredContainer) featuredContainer.classList.add('hidden');
  }

  // Render Latest Grid Cards
  if (gridContainer) {
    gridContainer.innerHTML = gridArticles
      .map((post) => {
        const coverUrl = post.coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80';
        const avatarUrl = post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';
        return `
          <article class="article-card" data-id="${escapeHtml(post.id)}">
            <div class="card-image-wrap">
              <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(post.title)}" class="card-cover-image" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80';" />
              <span class="card-category-badge">${escapeHtml(post.category)}</span>
            </div>
            <div class="card-body">
              <div class="card-meta">
                <span class="card-date">${formatDate(post.createdAt)}</span>
                <span class="meta-dot">•</span>
                <span class="card-read-time">${post.readingTime || 3} min read</span>
              </div>
              <h3 class="card-title">
                <a href="#read" class="card-title-link read-article-trigger" data-id="${escapeHtml(post.id)}">${escapeHtml(post.title)}</a>
              </h3>
              <p class="card-description">${escapeHtml(post.description)}</p>
              
              <div class="card-footer">
                <div class="card-author">
                  <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(post.authorName)}" class="author-avatar-xs" />
                  <span class="author-name-text">${escapeHtml(post.authorName)}</span>
                </div>
                <button type="button" class="btn-read-more read-article-trigger" data-id="${escapeHtml(post.id)}" aria-label="Read ${escapeHtml(post.title)}">
                  <span>Read Article</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    // Wire clicks to open article reader
    gridContainer.querySelectorAll('.read-article-trigger').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const id = el.getAttribute('data-id');
        if (id) openArticleModal(id);
      });
    });
  }
}

/**
 * Render Featured Hero Post
 */
function renderFeaturedPost(post) {
  const container = document.getElementById('featured-post-container');
  if (!container || !post) return;

  const coverUrl = post.coverImage || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80';
  const avatarUrl = post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';

  container.innerHTML = `
    <div class="featured-card">
      <div class="featured-image-col">
        <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(post.title)}" class="featured-cover" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80';" />
        <span class="featured-flag">Featured Article</span>
      </div>
      <div class="featured-content-col">
        <div class="featured-meta-header">
          <span class="category-pill-featured">${escapeHtml(post.category)}</span>
          <span class="featured-read-time">${post.readingTime || 4} min read</span>
        </div>
        <h2 class="featured-title">
          <a href="#read" class="featured-title-link read-article-trigger" data-id="${escapeHtml(post.id)}">
            ${escapeHtml(post.title)}
          </a>
        </h2>
        <p class="featured-description">${escapeHtml(post.description)}</p>
        
        <div class="featured-footer">
          <div class="featured-author-box">
            <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(post.authorName)}" class="featured-avatar" />
            <div>
              <div class="featured-author-name">${escapeHtml(post.authorName)}</div>
              <div class="featured-date">${formatDate(post.createdAt)}</div>
            </div>
          </div>
          <button type="button" class="btn btn-primary featured-cta-btn read-article-trigger" data-id="${escapeHtml(post.id)}">
            <span>Read Story</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;

  container.querySelectorAll('.read-article-trigger').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const id = el.getAttribute('data-id');
      if (id) openArticleModal(id);
    });
  });
}

/**
 * Article Reader Modal - Distraction-free full article reader
 */
export function openArticleModal(id) {
  const post = getPostById(id);
  if (!post) {
    showToast('Article not found.', 'error');
    return;
  }

  // Increment views
  incrementPostViews(id);

  let modal = document.getElementById('article-reader-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'article-reader-modal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }

  // Parse markdown-style blocks into styled HTML
  const safeContent = post.content || '';
  const formattedBody = safeContent
    ? safeContent
        .split('\n\n')
        .map((block) => {
          const trimmed = block.trim();
          if (trimmed.startsWith('## ')) {
            return `<h2 class="reader-h2">${escapeHtml(trimmed.replace('## ', ''))}</h2>`;
          }
          if (trimmed.startsWith('### ')) {
            return `<h3 class="reader-h3">${escapeHtml(trimmed.replace('### ', ''))}</h3>`;
          }
          if (trimmed.startsWith('> ')) {
            return `<blockquote class="reader-quote">${escapeHtml(trimmed.replace('> ', ''))}</blockquote>`;
          }
          if (trimmed.startsWith('- ')) {
            const items = trimmed
              .split('\n')
              .map((li) => `<li>${escapeHtml(li.replace(/^-\s*/, ''))}</li>`)
              .join('');
            return `<ul class="reader-list">${items}</ul>`;
          }
          if (trimmed.match(/^\d+\.\s/)) {
            const items = trimmed
              .split('\n')
              .map((li) => `<li>${escapeHtml(li.replace(/^\d+\.\s*/, ''))}</li>`)
              .join('');
            return `<ol class="reader-list">${items}</ol>`;
          }
          return `<p class="reader-p">${escapeHtml(trimmed)}</p>`;
        })
        .join('')
    : '<p class="reader-p"><em>No content available.</em></p>';

  const isLiked = isPostLiked(id);
  const coverUrl = post.coverImage || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80';
  const avatarUrl = post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-editorial">
      <div class="modal-content editorial-content">
        <!-- Sticky reading header -->
        <div class="reader-top-bar">
          <div class="reader-category-wrap">
            <span class="category-pill">${escapeHtml(post.category)}</span>
            <span class="reader-read-time">${post.readingTime || 3} min read</span>
          </div>
          <div class="reader-top-actions">
            <button type="button" class="btn-icon" id="reader-share-btn" title="Share article" aria-label="Share article">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
            <button type="button" class="modal-close-btn" id="reader-close-btn" aria-label="Close article">&times;</button>
          </div>
        </div>

        <article class="reader-article">
          <h1 class="reader-title">${escapeHtml(post.title)}</h1>
          
          <div class="reader-author-row">
            <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(post.authorName)}" class="reader-avatar" />
            <div class="reader-author-info">
              <span class="reader-author-name">${escapeHtml(post.authorName)}</span>
              <span class="reader-meta-sub">Published on ${formatDate(post.createdAt)} • ${post.views || 1} views</span>
            </div>
          </div>

          <div class="reader-hero-image-wrap">
            <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(post.title)}" class="reader-hero-img" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80';" />
          </div>

          <div class="reader-prose">
            ${formattedBody}
          </div>

          <!-- Interaction Bar -->
          <div class="reader-feedback-bar">
            <div class="like-button-wrap">
              <button type="button" class="btn-like ${isLiked ? 'is-liked' : ''}" id="reader-like-btn" aria-label="Like story">
                <svg class="heart-icon" width="20" height="20" viewBox="0 0 24 24" fill="${isLiked ? '#ef4444' : 'none'}" stroke="${isLiked ? '#ef4444' : 'currentColor'}" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                <span id="like-count-display">${post.likes || 0}</span>
                <span class="like-label">Applaud</span>
              </button>
            </div>
            
            <div class="reader-share-actions">
              <span class="share-label">Share:</span>
              <button type="button" class="btn-share-icon" id="share-copy-btn" title="Copy article link" aria-label="Copy article link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
              <button type="button" class="btn-share-icon" id="share-twitter-btn" title="Share on Twitter" aria-label="Share on Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Wire Modal Interactions
  const closeModal = () => {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeyDown);
    if (window.history && window.history.replaceState) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('read')) {
        url.searchParams.delete('read');
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
      }
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', onKeyDown);

  modal.querySelector('#reader-close-btn')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Like Button
  const likeBtn = modal.querySelector('#reader-like-btn');
  const countDisplay = modal.querySelector('#like-count-display');
  likeBtn?.addEventListener('click', () => {
    const res = toggleLike(id);
    if (res.liked) {
      likeBtn.classList.add('is-liked');
      likeBtn.querySelector('.heart-icon')?.setAttribute('fill', '#ef4444');
      likeBtn.querySelector('.heart-icon')?.setAttribute('stroke', '#ef4444');
      showToast('Thank you for appreciating this story!', 'success');
    } else {
      likeBtn.classList.remove('is-liked');
      likeBtn.querySelector('.heart-icon')?.setAttribute('fill', 'none');
      likeBtn.querySelector('.heart-icon')?.setAttribute('stroke', 'currentColor');
    }
    if (countDisplay) countDisplay.textContent = String(res.count);
  });

  // Share Copy Link
  modal.querySelector('#share-copy-btn')?.addEventListener('click', () => {
    const url = window.location.origin + window.location.pathname + `?read=${id}`;
    navigator.clipboard?.writeText(url).then(
      () => showToast('Article link copied to clipboard!', 'info'),
      () => showToast(`Link: ${url}`, 'info')
    );
  });

  modal.querySelector('#reader-share-btn')?.addEventListener('click', () => {
    const url = window.location.origin + window.location.pathname + `?read=${id}`;
    navigator.clipboard?.writeText(url).then(
      () => showToast('Article link copied to clipboard!', 'info'),
      () => showToast(`Link: ${url}`, 'info')
    );
  });

  modal.querySelector('#share-twitter-btn')?.addEventListener('click', () => {
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      post.title + ' — Read on BlogSpace'
    )}&url=${encodeURIComponent(window.location.origin + window.location.pathname + '?read=' + id)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  });
}
