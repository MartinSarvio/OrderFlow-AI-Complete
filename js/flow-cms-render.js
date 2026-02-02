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
   * Fields: headline, subheadline, alignment, buttons[]
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
   * Fields: images[], layout
   */
  function renderImagesSection(section) {
    if (!section || !section.images || section.images.length === 0) return;

    const imagesSection = document.querySelector('[data-cms="images"]') ||
                          document.querySelector('.images-section') ||
                          document.querySelector('.gallery');

    if (!imagesSection) return;

    const imageElements = imagesSection.querySelectorAll('img');

    section.images.forEach((image, index) => {
      if (imageElements[index] && image.url) {
        imageElements[index].src = image.url;
        if (image.alt) {
          imageElements[index].alt = image.alt;
        }
      }
    });
  }

  /**
   * Render Trusted Section (Testimonial Carousel)
   * Fields: heading, cards[] (name, role, quote, image, gradient)
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
   * Initialize CMS content on DOM ready
   */
  function init() {
    loadCMSContent();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
