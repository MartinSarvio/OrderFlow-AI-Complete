/* ========================================
   FLOW Shared Animation Engine
   Lightweight, no dependencies
   ======================================== */

(function() {
  'use strict';

  // ---- SCROLL REVEAL (IntersectionObserver) ----
  function initScrollReveal() {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .blur-reveal, .draw-line');
    if (!els.length) return;
    
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    
    els.forEach(el => obs.observe(el));
  }

  // ---- WAVE TEXT (split into chars) ----
  function initWaveText() {
    document.querySelectorAll('.wave-text').forEach(el => {
      if (el.dataset.waveInit) return;
      el.dataset.waveInit = '1';
      const text = el.textContent;
      el.textContent = '';
      text.split('').forEach((ch, i) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch === ' ' ? '\u00A0' : ch;
        span.style.transitionDelay = (i * 0.03) + 's';
        el.appendChild(span);
      });
    });

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('.wave-text').forEach(el => obs.observe(el));
  }

  // ---- 3D TILT CARDS ----
  function initTiltCards() {
    document.querySelectorAll('.tilt-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
      });
    });
  }

  // ---- COUNTER ANIMATION ----
  function initCounters() {
    const counters = document.querySelectorAll('[data-count-to]');
    if (!counters.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !e.target.dataset.counted) {
          e.target.dataset.counted = '1';
          const target = parseInt(e.target.dataset.countTo);
          const suffix = e.target.dataset.countSuffix || '';
          const prefix = e.target.dataset.countPrefix || '';
          const duration = 2000;
          const start = performance.now();
          
          function step(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            const current = Math.round(target * eased);
            e.target.textContent = prefix + current.toLocaleString('da-DK') + suffix;
            if (progress < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => obs.observe(el));
  }

  // ---- MAGNETIC BUTTONS ----
  function initMagneticButtons() {
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
      });
    });
  }

  // ---- PARALLAX SCROLL ----
  function initParallax() {
    const els = document.querySelectorAll('[data-parallax]');
    if (!els.length) return;
    
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          els.forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.3;
            const rect = el.getBoundingClientRect();
            const offset = (rect.top + scrollY - window.innerHeight / 2) * speed;
            el.style.transform = `translateY(${offset * -0.1}px)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ---- ACCORDION ----
  function initAccordions() {
    document.querySelectorAll('.accordion-item').forEach(item => {
      const trigger = item.querySelector('.accordion-trigger');
      if (trigger) {
        trigger.addEventListener('click', () => {
          const wasOpen = item.classList.contains('open');
          // Close all in same parent
          item.parentElement.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
          if (!wasOpen) item.classList.add('open');
        });
      }
    });
  }

  // ---- STAGGER OBSERVER (for grids) ----
  function initStaggerChildren() {
    const containers = document.querySelectorAll('.stagger-children');
    if (!containers.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.reveal').forEach(child => child.classList.add('visible'));
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    containers.forEach(el => obs.observe(el));
  }

  // ---- ROTATE ON SCROLL ----
  function initRotateScroll() {
    const els = document.querySelectorAll('.rotate-scroll');
    if (!els.length) return;

    window.addEventListener('scroll', () => {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        els.forEach(el => {
          el.style.transform = `rotate(${scrollY * 0.05}deg)`;
        });
      });
    });
  }

  // ---- INIT ALL ----
  function init() {
    initScrollReveal();
    initWaveText();
    initTiltCards();
    initCounters();
    initMagneticButtons();
    initParallax();
    initAccordions();
    initStaggerChildren();
    initRotateScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
