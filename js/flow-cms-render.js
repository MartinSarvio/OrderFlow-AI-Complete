/**
 * Flow CMS Dynamic Content Renderer
 * This script reads CMS content from localStorage and applies it to Flow landing pages.
 * Include this script at the end of any editable Flow page.
 *
 * Updated to read from orderflow_cms_pages (new CMS editor format)
 */

(function() {
  'use strict';

  // Determine which page we're on based on pathname
  const pathname = window.location.pathname;
  let pageSlug = pathname.split('/').pop().replace('.html', '');

  // Default to 'landing' if we're at root or index
  if (!pageSlug || pageSlug === '' || pageSlug === 'index') {
    pageSlug = 'landing';
  }

  /**
   * Load and apply CMS content from orderflow_cms_pages
   */
  function loadCMSContent() {
    // Check if this is a scheduled preview
    const urlParams = new URLSearchParams(window.location.search);
    const isScheduledPreview = urlParams.get('preview') === 'scheduled';

    if (isScheduledPreview) {
      loadScheduledPreview();
      return;
    }

    const saved = localStorage.getItem('orderflow_cms_pages');
    if (!saved) {
      console.log('Flow CMS: No CMS pages found, using defaults');
      return;
    }

    try {
      const pages = JSON.parse(saved);

      // Find the page matching current slug
      const pageData = pages.find(p => {
        const pSlug = (p.slug || '').replace('.html', '');
        return pSlug === pageSlug || p.slug === pageSlug + '.html';
      });

      if (!pageData) {
        console.log('Flow CMS: No saved content for ' + pageSlug + ', using defaults');
        return;
      }

      // Only render if page is published
      if (pageData.status === 'draft') {
        console.log('Flow CMS: Page ' + pageSlug + ' is a draft, not rendering');
        return;
      }

      // Sort sections by order and render visible ones
      const visibleSections = (pageData.sections || [])
        .filter(s => s.isVisible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      visibleSections.forEach(section => {
        renderSection(section);
      });

      console.log('Flow CMS: Content loaded for ' + pageSlug + ' (' + visibleSections.length + ' sections)');
    } catch (e) {
      console.warn('Flow CMS: Error loading content for ' + pageSlug, e);
    }
  }

  /**
   * Load scheduled preview content
   */
  function loadScheduledPreview() {
    const preview = localStorage.getItem('orderflow_cms_preview');
    if (!preview) {
      console.log('Flow CMS: No scheduled preview data found');
      return;
    }

    try {
      const previewData = JSON.parse(preview);
      const currentSlug = pageSlug + '.html';

      if (previewData.pageSlug !== currentSlug && previewData.pageSlug !== pageSlug) {
        console.log('Flow CMS: Preview data is for a different page');
        return;
      }

      // Show preview banner
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#f59e0b;color:#000;padding:12px;text-align:center;z-index:10000;font-weight:500';
      banner.innerHTML = 'PREVIEW: Dette er en forhåndsvisning af planlagte ændringer. <button onclick="window.close()" style="margin-left:12px;padding:4px 12px;border:none;border-radius:4px;cursor:pointer">Luk</button>';
      document.body.insertBefore(banner, document.body.firstChild);
      document.body.style.paddingTop = '48px';

      // Render preview sections
      const visibleSections = (previewData.sections || [])
        .filter(s => s.isVisible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      visibleSections.forEach(section => {
        renderSection(section);
      });

      console.log('Flow CMS: Scheduled preview loaded (' + visibleSections.length + ' sections)');
    } catch (e) {
      console.warn('Flow CMS: Error loading scheduled preview', e);
    }
  }

  /**
   * Check for scheduled changes that should be applied
   */
  function checkScheduledChanges() {
    const saved = localStorage.getItem('orderflow_cms_pages');
    if (!saved) return;

    try {
      const pages = JSON.parse(saved);
      let hasChanges = false;
      const now = Date.now();

      pages.forEach(page => {
        if (!page.scheduledChanges) return;

        page.scheduledChanges.forEach(schedule => {
          if (schedule.status !== 'pending') return;

          const scheduledTime = new Date(schedule.scheduledFor).getTime();

          if (scheduledTime <= now) {
            // Apply scheduled changes
            page.sections = schedule.sections;
            schedule.status = 'applied';
            page.updatedAt = new Date().toISOString();
            hasChanges = true;
            console.log('Flow CMS: Applied scheduled changes for', page.slug);
          }
        });
      });

      if (hasChanges) {
        localStorage.setItem('orderflow_cms_pages', JSON.stringify(pages));
        loadCMSContent();
      }
    } catch (e) {
      console.error('Flow CMS: Error checking scheduled changes', e);
    }
  }

  /**
   * Render a section based on its type
   */
  function renderSection(section) {
    switch (section.type) {
      case 'hero':
        renderHeroSection(section);
        break;
      case 'text':
        renderTextSection(section);
        break;
      case 'features':
        renderFeaturesSection(section);
        break;
      case 'cta':
        renderCTASection(section);
        break;
      case 'testimonials':
        renderTestimonialsSection(section);
        break;
      case 'faq':
        renderFAQSection(section);
        break;
      case 'images':
        renderImagesSection(section);
        break;
      case 'trusted':
        renderTrustedSection(section);
        break;
      case 'appleFeatures':
        renderAppleFeaturesSection(section);
        break;
      case 'bento':
        renderBentoSection(section);
        break;
      case 'beliefs':
        renderBeliefsSection(section);
        break;
      default:
        // Unknown section type
        break;
    }
  }

  /**
   * Render Hero Section
   * Fields: headline, subheadline, alignment, buttons[], backgroundImage, backgroundVideo, backgroundOverlay, animation
   */
  function renderHeroSection(section) {
    if (!section) return;

    // Find hero section
    const heroSection = document.querySelector('[data-cms="hero"]') ||
                        document.querySelector('.hero-section') ||
                        document.querySelector('.hero');

    if (!heroSection) return;

    // Update headline
    if (section.headline) {
      const h1 = heroSection.querySelector('h1');
      if (h1) {
        h1.innerHTML = section.headline;
      }
    }

    // Update subheadline/description
    if (section.subheadline) {
      const p = heroSection.querySelector('.hero-content p, .hero-description, .hero p:not(.small)');
      if (p) {
        p.textContent = section.subheadline;
      }
    }

    // Update background image
    if (section.backgroundImage) {
      const videoBg = heroSection.querySelector('.hero-video-bg');
      if (videoBg) {
        videoBg.style.backgroundImage = `url(${section.backgroundImage})`;
        videoBg.style.backgroundSize = 'cover';
        videoBg.style.backgroundPosition = 'center';
      } else {
        // Try setting on hero section directly
        heroSection.style.backgroundImage = `url(${section.backgroundImage})`;
        heroSection.style.backgroundSize = 'cover';
        heroSection.style.backgroundPosition = 'center';
      }
    }

    // Update background video
    if (section.backgroundVideo) {
      const videoSource = heroSection.querySelector('.hero-video-bg video source, video source');
      if (videoSource) {
        videoSource.src = section.backgroundVideo;
        videoSource.parentElement.load();
      }
    }

    // Update overlay opacity via CSS variable
    if (section.backgroundOverlay !== undefined) {
      heroSection.style.setProperty('--hero-overlay-opacity', section.backgroundOverlay / 100);
      // Also try to update the overlay directly
      const overlay = heroSection.querySelector('.hero-video-bg');
      if (overlay) {
        // Create or update pseudo-element via inline style
        const overlayOpacity = section.backgroundOverlay / 100;
        overlay.style.setProperty('--overlay-opacity', overlayOpacity);
      }
    }

    // Apply animation
    if (section.animation && section.animation !== 'none') {
      heroSection.classList.add('cms-animate-' + section.animation);
      // Add animation styles if not present
      if (!document.getElementById('cms-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'cms-animation-styles';
        style.textContent = `
          .cms-animate-fade { animation: cmsFadeIn 0.8s ease-out; }
          .cms-animate-slide { animation: cmsSlideUp 0.8s ease-out; }
          .cms-animate-zoom { animation: cmsZoomIn 0.8s ease-out; }
          @keyframes cmsFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes cmsSlideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes cmsZoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        `;
        document.head.appendChild(style);
      }
    }

    // Update buttons
    if (section.buttons && section.buttons.length > 0) {
      const primaryBtn = heroSection.querySelector('.button-white, .hero-cta, .cta-button, .hero-buttons a:first-child, .btn-primary');
      if (primaryBtn && section.buttons[0]) {
        primaryBtn.textContent = section.buttons[0].text;
        if (section.buttons[0].url) {
          primaryBtn.href = section.buttons[0].url;
        }
      }

      // Secondary button if exists
      const secondaryBtn = heroSection.querySelector('.hero-buttons a:nth-child(2), .btn-secondary');
      if (secondaryBtn && section.buttons[1]) {
        secondaryBtn.textContent = section.buttons[1].text;
        if (section.buttons[1].url) {
          secondaryBtn.href = section.buttons[1].url;
        }
      }
    }
  }

  /**
   * Render Text Section
   * Fields: title, content, alignment
   */
  function renderTextSection(section) {
    if (!section) return;

    const textSection = document.querySelector('[data-cms="text"]') ||
                        document.querySelector('.text-section');

    if (!textSection) return;

    if (section.title) {
      const heading = textSection.querySelector('h2, h3');
      if (heading) {
        heading.textContent = section.title;
      }
    }

    if (section.content) {
      const content = textSection.querySelector('.text-content, p');
      if (content) {
        content.innerHTML = section.content;
      }
    }

    if (section.alignment) {
      textSection.style.textAlign = section.alignment;
    }
  }

  /**
   * Render Features Section
   * Fields: features[], layout, columns
   */
  function renderFeaturesSection(section) {
    if (!section || !section.features || section.features.length === 0) return;

    const featuresSection = document.querySelector('[data-cms="features"]') ||
                            document.querySelector('.features-section') ||
                            document.querySelector('.tabs-header');

    if (!featuresSection) return;

    // Try to find feature items
    const featureItems = featuresSection.querySelectorAll('.tab-item .tab-text, .feature-item, .feature-title, .feature-card');

    section.features.forEach((feature, index) => {
      if (featureItems[index]) {
        // Feature might be object {id, title, description} or string
        const title = typeof feature === 'string' ? feature : feature.title;
        featureItems[index].textContent = title;
      }
    });
  }

  /**
   * Render Call to Action Section
   * Fields: title, description, button{text, url, variant}, style
   */
  function renderCTASection(section) {
    if (!section) return;

    const ctaSection = document.querySelector('[data-cms="cta"]') ||
                       document.querySelector('.cta-section') ||
                       document.querySelector('.cta-banner');

    if (!ctaSection) return;

    // Update title
    if (section.title) {
      const heading = ctaSection.querySelector('h2, h3, .cta-title');
      if (heading) {
        heading.textContent = section.title;
      }
    }

    // Update description
    if (section.description) {
      const desc = ctaSection.querySelector('p, .cta-description');
      if (desc) {
        desc.textContent = section.description;
      }
    }

    // Update button
    if (section.button) {
      const btn = ctaSection.querySelector('.button, .cta-button, a.btn, button');
      if (btn) {
        btn.textContent = section.button.text;
        if (section.button.url && btn.tagName === 'A') {
          btn.href = section.button.url;
        }
      }
    }
  }

  /**
   * Render Testimonials Section
   * Fields: items[], layout
   */
  function renderTestimonialsSection(section) {
    if (!section || !section.items || section.items.length === 0) return;

    const testimonialsSection = document.querySelector('[data-cms="testimonials"]') ||
                                document.querySelector('.testimonials-section') ||
                                document.querySelector('.testimonials');

    if (!testimonialsSection) return;

    const testimonialItems = testimonialsSection.querySelectorAll('.testimonial-item, .testimonial-card');

    section.items.forEach((item, index) => {
      if (testimonialItems[index]) {
        const quote = testimonialItems[index].querySelector('.quote, .testimonial-text, p');
        const author = testimonialItems[index].querySelector('.author, .testimonial-author');

        if (quote && item.text) {
          quote.textContent = item.text;
        }
        if (author && item.author) {
          author.textContent = item.author;
        }
      }
    });
  }

  /**
   * Render FAQ Section
   * Fields: items[] (question, answer)
   */
  function renderFAQSection(section) {
    if (!section || !section.items || section.items.length === 0) return;

    const faqSection = document.querySelector('[data-cms="faq"]') ||
                       document.querySelector('.faq-section') ||
                       document.querySelector('.faq');

    if (!faqSection) return;

    const faqItems = faqSection.querySelectorAll('.faq-item, .accordion-item');

    section.items.forEach((item, index) => {
      if (faqItems[index]) {
        const question = faqItems[index].querySelector('.question, .faq-question, h4');
        const answer = faqItems[index].querySelector('.answer, .faq-answer, p');

        if (question && item.question) {
          question.textContent = item.question;
        }
        if (answer && item.answer) {
          answer.textContent = item.answer;
        }
      }
    });
  }

  /**
   * Render Images Section
   * Fields: images[], layout, title, columns
   */
  function renderImagesSection(section) {
    if (!section || !section.images || section.images.length === 0) return;

    const imagesSection = document.querySelector('[data-cms="images"]') ||
                          document.querySelector('.images-section') ||
                          document.querySelector('.gallery');

    if (!imagesSection) return;

    // Update title if present
    if (section.title) {
      const title = imagesSection.querySelector('h2, h3, .gallery-title');
      if (title) {
        title.textContent = section.title;
      }
    }

    // Apply layout class
    if (section.layout) {
      imagesSection.classList.remove('layout-grid', 'layout-carousel', 'layout-masonry', 'layout-single');
      imagesSection.classList.add('layout-' + section.layout);
    }

    // Apply columns
    if (section.columns) {
      imagesSection.style.setProperty('--gallery-columns', section.columns);
    }

    const imageElements = imagesSection.querySelectorAll('img');

    section.images.forEach((image, index) => {
      // Normalize image format (can be string or object)
      const imgData = typeof image === 'string' ? { url: image, alt: '' } : image;

      if (imageElements[index] && imgData.url) {
        imageElements[index].src = imgData.url;
        if (imgData.alt) {
          imageElements[index].alt = imgData.alt;
        }
      }
    });
  }

  /**
   * Render Trusted Section (Testimonial Carousel)
   * Fields: heading, cards[] (name, role, quote, image, gradient), layout, animation
   */
  function renderTrustedSection(section) {
    if (!section) return;

    const trustedSection = document.querySelector('[data-cms="trusted"]') ||
                           document.querySelector('.trusted-section') ||
                           document.querySelector('.testimonials-carousel');

    if (!trustedSection) return;

    // Update heading
    if (section.heading) {
      const h2 = trustedSection.querySelector('h2, .section-title');
      if (h2) {
        h2.textContent = section.heading;
      }
    }

    // Apply layout class
    if (section.layout) {
      trustedSection.classList.remove('layout-carousel', 'layout-grid', 'layout-masonry');
      trustedSection.classList.add('layout-' + section.layout);
    }

    // Apply animation
    if (section.animation && section.animation !== 'none') {
      trustedSection.classList.add('cms-animate-' + section.animation);
    }

    // Update cards
    if (section.cards && section.cards.length > 0) {
      const cards = trustedSection.querySelectorAll('.carousel-card, .testimonial-card');
      section.cards.forEach((card, index) => {
        if (cards[index]) {
          const name = cards[index].querySelector('.card-name, .author-name, h4');
          const role = cards[index].querySelector('.card-role, .author-role, .company');
          const quote = cards[index].querySelector('.card-quote, .quote, p');
          const img = cards[index].querySelector('img');

          if (name && card.name) name.textContent = card.name;
          if (role && card.role) role.textContent = card.role;
          if (quote && card.quote) quote.textContent = card.quote;
          if (img && card.image) img.src = card.image;

          // Apply gradient background if specified
          if (card.gradient) {
            cards[index].style.background = card.gradient;
          }
        }
      });
    }
  }

  /**
   * Render Apple Features Section (Feature Cards Carousel)
   * Fields: heading, description, cards[] (badge, title, description)
   */
  function renderAppleFeaturesSection(section) {
    if (!section) return;

    const appleSection = document.querySelector('[data-cms="appleFeatures"]') ||
                         document.querySelector('.apple-features') ||
                         document.querySelector('.features-carousel');

    if (!appleSection) return;

    // Update heading
    if (section.heading) {
      const h2 = appleSection.querySelector('h2, .section-title');
      if (h2) {
        h2.textContent = section.heading;
      }
    }

    // Update description
    if (section.description) {
      const desc = appleSection.querySelector('.section-description, > p');
      if (desc) {
        desc.textContent = section.description;
      }
    }

    // Update cards
    if (section.cards && section.cards.length > 0) {
      const cards = appleSection.querySelectorAll('.carousel-card, .feature-card');
      section.cards.forEach((card, index) => {
        if (cards[index]) {
          const badge = cards[index].querySelector('.card-badge, .badge');
          const title = cards[index].querySelector('.card-title, h3');
          const desc = cards[index].querySelector('.card-description, p');

          if (badge && card.badge) badge.textContent = card.badge;
          if (title && card.title) title.textContent = card.title;
          if (desc && card.description) desc.textContent = card.description;
        }
      });
    }
  }

  /**
   * Render Bento Section (Bento Grid)
   * Fields: heading, cards[] (label, title, image)
   */
  function renderBentoSection(section) {
    if (!section) return;

    const bentoSection = document.querySelector('[data-cms="bento"]') ||
                         document.querySelector('.bento-section') ||
                         document.querySelector('.bento-grid');

    if (!bentoSection) return;

    // Update heading
    if (section.heading) {
      const h2 = bentoSection.querySelector('h2, .section-title');
      if (h2) {
        h2.innerHTML = section.heading;
      }
    }

    // Update cards
    if (section.cards && section.cards.length > 0) {
      const cards = bentoSection.querySelectorAll('.bento-card, .card');
      section.cards.forEach((card, index) => {
        if (cards[index]) {
          const label = cards[index].querySelector('.card-label, .label, small');
          const title = cards[index].querySelector('.card-title, h3, .title');
          const img = cards[index].querySelector('img');

          if (label && card.label) label.textContent = card.label;
          if (title && card.title) title.textContent = card.title;
          if (img && card.image) img.src = card.image;
        }
      });
    }
  }

  /**
   * Render Beliefs Section (Company Values)
   * Fields: heading, subtitle, author{name, role, image}, items[] (heading, text)
   */
  function renderBeliefsSection(section) {
    if (!section) return;

    const beliefsSection = document.querySelector('[data-cms="beliefs"]') ||
                           document.querySelector('.beliefs-section') ||
                           document.querySelector('#om');

    if (!beliefsSection) return;

    // Update heading
    if (section.heading) {
      const h2 = beliefsSection.querySelector('h2, .section-title');
      if (h2) {
        h2.textContent = section.heading;
      }
    }

    // Update subtitle
    if (section.subtitle) {
      const subtitle = beliefsSection.querySelector('.section-subtitle, > p:first-of-type');
      if (subtitle) {
        subtitle.textContent = section.subtitle;
      }
    }

    // Update author
    if (section.author) {
      const authorName = beliefsSection.querySelector('.author-name, .name');
      const authorRole = beliefsSection.querySelector('.author-role, .role');
      const authorImg = beliefsSection.querySelector('.author-image img, .author img');

      if (authorName && section.author.name) authorName.textContent = section.author.name;
      if (authorRole && section.author.role) authorRole.textContent = section.author.role;
      if (authorImg && section.author.image) authorImg.src = section.author.image;
    }

    // Update belief items
    if (section.items && section.items.length > 0) {
      const items = beliefsSection.querySelectorAll('.belief-item, .value-item');
      section.items.forEach((item, index) => {
        if (items[index]) {
          const heading = items[index].querySelector('.belief-heading, h3, h4');
          const text = items[index].querySelector('.belief-text, p');

          if (heading && item.heading) heading.textContent = item.heading;
          if (text && item.text) text.textContent = item.text;
        }
      });
    }
  }

  /**
   * Load cookie consent if enabled for this page
   */
  function loadCookieConsentIfEnabled() {
    const saved = localStorage.getItem('orderflow_cms_pages');
    if (!saved) return;

    try {
      const pages = JSON.parse(saved);
      const pageData = pages.find(p => {
        const pSlug = (p.slug || '').replace('.html', '');
        return pSlug === pageSlug || p.slug === pageSlug + '.html';
      });

      if (pageData && pageData.showCookieBanner === true) {
        // Load cookie consent CSS
        if (!document.querySelector('link[href*="cookie-consent.css"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'css/cookie-consent.css';
          document.head.appendChild(link);
        }

        // Load cookie consent JS
        if (!document.querySelector('script[src*="cookie-consent.js"]')) {
          const script = document.createElement('script');
          script.src = 'js/cookie-consent.js';
          document.body.appendChild(script);
        }

        console.log('Flow CMS: Cookie consent loaded for', pageSlug);
      }
    } catch (e) {
      console.warn('Flow CMS: Error checking cookie consent setting', e);
    }
  }

  /**
   * Initialize CMS content on DOM ready
   */
  function init() {
    // Check for scheduled changes first
    checkScheduledChanges();

    // Load CMS content
    loadCMSContent();

    // Load cookie consent if enabled for this page
    loadCookieConsentIfEnabled();

    // Listen for cross-tab CMS updates via BroadcastChannel
    const cmsChannel = new BroadcastChannel('orderflow_cms_channel');
    cmsChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'cms_update') {
        console.log('Flow CMS: Received update from another tab, reloading content...');
        loadCMSContent();
      }
    };

    // Listen for service worker cache clear notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_CLEARED') {
          console.log('Flow CMS: Cache cleared, reloading content...');
          loadCMSContent();
        }
      });
    }

    // Check for scheduled changes every 60 seconds
    setInterval(checkScheduledChanges, 60000);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
