/**
 * BlogSpace - Author Dashboard Module
 * Manages user statistics, author post listing, filtering, status toggling,
 * edit navigation, delete confirmation modals, and responsive sidebar navigation.
 */

import {
  getMyPosts,
  deletePost,
  togglePostStatus,
  getCurrentUser,
  getAuthenticatedUser,
  logoutUser,
  formatDate,
  showToast,
  escapeHtml,
  syncMyPostsFromApi,
} from './blog.js';

let activeFilter = 'all'; // 'all' | 'published' | 'draft'
let searchQuery = '';
let postToDeleteId = null;

/**
 * Initialize Dashboard
 */
export async function initDashboard() {
  let currentUser = null;

  try {
    currentUser = await getAuthenticatedUser();
  } catch (error) {
    console.error('[BlogSpace Dashboard] Session verification failed:', error);
    showToast('Unable to verify your session. Please sign in again.', 'error');
    window.location.replace('login.html');
    return;
  }

  if (!currentUser) {
    window.location.replace('login.html');
    return;
  }

  // Do not render cached/private content until the backend confirms ownership.
  try {
    await syncMyPostsFromApi();
  } catch (error) {
    console.error('[BlogSpace Dashboard] Unable to load account articles:', error);
    if (/401|403|authorized|token/i.test(error.message || '')) {
      window.location.replace('login.html');
      return;
    }
    showToast('Your articles could not be loaded. Please refresh and try again.', 'error');
    return;
  }

  setupDashboardUI(currentUser);
}

function setupDashboardUI(user) {
  // Populate User Profile Header & Sidebar
  populateUserProfile(user);

  // Setup Event Listeners
  setupDashboardEvents();

  // Initial Render of stats and posts
  renderDashboard();
}

/**
 * Populate user profile elements
 */
function populateUserProfile(user) {
  const nameElems = document.querySelectorAll('.dashboard-user-name');
  const emailElems = document.querySelectorAll('.dashboard-user-email');
  const avatarElems = document.querySelectorAll('.dashboard-user-avatar');

  nameElems.forEach((el) => (el.textContent = user.name));
  emailElems.forEach((el) => (el.textContent = user.email));
  avatarElems.forEach((img) => {
    if (img instanceof HTMLImageElement) {
      img.src = user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';
      img.alt = user.name;
    }
  });

  const welcomeHeading = document.getElementById('welcome-heading');
  if (welcomeHeading) {
    const hour = new Date().getHours();
    let greeting = 'Good day';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';
    welcomeHeading.textContent = `${greeting}, ${user.name.split(' ')[0]} 👋`;
  }
}

/**
 * Setup UI Events
 */
function setupDashboardEvents() {
  // Mobile sidebar toggle
  const mobileToggleBtn = document.getElementById('mobile-sidebar-toggle');
  const sidebar = document.getElementById('dashboard-sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

  function openSidebar() {
    sidebar?.classList.add('sidebar-open');
    sidebarOverlay?.classList.remove('hidden');
  }

  function closeSidebar() {
    sidebar?.classList.remove('sidebar-open');
    sidebarOverlay?.classList.add('hidden');
  }

  mobileToggleBtn?.addEventListener('click', openSidebar);
  sidebarCloseBtn?.addEventListener('click', closeSidebar);
  sidebarOverlay?.addEventListener('click', closeSidebar);

  // Logout Buttons
  document.querySelectorAll('.logout-trigger-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      logoutUser();
    });
  });

  // Filter Tabs
  const filterTabs = document.querySelectorAll('.dashboard-tab-btn');
  filterTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      filterTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter = tab.getAttribute('data-filter') || 'all';
      renderDashboard();
    });
  });

  // Search input
  const searchInput = document.getElementById('dashboard-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = (e.target.value || '').toLowerCase().trim();
      renderDashboard();
    });
  }

  // Delete Confirmation Modal
  const deleteModal = document.getElementById('delete-modal');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const closeDeleteModalBtn = document.getElementById('close-delete-modal-btn');

  function hideDeleteModal() {
    deleteModal?.classList.add('hidden');
    postToDeleteId = null;
  }

  cancelDeleteBtn?.addEventListener('click', hideDeleteModal);
  closeDeleteModalBtn?.addEventListener('click', hideDeleteModal);

  confirmDeleteBtn?.addEventListener('click', async () => {
    if (postToDeleteId) {
      try {
        await deletePost(postToDeleteId);
        showToast('Article deleted successfully.', 'success');
        hideDeleteModal();
        renderDashboard();
      } catch (err) {
        showToast(err?.message || 'Failed to delete article.', 'error');
        hideDeleteModal();
      }
    }
  });

  // Quick Reset Demo Posts
  const resetDemoBtn = document.getElementById('reset-demo-posts-btn');
  if (resetDemoBtn) {
    resetDemoBtn.addEventListener('click', () => {
      if (confirm('Restore sample editorial articles? This will repopulate standard posts.')) {
        import('./blog.js').then((module) => {
          module.resetSeedData();
          renderDashboard();
        });
      }
    });
  }
}

