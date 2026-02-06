/**
 * Blog Rendering Functions for Landing Pages
 * Reads blog posts from localStorage and renders them on blog pages
 */

(function() {
  'use strict';

  const BLOG_STORAGE_KEY = 'flow_blog_posts';

  /**
   * Get all published blog posts
   */
  function getPublishedPosts() {
    const saved = localStorage.getItem(BLOG_STORAGE_KEY);
    if (!saved) return [];

    try {
      const posts = JSON.parse(saved);
      return posts
        .filter(p => p.status === 'published')
        .sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
    } catch (e) {
      console.error('Error parsing blog posts:', e);
      return [];
    }
  }

  /**
   * Get all blog posts (including drafts) - for admin preview
   */
  function getAllPosts() {
    const saved = localStorage.getItem(BLOG_STORAGE_KEY);
    if (!saved) return [];

    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing blog posts:', e);
      return [];
    }
  }

  /**
   * Get unique categories from all posts
   */
  function getCategories(posts) {
    const categories = new Set();
    posts.forEach(p => {
      if (p.category) categories.add(p.category);
    });
    return Array.from(categories);
  }

  /**
   * Calculate estimated read time
   */
  function calculateReadTime(content) {
    if (!content) return '1 min';
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
  }

  /**
   * Format date to Danish locale
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  /**
   * Get default placeholder image
   */
  function getDefaultImage() {
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=500&fit=crop';
  }

  /**
   * Render blog card HTML
   */
  function renderBlogCard(post, isFeatured = false) {
    const readTime = calculateReadTime(post.content);
    const image = post.featured_image || getDefaultImage();
    const date = formatDate(post.published_at || post.created_at);

    if (isFeatured) {
      return `
        <article class="blog-featured">
          <a href="blog-post.html?slug=${encodeURIComponent(post.slug)}" class="blog-featured-image-link">
            <img class="blog-card-image" src="${image}" alt="${post.title}" loading="lazy">
          </a>
          <div class="blog-card-content">
            ${post.category ? `<span class="blog-card-category">${post.category}</span>` : ''}
            <h2 class="blog-card-title"><a href="blog-post.html?slug=${encodeURIComponent(post.slug)}">${post.title}</a></h2>
            <p class="blog-card-excerpt">${post.excerpt || ''}</p>
            <div class="blog-card-meta">
              <span class="blog-card-date">${date}</span>
              <span class="blog-card-read-time">${readTime} lasetid</span>
            </div>
          </div>
        </article>
      `;
    }

    return `
      <article class="blog-card">
        <a href="blog-post.html?slug=${encodeURIComponent(post.slug)}">
          <img class="blog-card-image" src="${image}" alt="${post.title}" loading="lazy">
        </a>
        <div class="blog-card-content">
          ${post.category ? `<span class="blog-card-category">${post.category}</span>` : ''}
          <h3 class="blog-card-title"><a href="blog-post.html?slug=${encodeURIComponent(post.slug)}">${post.title}</a></h3>
          <p class="blog-card-excerpt">${post.excerpt || ''}</p>
          <div class="blog-card-meta">
            <span class="blog-card-date">${date}</span>
            <span class="blog-card-read-time">${readTime} lasetid</span>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Render posts to grid
   */
  function renderPosts(posts, gridEl) {
    if (!gridEl) return;

    if (posts.length === 0) {
      gridEl.innerHTML = `
        <div class="blog-empty">
          <p>Ingen blogindlag fundet.</p>
        </div>
      `;
      return;
    }

    // First post is featured, rest are regular cards
    const html = posts.map((post, index) =>
      renderBlogCard(post, index === 0)
    ).join('');

    gridEl.innerHTML = html;
  }

  /**
   * Filter posts by category
   */
  function filterPosts(category, gridEl) {
    const posts = getPublishedPosts();
    const filtered = category === 'all'
      ? posts
      : posts.filter(p => p.category === category);
    renderPosts(filtered, gridEl);
  }

  /**
   * Render blog listing page
   */
  function renderBlogListing() {
    const gridEl = document.getElementById('blogGrid');
    const filtersEl = document.getElementById('blogFilters');

    if (!gridEl) return;

    const posts = getPublishedPosts();

    // Render category filters
    if (filtersEl) {
      const categories = getCategories(posts);
      const categoryButtons = categories.map(cat =>
        `<button class="blog-filter-btn" data-category="${cat}">${cat}</button>`
      ).join('');
      filtersEl.innerHTML = `
        <button class="blog-filter-btn active" data-category="all">Alle</button>
        ${categoryButtons}
      `;

      // Add filter click handlers
      filtersEl.querySelectorAll('.blog-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          filtersEl.querySelectorAll('.blog-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          filterPosts(btn.dataset.category, gridEl);
        });
      });
    }

    // Render posts
    renderPosts(posts, gridEl);
  }

  /**
   * Simple content to HTML converter
   * Supports basic markdown-like formatting
   */
  function convertContentToHTML(content) {
    if (!content) return '';

    // Split into paragraphs
    const paragraphs = content.split('\n\n');

    return paragraphs.map(paragraph => {
      paragraph = paragraph.trim();
      if (!paragraph) return '';

      // Headers
      if (paragraph.startsWith('### ')) {
        return `<h3>${paragraph.slice(4)}</h3>`;
      }
      if (paragraph.startsWith('## ')) {
        return `<h2>${paragraph.slice(3)}</h2>`;
      }
      if (paragraph.startsWith('# ')) {
        return `<h1>${paragraph.slice(2)}</h1>`;
      }

      // Lists (simple detection)
      if (paragraph.match(/^[-*]\s/m)) {
        const items = paragraph.split('\n')
          .map(line => line.replace(/^[-*]\s+/, '').trim())
          .filter(line => line)
          .map(item => `<li>${item}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }

      // Numbered lists
      if (paragraph.match(/^\d+\.\s/m)) {
        const items = paragraph.split('\n')
          .map(line => line.replace(/^\d+\.\s+/, '').trim())
          .filter(line => line)
          .map(item => `<li>${item}</li>`)
          .join('');
        return `<ol>${items}</ol>`;
      }

      // Bold and italic
      paragraph = paragraph
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/_(.+?)_/g, '<em>$1</em>');

      // Links
      paragraph = paragraph.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

      return `<p>${paragraph}</p>`;
    }).join('\n');
  }

  /**
   * Render single blog post
   */
  function renderSinglePost() {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (!slug) {
      window.location.href = 'blog.html';
      return;
    }

    const posts = getPublishedPosts();
    const post = posts.find(p => p.slug === slug);

    if (!post) {
      // Try to find in all posts (might be preview mode)
      const allPosts = getAllPosts();
      const draftPost = allPosts.find(p => p.slug === slug);
      if (!draftPost) {
        window.location.href = 'blog.html';
        return;
      }
      renderPostContent(draftPost, posts);
      return;
    }

    renderPostContent(post, posts);
  }

  /**
   * Render post content to page
   */
  function renderPostContent(post, allPublishedPosts) {
    // Update page title
    document.title = `${post.title} | Flow Blog`;

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = post.excerpt || '';
    }

    // Render post elements
    const categoryEl = document.getElementById('postCategory');
    const titleEl = document.getElementById('postTitle');
    const authorEl = document.getElementById('postAuthor');
    const dateEl = document.getElementById('postDate');
    const readTimeEl = document.getElementById('postReadTime');
    const imgEl = document.getElementById('postFeaturedImage');
    const contentEl = document.getElementById('postContent');

    if (categoryEl) categoryEl.textContent = post.category || '';
    if (titleEl) titleEl.textContent = post.title;
    if (authorEl) authorEl.textContent = post.author ? `Af ${post.author}` : '';
    if (dateEl) dateEl.textContent = formatDate(post.published_at || post.created_at);
    if (readTimeEl) readTimeEl.textContent = calculateReadTime(post.content) + ' lasetid';

    // Featured image
    if (imgEl) {
      if (post.featured_image) {
        imgEl.src = post.featured_image;
        imgEl.alt = post.title;
      } else {
        imgEl.parentElement.style.display = 'none';
      }
    }

    // Content
    if (contentEl) {
      contentEl.innerHTML = convertContentToHTML(post.content);
    }

    // Related posts
    renderRelatedPosts(post, allPublishedPosts);
  }

  /**
   * Render related posts
   */
  function renderRelatedPosts(currentPost, allPosts) {
    const relatedEl = document.getElementById('relatedPosts');
    if (!relatedEl) return;

    // Get posts from same category, or recent posts
    let related = allPosts
      .filter(p => p.slug !== currentPost.slug)
      .filter(p => p.category === currentPost.category)
      .slice(0, 3);

    // If not enough, fill with recent posts
    if (related.length < 3) {
      const others = allPosts
        .filter(p => p.slug !== currentPost.slug && !related.find(r => r.slug === p.slug))
        .slice(0, 3 - related.length);
      related = [...related, ...others];
    }

    if (related.length === 0) {
      relatedEl.parentElement.style.display = 'none';
      return;
    }

    relatedEl.innerHTML = related.map(post => renderBlogCard(post)).join('');
  }

  // Initialize based on page
  document.addEventListener('DOMContentLoaded', () => {
    const isSinglePost = window.location.pathname.includes('blog-post');

    if (isSinglePost) {
      renderSinglePost();
    } else if (document.getElementById('blogGrid')) {
      renderBlogListing();
    }
  });

  // Expose functions globally for CMS integration
  window.BlogRenderer = {
    getPublishedPosts,
    getAllPosts,
    getCategories,
    calculateReadTime,
    formatDate,
    renderBlogListing,
    renderSinglePost,
    renderBlogCard,
    filterPosts
  };
})();
