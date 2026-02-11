// =====================================================
// ORDERFLOW AI - DRAG & DROP ENGINE (SortableJS)
// Only active when .edit-mode is on the body/app
// =====================================================

(function() {
  'use strict';

  const STORAGE_KEY = 'orderflow_layouts';
  let sortableInstances = [];
  let isEditMode = false;

  // ─── Sortable container config ───
  // Each entry: { selector, group, nested }
  const SORTABLE_CONTAINERS = [
    // Sidebar (logo + toggle + header kan flyttes)
    { selector: '.sidebar',                group: 'sidebar-top', handle: null, filter: '.sidebar-nav' },
    // Dashboard stat cards
    { selector: '.stats-primary',          group: 'stats',     handle: null },
    { selector: '.stats-secondary',        group: 'stats-sec', handle: null },
    // Dashboard quick actions
    { selector: '.dashboard-actions',      group: 'actions',   handle: null },
    // Sidebar nav
    { selector: '.sidebar-nav .nav-section', group: 'sidebar', handle: null },
    // Flyout panel items
    { selector: '.flyout-category-items',  group: 'flyout',    handle: null },
    { selector: '.flyout-content',         group: 'flyout-cats', handle: null },
    // Generic draggable containers
    { selector: '[data-sortable-group]',   group: null,        handle: null },
    // Page sections (children of .page)
    { selector: '.page',                   group: 'page-sections', handle: null, filter: '.page-title,h1,h2,script' },
    // Individual page content sections
    { selector: '.page-content',           group: 'page-content', handle: null },
  ];

  // ─── Layout persistence ───

  function getLayouts() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
  }

  function saveLayouts(layouts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts));
  }

  function containerKey(el) {
    // Build a unique key from id or path
    if (el.id) return el.id;
    const parent = el.parentElement;
    const parentKey = parent?.id || parent?.className?.split(' ')[0] || 'root';
    const idx = Array.from(parent?.children || []).indexOf(el);
    return parentKey + ':' + (el.className?.split(' ')[0] || 'el') + ':' + idx;
  }

  function getPageKey() {
    const activePage = document.querySelector('.page.active');
    return activePage ? activePage.id : 'unknown';
  }

  function saveContainerOrder(containerEl) {
    const key = containerKey(containerEl);
    const pageKey = getPageKey();
    const layouts = getLayouts();
    if (!layouts[pageKey]) layouts[pageKey] = {};

    // Save child order by a stable identifier (id or data-sort-id or index-based key)
    const childIds = Array.from(containerEl.children).map((child, i) => {
      return child.id || child.getAttribute('data-sort-id') || child.textContent?.trim().substring(0, 40) || ('item-' + i);
    });
    layouts[pageKey][key] = childIds;
    saveLayouts(layouts);
  }

  function restoreContainerOrder(containerEl) {
    const key = containerKey(containerEl);
    const pageKey = getPageKey();
    const layouts = getLayouts();
    const savedOrder = layouts?.[pageKey]?.[key];
    if (!savedOrder || !Array.isArray(savedOrder)) return;

    const children = Array.from(containerEl.children);
    const childMap = new Map();

    children.forEach((child, i) => {
      const cid = child.id || child.getAttribute('data-sort-id') || child.textContent?.trim().substring(0, 40) || ('item-' + i);
      childMap.set(cid, child);
    });

    // Reorder
    savedOrder.forEach(id => {
      const child = childMap.get(id);
      if (child) containerEl.appendChild(child);
    });
  }

  // ─── Restore all layouts on page load ───

  function restoreAllLayouts() {
    SORTABLE_CONTAINERS.forEach(cfg => {
      document.querySelectorAll(cfg.selector).forEach(el => {
        restoreContainerOrder(el);
      });
    });
  }

  // ─── Initialize Sortable instances ───

  function initSortables() {
    destroySortables();

    if (typeof Sortable === 'undefined') {
      console.warn('[DragDrop] SortableJS not loaded');
      return;
    }

    SORTABLE_CONTAINERS.forEach(cfg => {
      document.querySelectorAll(cfg.selector).forEach(el => {
        // Skip if no children or already has a sortable
        if (el.children.length < 2) return;

        const groupName = cfg.group || el.getAttribute('data-sortable-group') || 'default';

        const instance = Sortable.create(el, {
          group: groupName,
          animation: 200,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
          ghostClass: 'sortable-ghost',
          chosenClass: 'sortable-chosen',
          dragClass: 'sortable-drag',
          handle: cfg.handle || null,
          filter: cfg.filter || '',
          preventOnFilter: true,
          delay: 50,
          delayOnTouchOnly: true,
          touchStartThreshold: 5,
          forceFallback: false,
          fallbackOnBody: true,
          swapThreshold: 0.65,
          direction: 'horizontal',
          // Auto-detect direction
          direction: function(evt, target, dragEl) {
            if (!target) return 'vertical';
            const style = window.getComputedStyle(target);
            const display = style.display;
            const flexDir = style.flexDirection;
            const gridCols = style.gridTemplateColumns;
            if (display === 'flex' && flexDir === 'row') return 'horizontal';
            if (display === 'grid' && gridCols && gridCols !== 'none') return 'horizontal';
            return 'vertical';
          },
          onStart: function(evt) {
            document.body.classList.add('is-dragging');
            // Mark all valid containers as drop zones
            document.querySelectorAll('[data-sortable-active]').forEach(c => {
              c.classList.add('sortable-dropzone');
            });
          },
          onEnd: function(evt) {
            document.body.classList.remove('is-dragging');
            document.querySelectorAll('.sortable-dropzone').forEach(c => {
              c.classList.remove('sortable-dropzone');
            });
            // Save the new order
            if (evt.from) saveContainerOrder(evt.from);
            if (evt.to && evt.to !== evt.from) saveContainerOrder(evt.to);
          }
        });

        el.setAttribute('data-sortable-active', 'true');
        sortableInstances.push(instance);
      });
    });

    console.log('[DragDrop] Initialized', sortableInstances.length, 'sortable containers');
  }

  function destroySortables() {
    sortableInstances.forEach(s => {
      try { s.destroy(); } catch(e) {}
    });
    sortableInstances = [];
    document.querySelectorAll('[data-sortable-active]').forEach(el => {
      el.removeAttribute('data-sortable-active');
    });
  }

  // ─── Edit Mode Toggle ───

  function enableEditMode() {
    isEditMode = true;
    document.body.classList.add('edit-mode');
    initSortables();

    // Show reset layout button
    let resetBtn = document.getElementById('reset-layout-btn');
    if (!resetBtn) {
      resetBtn = document.createElement('button');
      resetBtn.id = 'reset-layout-btn';
      resetBtn.className = 'btn btn-ghost btn-sm reset-layout-btn';
      resetBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg> Nulstil layout';
      resetBtn.onclick = resetLayout;
      // Insert near the edit mode button
      const editBtn = document.getElementById('edit-mode-btn');
      if (editBtn?.parentElement) {
        editBtn.parentElement.insertBefore(resetBtn, editBtn.nextSibling);
      }
    }
    resetBtn.style.display = '';
  }

  function disableEditMode() {
    isEditMode = false;
    document.body.classList.remove('edit-mode');
    destroySortables();

    const resetBtn = document.getElementById('reset-layout-btn');
    if (resetBtn) resetBtn.style.display = 'none';
  }

  function resetLayout() {
    const pageKey = getPageKey();
    const layouts = getLayouts();
    delete layouts[pageKey];
    saveLayouts(layouts);
    // Reload to restore default DOM order
    window.location.reload();
  }

  // ─── Global toggleEditMode ───
  // Wrap or define the global toggleEditMode
  const originalToggleEditMode = window.toggleEditMode;

  window.toggleEditMode = function() {
    // Call original if it exists
    if (typeof originalToggleEditMode === 'function') {
      originalToggleEditMode();
    }

    // Toggle our drag-drop mode based on body class
    if (document.body.classList.contains('edit-mode')) {
      // Already added by original or by us - init sortables
      if (!isEditMode) enableEditMode();
    } else {
      // Check if we should add it (no original handler)
      if (!originalToggleEditMode) {
        if (isEditMode) {
          disableEditMode();
        } else {
          enableEditMode();
        }
      } else {
        disableEditMode();
      }
    }
  };

  // If no original toggleEditMode existed, manage the class ourselves
  if (!originalToggleEditMode) {
    window.toggleEditMode = function() {
      if (isEditMode) {
        disableEditMode();
        const btn = document.getElementById('edit-mode-btn');
        if (btn) btn.classList.remove('active');
      } else {
        enableEditMode();
        const btn = document.getElementById('edit-mode-btn');
        if (btn) btn.classList.add('active');
      }
    };
  }

  // ─── Init on DOM ready ───
  function init() {
    // Restore saved layouts immediately
    restoreAllLayouts();

    // Also restore when navigating pages (showPage override)
    const originalShowPage = window.showPage;
    if (typeof originalShowPage === 'function') {
      window.showPage = function() {
        originalShowPage.apply(this, arguments);
        // Slight delay to let DOM update
        setTimeout(() => {
          restoreAllLayouts();
          if (isEditMode) initSortables();
        }, 100);
      };
    }

    // Watch for edit-mode class changes via MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        if (m.attributeName === 'class') {
          const hasEditMode = document.body.classList.contains('edit-mode');
          if (hasEditMode && !isEditMode) {
            enableEditMode();
          } else if (!hasEditMode && isEditMode) {
            disableEditMode();
          }
        }
      });
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