/**
 * Computes and renders stats and filtered posts
 */
export function renderDashboard() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  // Private posts are loaded only from the authenticated user's isolated cache.
  const userPosts = getMyPosts();

  // Compute statistics
  const totalCount = userPosts.length;
  const publishedCount = userPosts.filter((p) => p.status === 'published').length;
  const draftCount = userPosts.filter((p) => p.status === 'draft').length;
  const totalViews = userPosts.reduce((sum, p) => sum + (p.views || 0), 0);

  // Update Stats DOM
  const totalEl = document.getElementById('stat-total-posts');
  const publishedEl = document.getElementById('stat-published-posts');
  const draftsEl = document.getElementById('stat-draft-posts');
  const viewsEl = document.getElementById('stat-total-views');

  if (totalEl) totalEl.textContent = String(totalCount);
  if (publishedEl) publishedEl.textContent = String(publishedCount);
  if (draftsEl) draftsEl.textContent = String(draftCount);
  if (viewsEl) viewsEl.textContent = totalViews.toLocaleString();

  // Tab count badges
  const badgeAll = document.getElementById('tab-count-all');
  const badgeAllInline = document.getElementById('tab-count-all-inline');
  const badgePub = document.getElementById('tab-count-published');
  const badgeDraft = document.getElementById('tab-count-draft');

  if (badgeAll) badgeAll.textContent = String(totalCount);
  if (badgeAllInline) badgeAllInline.textContent = String(totalCount);
  if (badgePub) badgePub.textContent = String(publishedCount);
  if (badgeDraft) badgeDraft.textContent = String(draftCount);

  // Apply active tab filter and search
  let filteredPosts = userPosts;
  if (activeFilter !== 'all') {
    filteredPosts = filteredPosts.filter((p) => p.status === activeFilter);
  }

  if (searchQuery) {
    filteredPosts = filteredPosts.filter((p) => {
      const matchTitle = (p.title || '').toLowerCase().includes(searchQuery);
      const matchCategory = (p.category || '').toLowerCase().includes(searchQuery);
      const matchDesc = (p.description || '').toLowerCase().includes(searchQuery);
      return matchTitle || matchCategory || matchDesc;
    });
  }

  // Render Table / Cards
  const postsContainer = document.getElementById('dashboard-posts-list');
  const emptyState = document.getElementById('dashboard-empty-state');

  if (!postsContainer) return;

  if (filteredPosts.length === 0) {
    postsContainer.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  postsContainer.innerHTML = filteredPosts
    .map((post) => {
      const isPublished = post.status === 'published';
      const coverUrl = post.coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=400&q=80';
      return `
        <div class="post-table-row" data-id="${escapeHtml(post.id)}">
          <div class="post-col-main">
            <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(post.title)}" class="post-table-thumb" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=400&q=80';" />
            <div class="post-table-info">
              <span class="category-pill-sm">${escapeHtml(post.category)}</span>
              <h3 class="post-table-title">${escapeHtml(post.title)}</h3>
              <p class="post-table-desc">${escapeHtml(post.description)}</p>
              <div class="post-table-meta-mobile">
                <span>${formatDate(post.createdAt)}</span> • <span>${post.readingTime || 3} min read</span> • <span>${post.views || 0} views</span>
              </div>
            </div>
          </div>
          
          <div class="post-col-status">
            <button class="status-badge ${isPublished ? 'status-published' : 'status-draft'} toggle-status-btn" 
                    data-id="${post.id}" 
                    title="Click to toggle status between Published and Draft">
              <span class="status-dot"></span>
              <span>${isPublished ? 'Published' : 'Draft'}</span>
            </button>
          </div>

          <div class="post-col-meta">
            <div class="post-meta-date">${formatDate(post.createdAt)}</div>
            <div class="post-meta-sub">${post.readingTime || 3} min read • ${post.views || 0} views</div>
          </div>

          <div class="post-col-actions">
            <a href="create-blog.html?id=${post.id}" class="action-btn action-edit" title="Edit story" aria-label="Edit story">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span class="action-btn-text">Edit</span>
            </a>
            <button type="button" class="action-btn action-preview preview-post-btn" data-id="${post.id}" title="Preview story" aria-label="Preview story">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span class="action-btn-text">View</span>
            </button>
            <button type="button" class="action-btn action-delete delete-post-btn" data-id="${post.id}" title="Delete story" aria-label="Delete story">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      `;
    })
    .join('');

  // Wire Row Actions
  // Toggle Status
  document.querySelectorAll('.toggle-status-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (id) {
        try {
          const updated = await togglePostStatus(id);
          if (updated) {
            showToast(`Post marked as ${updated.status}.`, 'info');
            renderDashboard();
          }
        } catch (err) {
          showToast(err?.message || 'Failed to update post status.', 'error');
        }
      }
    });
  });

  // Delete Button
  document.querySelectorAll('.delete-post-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      postToDeleteId = btn.getAttribute('data-id');
      const deleteModal = document.getElementById('delete-modal');
      deleteModal?.classList.remove('hidden');
    });
  });

  // Preview Post Button
  document.querySelectorAll('.preview-post-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (id) {
        openPreviewModal(id);
      }
    });
  });
}

