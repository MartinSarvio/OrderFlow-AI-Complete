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
   * Load and apply CMS content - tries Supabase first, localStorage as cache
   */
  async function loadCMSContent() {
    // Check if this is a scheduled preview
    const urlParams = new URLSearchParams(window.location.search);
    const isScheduledPreview = urlParams.get('preview') === 'scheduled';

    if (isScheduledPreview) {
      loadScheduledPreview();
      return;
    }

    let pages = null;

    // 1. Try Supabase first
    if (window.SUPABASE_CONFIG && window.supabase) {
      try {
        const client = window.supabaseClient || window.supabase.createClient(
          window.SUPABASE_CONFIG.url,
          window.SUPABASE_CONFIG.key
        );
        const { data, error } = await client
          .from('builder_configs')
          .select('config_data')
          .eq('config_type', 'cms')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data?.config_data?.pages) {
          pages = data.config_data.pages;
          // Cache in localStorage
          localStorage.setItem('orderflow_cms_pages', JSON.stringify(pages));
        }
      } catch (err) {
        console.warn('Flow CMS: Supabase load failed, using localStorage cache');
      }
    }

    // 2. Fallback to localStorage cache
    if (!pages) {
      const saved = localStorage.getItem('orderflow_cms_pages');
      if (!saved) {
        console.log('Flow CMS: No CMS pages found, using defaults');
        return;
      }
      try {
        pages = JSON.parse(saved);
      } catch (e) {
        console.error('Flow CMS: Failed to parse localStorage data');
        return;
      }
    }

    try {

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
      case 'bento':
        renderBentoSection(section);
        break;
      case 'beliefs':
        renderBeliefsSection(section);
        break;
      case 'logocloud':
        renderLogoCloudSection(section);
        break;
      case 'footer':
        renderFooterSection(section);
        break;
      case 'chat-demo':
        renderChatDemoSection(section);
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

    // Update headline - but preserve typed-text element if rotating words exist
    if (section.headline) {
      const h1 = heroSection.querySelector('h1');
      if (h1) {
        // If we have rotating words AND a typed-text element, we need to preserve it
        if (section.rotatingWords && Array.isArray(section.rotatingWords) && section.rotatingWords.length > 0) {
          // Don't overwrite h1 if headline doesn't include typed-text placeholder
          // The headline should contain {TYPED_TEXT} placeholder if rotating words are used
          if (section.headline.includes('{TYPED_TEXT}')) {
            const uppercaseWords = section.rotatingWords.map(w => w.toUpperCase());
            const typedHtml = '<span class="typed-text" data-typed-text=\'' + JSON.stringify(uppercaseWords) + '\'>' + uppercaseWords[0] + '</span><span class="typed-cursor typed-cursor--blink" aria-hidden="true">|</span>';
            h1.innerHTML = section.headline.replace('{TYPED_TEXT}', typedHtml);
          }
          // If no placeholder but rotatingWords exist, just update the existing typed-text without replacing h1
        } else {
          // No rotating words in CMS data - check if h1 already has typed-text element
          const existingTypedText = h1.querySelector('.typed-text');
          if (!existingTypedText) {
            // No existing typed-text, safe to replace h1 content
            h1.innerHTML = section.headline;
          }
          // If there's an existing typed-text element, preserve the h1 to keep the animation
        }
      }
    }

    // Update rotating words (typed text animation) - for existing typed-text elements
    if (section.rotatingWords && Array.isArray(section.rotatingWords) && section.rotatingWords.length > 0) {
      const typedEl = heroSection.querySelector('.typed-text');
      if (typedEl) {
        // Convert to uppercase to match hero style
        const uppercaseWords = section.rotatingWords.map(w => w.toUpperCase());
        typedEl.setAttribute('data-typed-text', JSON.stringify(uppercaseWords));
        typedEl.textContent = uppercaseWords[0];
        // Re-initialize typed text animation if function exists
        if (typeof window.initTypedText === 'function') {
          window.initTypedText();
        }
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

    // Update background video(s) with optional shuffle
    const videoSource = heroSection.querySelector('.hero-video-bg video source, video source');
    const videoElement = videoSource?.parentElement;

    if (section.backgroundVideos && section.backgroundVideos.length > 0 && videoElement && videoSource) {
      // Filter out empty URLs
      const validVideos = section.backgroundVideos.filter(v => v.url && v.url.trim());

      if (validVideos.length > 0) {
        // Set initial video
        videoSource.src = validVideos[0].url;
        videoElement.load();

        // If shuffle enabled and multiple videos, setup rotation
        if (section.videoShuffleEnabled && validVideos.length > 1) {
          let currentIndex = 0;
          const shuffleDuration = (section.videoShuffleDuration || 10) * 1000;

          // Setup shuffle interval
          setInterval(() => {
            currentIndex = (currentIndex + 1) % validVideos.length;
            videoSource.src = validVideos[currentIndex].url;
            videoElement.load();
            videoElement.play().catch(() => {}); // Ignore autoplay errors
          }, shuffleDuration);

          console.log('Flow CMS: Video shuffle enabled with', validVideos.length, 'videos, interval:', shuffleDuration / 1000, 'seconds');
        }
      }
    } else if (section.backgroundVideo && videoSource) {
      // Backwards compatibility with old single video field
      videoSource.src = section.backgroundVideo;
      videoElement?.load();
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
          .cms-animate-bounce { animation: cmsBounce 1s ease; }
          .cms-animate-pulse { animation: cmsPulse 1.5s ease-in-out infinite; }
          .cms-animate-slideLeft { animation: cmsSlideLeft 0.8s ease-out; }
          .cms-animate-slideRight { animation: cmsSlideRight 0.8s ease-out; }
          .cms-animate-rotate { animation: cmsRotate 0.8s ease-out; }
          .cms-animate-scale { animation: cmsScaleUp 0.8s ease-out; }
          @keyframes cmsFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes cmsSlideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes cmsZoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          @keyframes cmsBounce { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-20px); } 60% { transform: translateY(-10px); } }
          @keyframes cmsPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
          @keyframes cmsSlideLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes cmsSlideRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes cmsRotate { from { opacity: 0; transform: rotate(-10deg); } to { opacity: 1; transform: rotate(0); } }
          @keyframes cmsScaleUp { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
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
   * Fields: tabs[] (tabLabel, headline, description, image, video), heading
   */
  function renderFeaturesSection(section) {
    if (!section) return;

    const featuresSection = document.querySelector('[data-cms="features"]') ||
                            document.querySelector('.features-section') ||
                            document.querySelector('.tabs-section');

    if (!featuresSection) return;

    // Check if we have tabs array (new format) or features array (old format)
    const tabs = section.tabs || [];
    const features = section.features || [];

    // Update section heading if present
    if (section.heading) {
      const sectionHeading = featuresSection.querySelector('.section-heading, .tabs-heading, h2');
      if (sectionHeading) {
        sectionHeading.textContent = section.heading;
      }
    }

    // Handle tabs-style layout (landing page)
    if (tabs.length > 0) {
      // Update tab labels in header
      const tabItems = featuresSection.querySelectorAll('.tab-item');
      tabs.forEach((tab, index) => {
        if (tabItems[index]) {
          const tabText = tabItems[index].querySelector('.tab-text');
          if (tabText && tab.tabLabel) {
            tabText.textContent = tab.tabLabel;
          }
        }
      });

      // Update tab content
      const tabContents = featuresSection.querySelectorAll('.tab-content');
      tabs.forEach((tab, index) => {
        if (tabContents[index]) {
          // Update headline
          if (tab.headline) {
            const headline = tabContents[index].querySelector('.tab-text-content h3, .tab-headline');
            if (headline) {
              headline.textContent = tab.headline;
            }
          }

          // Update description
          if (tab.description) {
            const description = tabContents[index].querySelector('.tab-text-content p, .tab-description');
            if (description) {
              description.textContent = tab.description;
            }
          }

          // Update image
          if (tab.image) {
            const img = tabContents[index].querySelector('.tab-visual img');
            if (img) {
              img.src = tab.image;
              img.alt = tab.tabLabel || '';
            }
          }

          // Update video if present
          if (tab.video) {
            const video = tabContents[index].querySelector('.tab-visual video source');
            if (video) {
              video.src = tab.video;
              video.parentElement?.load();
            }
          }
        }
      });

      return;
    }

    // Fallback: Handle old features array format
    if (features.length > 0) {
      const featureItems = featuresSection.querySelectorAll('.tab-item .tab-text, .feature-item, .feature-title, .feature-card');
      features.forEach((feature, index) => {
        if (featureItems[index]) {
          const title = typeof feature === 'string' ? feature : feature.title;
          featureItems[index].textContent = title;
        }
      });
    }
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
   * Fields: heading, items[] (text, author, role, image), layout, rotationInterval
   */
  function renderTestimonialsSection(section) {
    if (!section || !section.items || section.items.length === 0) return;

    const testimonialsSection = document.querySelector('[data-cms="testimonials"]') ||
                                document.querySelector('.testimonials-section') ||
                                document.querySelector('.testimonials');

    if (!testimonialsSection) return;

    // Check for carousel-style structure (landing page style)
    const quoteEl = testimonialsSection.querySelector('#testimonialQuote, .testimonial-quote');
    const avatarEl = testimonialsSection.querySelector('#testimonialAvatar, .testimonial-avatar');
    const nameEl = testimonialsSection.querySelector('#testimonialName, .testimonial-name');
    const roleEl = testimonialsSection.querySelector('#testimonialRole, .testimonial-role');
    const indicatorsEl = testimonialsSection.querySelector('#testimonialIndicators, .testimonial-indicators');

    if (quoteEl && nameEl) {
      // Carousel-style testimonials (single visible, rotates)
      const items = section.items;
      let currentIndex = 0;

      function updateTestimonial(index) {
        const item = items[index];
        if (!item) return;

        // Support both field name variants (text/quote, author/name, image/avatar)
        const quoteText = item.text || item.quote || '';
        const authorName = item.author || item.name || '';
        const authorImage = item.image || item.avatar || '';

        if (quoteEl) quoteEl.textContent = '"' + quoteText + '"';
        if (avatarEl && authorImage) avatarEl.src = authorImage;
        if (nameEl) nameEl.textContent = authorName;
        if (roleEl) roleEl.textContent = item.role || '';

        // Update indicators
        if (indicatorsEl) {
          indicatorsEl.querySelectorAll('.testimonial-indicator').forEach((ind, i) => {
            ind.classList.toggle('active', i === index);
          });
        }
      }

      // Update indicators HTML if count changed
      if (indicatorsEl && items.length > 0) {
        indicatorsEl.innerHTML = items.map((_, i) =>
          `<span class="testimonial-indicator${i === 0 ? ' active' : ''}" data-index="${i}"><span class="testimonial-indicator-fill"></span></span>`
        ).join('');

        // Add click handlers to indicators
        indicatorsEl.querySelectorAll('.testimonial-indicator').forEach(ind => {
          ind.addEventListener('click', function() {
            currentIndex = parseInt(this.dataset.index);
            updateTestimonial(currentIndex);
          });
        });
      }

      // Set initial testimonial
      updateTestimonial(0);

      // Setup rotation if multiple items
      if (items.length > 1) {
        const interval = section.rotationInterval || 5000;
        setInterval(() => {
          currentIndex = (currentIndex + 1) % items.length;
          updateTestimonial(currentIndex);
        }, interval);
      }

      return;
    }

    // Fallback: Grid/list-style testimonials (multiple visible)
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

    // Update cards - get only the first set (not duplicates for infinite scroll)
    if (section.cards && section.cards.length > 0) {
      const carousel = trustedSection.querySelector('.trusted-carousel');
      if (carousel) {
        // Rebuild carousel with CMS data (includes duplicates for infinite scroll)
        let cardsHTML = '';
        section.cards.forEach(card => {
          const gradient = card.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
          cardsHTML += `
            <div class="trusted-card">
              <img src="${card.image || 'images/apple-iphone-16-pro-max-2024-medium.png'}" alt="${card.name || 'Restaurant Owner'}" style="background: ${gradient};">
              <div class="trusted-card-overlay">
                <div class="trusted-card-name">${card.name || ''}</div>
                <div class="trusted-card-role">${card.role || ''}</div>
              </div>
            </div>`;
        });
        // Duplicate for seamless infinite scroll
        carousel.innerHTML = cardsHTML + cardsHTML;
      }
    }
  }

  /**
   * Render Bento Section (Owner.com Style Feature Grid)
   * Fields: heading, heroImage, heroOverlayText, cards[] (label, title, image)
   */
  function renderBentoSection(section) {
    if (!section) return;

    const bentoSection = document.querySelector('[data-cms="bento"]') ||
                         document.querySelector('.bento-section') ||
                         document.querySelector('.bento');

    if (!bentoSection) return;

    // Update heading
    if (section.heading) {
      const h2 = bentoSection.querySelector('h2, .bento-title, .section-title');
      if (h2) {
        h2.innerHTML = section.heading;
      }
    }

    // Update hero image if present
    if (section.heroImage) {
      let heroContainer = bentoSection.querySelector('.bento-hero');
      if (heroContainer) {
        const heroImg = heroContainer.querySelector('img');
        if (heroImg) {
          heroImg.src = section.heroImage;
        }
      }
    }

    // Update hero overlay text
    if (section.heroOverlayText) {
      const heroOverlay = bentoSection.querySelector('.bento-hero-overlay');
      if (heroOverlay) {
        const overlayP = heroOverlay.querySelector('p');
        if (overlayP) {
          overlayP.innerHTML = section.heroOverlayText;
        } else {
          heroOverlay.innerHTML = '<p>' + section.heroOverlayText + '</p>';
        }
      }
    }

    // Update cards
    if (section.cards && section.cards.length > 0) {
      const cards = bentoSection.querySelectorAll('.bento-card, .card');
      section.cards.forEach((card, index) => {
        if (cards[index]) {
          const label = cards[index].querySelector('.bento-card-label, .card-label, .label, small');
          const title = cards[index].querySelector('.bento-card-title, .card-title, h3, .title');
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
      const subtitle = beliefsSection.querySelector('.section-subtitle, p:first-of-type');
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
   * Render Logo Cloud Section
   * Fields: heading, subheading, logos[] (name, url)
   */
  function renderLogoCloudSection(section) {
    if (!section) return;

    const logoCloudSection = document.querySelector('[data-cms="logocloud"]') ||
                              document.querySelector('.logo-cloud');

    if (!logoCloudSection) return;

    // Update heading
    if (section.heading) {
      const h2 = logoCloudSection.querySelector('h2, .logo-cloud-title');
      if (h2) {
        h2.textContent = section.heading;
      }
    }

    // Update subheading
    if (section.subheading) {
      const p = logoCloudSection.querySelector('.logo-cloud-header p, .logo-cloud-subtitle');
      if (p) {
        p.textContent = section.subheading;
      }
    }

    // Update logos - React style (SVG only, no text)
    if (section.logos && section.logos.length > 0) {
      const logoTrack = logoCloudSection.querySelector('.logo-cloud-track');
      if (logoTrack) {
        // Predefined logo SVG icons
        const logoIcons = {
          'Canpoy': '<svg width="40" height="40" viewBox="0 0 40 40"><rect x="5" y="5" width="30" height="30" rx="6" fill="currentColor"/></svg>',
          'Canva': '<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="currentColor"/></svg>',
          'Casetext': '<svg width="40" height="40" viewBox="0 0 40 40"><rect x="8" y="4" width="24" height="32" rx="3" fill="currentColor"/></svg>',
          'Strava': '<svg width="40" height="40" viewBox="0 0 40 40"><path d="M12 32 L20 12 L28 32 M20 12 L28 4 L36 12" stroke="currentColor" stroke-width="3" fill="none"/></svg>',
          'Descript': '<svg width="40" height="40" viewBox="0 0 40 40"><path d="M6 6 L26 6 L26 14 L14 14 L14 26 L26 26 L26 34 L6 34 Z" fill="currentColor"/></svg>',
          'Duolingo': '<svg width="40" height="40" viewBox="0 0 40 40"><ellipse cx="20" cy="20" rx="14" ry="17" fill="currentColor"/></svg>',
          'Faire': '<svg width="40" height="40" viewBox="0 0 40 40"><path d="M8 36 L20 8 L32 36 M12 28 L28 28" stroke="currentColor" stroke-width="3" fill="none"/></svg>',
          'Clearbit': '<svg width="40" height="40" viewBox="0 0 40 40"><polygon points="20,4 36,20 20,36 4,20" fill="currentColor"/></svg>'
        };
        const defaultIcon = '<svg width="40" height="40" viewBox="0 0 40 40"><rect x="5" y="5" width="30" height="30" rx="6" fill="currentColor"/></svg>';

        // Generate logo HTML - SVG only, no text (matches React style)
        let logosHTML = '';
        section.logos.forEach(logo => {
          const icon = logoIcons[logo.name] || defaultIcon;
          logosHTML += `<a href="${logo.url || '#'}" target="_blank" rel="noopener noreferrer" class="logo-cloud-item" title="${logo.name || ''}">${icon}</a>`;
        });
        // Triple for seamless loop
        logoTrack.innerHTML = logosHTML + logosHTML + logosHTML;
      }
    }
  }

  /**
   * Render Footer Section
   * Fields: columns[] (title, links[]), contact (phone, email), copyright
   */
  function renderFooterSection(section) {
    if (!section) return;

    const footerSection = document.querySelector('[data-cms="footer"]') ||
                           document.querySelector('.footer, footer');

    if (!footerSection) return;

    // Update columns
    if (section.columns && section.columns.length > 0) {
      const footerColumns = footerSection.querySelectorAll('.footer-column');
      section.columns.forEach((col, index) => {
        if (footerColumns[index]) {
          // Update column title
          const h4 = footerColumns[index].querySelector('h4');
          if (h4 && col.title) {
            h4.textContent = col.title;
          }

          // Update links
          if (col.links && col.links.length > 0) {
            const ul = footerColumns[index].querySelector('ul');
            if (ul) {
              ul.innerHTML = col.links.map(link =>
                `<li><a href="${link.url || '#'}">${link.text || ''}</a></li>`
              ).join('');
            }
          }
        }
      });
    }

    // Update contact info
    if (section.contact) {
      // Try to find contact column (usually last or has SUPPORT title)
      const supportColumn = footerSection.querySelector('.footer-column:last-child');
      if (supportColumn) {
        const contactLinks = supportColumn.querySelectorAll('a');
        contactLinks.forEach(link => {
          if (link.href.includes('tel:') && section.contact.phone) {
            link.textContent = section.contact.phone;
            link.href = 'tel:' + section.contact.phone.replace(/\s/g, '');
          }
          if (link.href.includes('mailto:') && section.contact.email) {
            link.textContent = section.contact.email;
            link.href = 'mailto:' + section.contact.email;
          }
        });
      }
    }

    // Update copyright
    if (section.copyright) {
      const copyright = footerSection.querySelector('.footer-bottom p, .copyright');
      if (copyright) {
        copyright.textContent = section.copyright;
      }
    }
  }

  /**
   * Render Chat Demo Section
   * Fields: userMessage, botMessage, userAvatar, userDelay, botDelay, textExpandDelay
   */
  function renderChatDemoSection(section) {
    if (!section) return;

    // Find chat demo container - look for various selectors
    const chatContainer = document.querySelector('[data-cms="chat-demo"]') ||
                          document.querySelector('.chat-message')?.closest('.w-full') ||
                          document.querySelector('.ai-hero-container > div:last-child');

    if (!chatContainer) {
      console.log('Flow CMS: Chat demo container not found');
      return;
    }

    // Update user message
    if (section.userMessage) {
      const userMsg = chatContainer.querySelector('[data-cms-field="userMessage"] p') ||
                      chatContainer.querySelector('.chat-message p');
      if (userMsg) {
        userMsg.textContent = section.userMessage;
      }
    }

    // Update bot message
    if (section.botMessage) {
      const botMsg = chatContainer.querySelector('[data-cms-field="botMessage"] p') ||
                     chatContainer.querySelector('.chat-response .prose p');
      if (botMsg) {
        botMsg.textContent = section.botMessage;
      }
    }

    // Update user avatar
    if (section.userAvatar) {
      const avatar = chatContainer.querySelector('[data-cms-field="userAvatar"]') ||
                     chatContainer.querySelector('img[alt="User Avatar"]');
      if (avatar) {
        avatar.src = section.userAvatar;
      }
    }

    // Update animation timing via data attributes on container
    if (chatContainer) {
      chatContainer.dataset.userDelay = section.userDelay || 500;
      chatContainer.dataset.botDelay = section.botDelay || 1200;
      chatContainer.dataset.textExpandDelay = section.textExpandDelay || 1800;
    }

    console.log('Flow CMS: Chat demo section updated');
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

      // Never show cookie banner on how-it-works page (it's a marketing/analysis page)
      const noCookiePages = ['how-it-works', 'landing'];
      if (pageData && pageData.showCookieBanner === true && !noCookiePages.includes(pageSlug)) {
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
