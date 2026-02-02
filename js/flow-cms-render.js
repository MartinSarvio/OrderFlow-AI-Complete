/**
 * Flow CMS Dynamic Content Renderer
 * This script reads CMS content from localStorage and applies it to Flow landing pages.
 * Include this script at the end of any editable Flow page.
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

  const storageKey = 'flow_page_' + pageSlug;

  /**
   * Load and apply CMS content
   */
  function loadCMSContent() {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      console.log('Flow CMS: No saved content for ' + pageSlug + ', using defaults');
      return;
    }

    try {
      const sections = JSON.parse(saved);

      sections.forEach(section => {
        // Skip locked sections (header/footer)
        if (section.locked) return;

        renderSection(section);
      });

      console.log('Flow CMS: Content loaded for ' + pageSlug);
    } catch (e) {
      console.warn('Flow CMS: Error loading content for ' + pageSlug, e);
    }
  }

  /**
   * Render a section based on its type
   */
  function renderSection(section) {
    switch (section.type) {
      case 'Hero Sektion':
        renderHeroSection(section.content);
        break;
      case 'Features':
        renderFeaturesSection(section.content);
        break;
      case 'Call to Action':
        renderCTASection(section.content);
        break;
      default:
        // Unknown section type
        break;
    }
  }

  /**
   * Render Hero Section
   */
  function renderHeroSection(content) {
    if (!content) return;

    // Find hero section (try data attribute first, then common classes)
    const heroSection = document.querySelector('[data-cms="hero"]') ||
                        document.querySelector('.hero-section') ||
                        document.querySelector('.hero');

    if (!heroSection) return;

    // Update title
    if (content.title) {
      const h1 = heroSection.querySelector('h1');
      if (h1) {
        // Check if the original title has special formatting (like <span class="big">)
        // If so, try to preserve the structure or replace entirely
        const hasSpecialFormatting = h1.querySelector('.big, .highlight, .accent');

        if (hasSpecialFormatting) {
          // Replace with plain text (CMS doesn't support special formatting yet)
          h1.innerHTML = content.title;
        } else {
          h1.textContent = content.title;
        }
      }
    }

    // Update subtitle/description
    if (content.subtitle) {
      const p = heroSection.querySelector('.hero-content p, .hero-description, p');
      if (p) {
        p.textContent = content.subtitle;
      }
    }

    // Update CTA button
    if (content.ctaText) {
      const ctaBtn = heroSection.querySelector('.button-white, .hero-cta, .cta-button, .hero-buttons a:first-child');
      if (ctaBtn) {
        ctaBtn.textContent = content.ctaText;
        if (content.ctaUrl) {
          ctaBtn.href = content.ctaUrl;
        }
      }
    }
  }

  /**
   * Render Features Section
   */
  function renderFeaturesSection(content) {
    if (!content || !content.items || content.items.length === 0) return;

    // Find features section
    const featuresSection = document.querySelector('[data-cms="features"]') ||
                            document.querySelector('.features-section') ||
                            document.querySelector('.tabs-header');

    if (!featuresSection) return;

    // Try to find feature items
    const featureItems = featuresSection.querySelectorAll('.tab-item .tab-text, .feature-item, .feature-title');

    content.items.forEach((item, index) => {
      if (featureItems[index]) {
        featureItems[index].textContent = item;
      }
    });
  }

  /**
   * Render Call to Action Section
   */
  function renderCTASection(content) {
    if (!content) return;

    // Find CTA section
    const ctaSection = document.querySelector('[data-cms="cta"]') ||
                       document.querySelector('.cta-section') ||
                       document.querySelector('.cta-banner');

    if (!ctaSection) return;

    // Update title
    if (content.title) {
      const h2 = ctaSection.querySelector('h2, .cta-title');
      if (h2) {
        h2.textContent = content.title;
      }
    }

    // Update button text
    if (content.buttonText) {
      const btn = ctaSection.querySelector('.button, .cta-button, a.btn');
      if (btn) {
        btn.textContent = content.buttonText;
      }
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