/**
 * Preview Modal for viewing article directly from dashboard
 */
function openPreviewModal(id) {
  const posts = getAllPosts();
  const post = posts.find((p) => p.id === id);
  if (!post) return;

  let modal = document.getElementById('preview-article-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'preview-article-modal';
    modal.className = 'modal-backdrop';
    document.body.appendChild(modal);
  }

  // Format markdown/newlines to HTML
  const safeContent = post.content || '';
  const formattedContent = safeContent
    ? safeContent
        .split('\n\n')
        .map((block) => {
          const trimmed = block.trim();
          if (trimmed.startsWith('## ')) return `<h2>${escapeHtml(trimmed.replace('## ', ''))}</h2>`;
          if (trimmed.startsWith('### ')) return `<h3>${escapeHtml(trimmed.replace('### ', ''))}</h3>`;
          if (trimmed.startsWith('> ')) return `<blockquote>${escapeHtml(trimmed.replace('> ', ''))}</blockquote>`;
          return `<p>${escapeHtml(trimmed)}</p>`;
        })
        .join('')
    : '<p><em>No content available.</em></p>';

  const coverUrl = post.coverImage || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80';
  const avatarUrl = post.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80';

  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-lg">
      <div class="modal-content">
        <div class="modal-header">
          <span class="category-pill">${escapeHtml(post.category)}</span>
          <button class="modal-close-btn" id="close-preview-btn" aria-label="Close modal">&times;</button>
        </div>
        <div class="modal-body article-reader-body">
          <h1 class="article-reader-title">${escapeHtml(post.title)}</h1>
          <div class="article-reader-meta">
            <img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(post.authorName)}" class="author-avatar" />
            <div>
              <div class="author-name">${escapeHtml(post.authorName)}</div>
              <div class="article-meta-sub">${formatDate(post.createdAt)} • ${post.readingTime || 1} min read • Status: <strong>${escapeHtml(post.status)}</strong></div>
            </div>
          </div>
          <img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(post.title)}" class="article-reader-cover" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80';" />
          <div class="article-reader-content">
            ${formattedContent}
          </div>
        </div>
        <div class="modal-footer">
          <a href="create-blog.html?id=${escapeHtml(post.id)}" class="btn btn-primary btn-sm">Edit This Post</a>
          <button type="button" class="btn btn-outline btn-sm" id="close-preview-footer-btn">Close</button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');

  const close = () => {
    modal.classList.add('hidden');
    document.removeEventListener('keydown', onKeyDown);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') close();
  };
  document.addEventListener('keydown', onKeyDown);

  modal.querySelector('#close-preview-btn')?.addEventListener('click', close);
  modal.querySelector('#close-preview-footer-btn')?.addEventListener('click', close);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) close();
  });
}
