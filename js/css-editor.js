/**
 * Universal CSS Editor Panel for OrderFlow AI Edit Mode
 * Allows editing ANY CSS property on ANY element with live preview,
 * persistence, undo/redo, export, and search.
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'orderflow-css-editor-custom';
  const UNDO_LIMIT = 50;

  // CSS property categories
  const CATEGORIES = {
    'Layout': ['display','position','width','height','min-width','min-height','max-width','max-height','margin','margin-top','margin-right','margin-bottom','margin-left','padding','padding-top','padding-right','padding-bottom','padding-left','box-sizing','overflow','overflow-x','overflow-y','float','clear','visibility','opacity'],
    'Typography': ['font-family','font-size','font-weight','font-style','font-variant','line-height','letter-spacing','word-spacing','text-align','text-decoration','text-transform','text-indent','text-overflow','white-space','word-break','word-wrap','color'],
    'Colors & Background': ['background','background-color','background-image','background-position','background-size','background-repeat','background-attachment','background-clip','background-origin'],
    'Borders & Effects': ['border','border-top','border-right','border-bottom','border-left','border-width','border-style','border-color','border-radius','border-top-left-radius','border-top-right-radius','border-bottom-left-radius','border-bottom-right-radius','box-shadow','outline','outline-width','outline-style','outline-color','outline-offset'],
    'Positioning': ['top','right','bottom','left','z-index','inset'],
    'Flexbox': ['flex','flex-direction','flex-wrap','flex-flow','justify-content','align-items','align-content','align-self','flex-grow','flex-shrink','flex-basis','order','gap','row-gap','column-gap'],
    'Grid': ['grid-template-columns','grid-template-rows','grid-template-areas','grid-column','grid-row','grid-area','grid-auto-columns','grid-auto-rows','grid-auto-flow','grid-gap','place-items','place-content','place-self'],
    'Transforms & Animations': ['transform','transform-origin','transition','transition-property','transition-duration','transition-timing-function','transition-delay','animation','animation-name','animation-duration','animation-timing-function','animation-delay','animation-iteration-count','animation-direction','animation-fill-mode','animation-play-state','perspective','perspective-origin'],
  };

  // All known properties for "Other"
  const ALL_CATEGORIZED = new Set(Object.values(CATEGORIES).flat());

  // Color property names (for color picker)
  const COLOR_PROPS = new Set(['color','background-color','border-color','border-top-color','border-right-color','border-bottom-color','border-left-color','outline-color','text-decoration-color','caret-color','column-rule-color','fill','stroke']);

  // Unit-bearing properties
  const UNIT_PROPS = /width|height|margin|padding|top|right|bottom|left|font-size|line-height|letter-spacing|word-spacing|text-indent|border.*width|border.*radius|outline-width|outline-offset|gap|row-gap|column-gap|flex-basis|perspective|inset/i;

  let panel = null;
  let selectedElement = null;
  let selectorPath = '';
  let undoStack = [];
  let redoStack = [];
  let searchQuery = '';
  let collapsedCats = {};
  let customStyles = loadCustomStyles();
  let isActive = false;
  let clickHandler = null;
  let styleElement = null;

  // ---- Storage ----
  function loadCustomStyles() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch(e) { return {}; }
  }
  function saveCustomStyles() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customStyles));
  }

  // ---- Selector Generation ----
  function getSelector(el) {
    if (el.id) return '#' + el.id;
    const parts = [];
    while (el && el !== document.body && el !== document.documentElement) {
      let seg = el.tagName.toLowerCase();
      if (el.id) { parts.unshift('#' + el.id); break; }
      if (el.className && typeof el.className === 'string') {
        const cls = el.className.trim().split(/\s+/).filter(c => !c.startsWith('css-editor')).slice(0, 2).join('.');
        if (cls) seg += '.' + cls;
      }
      const parent = el.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
        if (siblings.length > 1) seg += ':nth-child(' + (Array.from(parent.children).indexOf(el) + 1) + ')';
      }
      parts.unshift(seg);
      el = parent;
    }
    return parts.join(' > ');
  }

  // ---- Undo/Redo ----
  function pushUndo(selector, prop, oldVal, newVal) {
    undoStack.push({ selector, prop, oldVal, newVal });
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    redoStack = [];
  }

  function undo() {
    if (!undoStack.length) return;
    const action = undoStack.pop();
    redoStack.push(action);
    applyStyleDirect(action.selector, action.prop, action.oldVal);
    if (selectedElement && getSelector(selectedElement) === action.selector) renderProperties();
  }

  function redo() {
    if (!redoStack.length) return;
    const action = redoStack.pop();
    undoStack.push(action);
    applyStyleDirect(action.selector, action.prop, action.newVal);
    if (selectedElement && getSelector(selectedElement) === action.selector) renderProperties();
  }

  // ---- Apply Styles ----
  function applyStyleDirect(selector, prop, value) {
    if (!customStyles[selector]) customStyles[selector] = {};
    if (value === '' || value === undefined) {
      delete customStyles[selector][prop];
      if (!Object.keys(customStyles[selector]).length) delete customStyles[selector];
    } else {
      customStyles[selector][prop] = value;
    }
    saveCustomStyles();
    injectStylesheet();
  }

  function injectStylesheet() {
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'css-editor-custom-styles';
      document.head.appendChild(styleElement);
    }
    const rules = [];
    for (const [sel, props] of Object.entries(customStyles)) {
      const decls = Object.entries(props).map(([p, v]) => `  ${p}: ${v} !important;`).join('\n');
      if (decls) rules.push(`${sel} {\n${decls}\n}`);
    }
    styleElement.textContent = rules.join('\n');
  }

  // ---- Panel Creation ----
  function createPanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'css-editor-panel';
    panel.innerHTML = `
      <div class="css-editor-header">
        <div class="css-editor-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          CSS Editor
        </div>
        <div class="css-editor-actions">
          <button onclick="window._cssEditor.undo()" title="Undo (Ctrl+Z)">↩</button>
          <button onclick="window._cssEditor.redo()" title="Redo (Ctrl+Y)">↪</button>
          <button onclick="window._cssEditor.copyCSS()" title="Copy CSS">📋</button>
          <button onclick="window._cssEditor.exportAll()" title="Export All">💾</button>
          <button onclick="window._cssEditor.resetElement()" title="Reset Element">🔄</button>
          <button onclick="window._cssEditor.closePanel()" title="Close" class="css-editor-close-btn">✕</button>
        </div>
      </div>
      <div class="css-editor-selector" id="css-editor-selector">No element selected</div>
      <div class="css-editor-search">
        <input type="text" id="css-editor-search" placeholder="Search CSS properties..." oninput="window._cssEditor.search(this.value)">
      </div>
      <div class="css-editor-props" id="css-editor-props"></div>
      <div class="css-editor-add-custom">
        <input type="text" id="css-editor-custom-prop" placeholder="Custom property name">
        <input type="text" id="css-editor-custom-val" placeholder="Value">
        <button onclick="window._cssEditor.addCustomProp()">+</button>
      </div>
    `;
    document.body.appendChild(panel);
  }

  // ---- Render Properties ----
  function renderProperties() {
    if (!selectedElement || !panel) return;
    const container = document.getElementById('css-editor-props');
    const computed = window.getComputedStyle(selectedElement);
    const sel = selectorPath;
    const overrides = customStyles[sel] || {};
    const query = searchQuery.toLowerCase();

    // Gather "Other" properties
    const otherProps = [];
    for (let i = 0; i < computed.length; i++) {
      const p = computed[i];
      if (!ALL_CATEGORIZED.has(p)) otherProps.push(p);
    }

    let html = '';
    const allCats = { ...CATEGORIES };
    if (otherProps.length) allCats['Other'] = otherProps;

    for (const [cat, props] of Object.entries(allCats)) {
      const filtered = query ? props.filter(p => p.includes(query)) : props;
      if (!filtered.length) continue;
      const collapsed = collapsedCats[cat];
      html += `<div class="css-editor-category">
        <div class="css-editor-cat-header" onclick="window._cssEditor.toggleCat('${cat}')">
          <span class="css-editor-cat-arrow">${collapsed ? '▸' : '▾'}</span>
          <span>${cat}</span>
          <span class="css-editor-cat-count">${filtered.length}</span>
        </div>
        <div class="css-editor-cat-body" style="display:${collapsed ? 'none' : 'block'}">`;

      for (const prop of filtered) {
        const val = overrides[prop] || computed.getPropertyValue(prop).trim();
        const isOverridden = prop in overrides;
        const isColor = COLOR_PROPS.has(prop) || (val && /^(#|rgb|hsl|transparent)/.test(val));
        const hasUnit = UNIT_PROPS.test(prop);

        html += `<div class="css-editor-prop-row ${isOverridden ? 'css-editor-overridden' : ''}">
          <label class="css-editor-prop-name" title="${prop}">${prop}</label>
          <div class="css-editor-prop-input-wrap">`;

        if (isColor) {
          // Parse color to hex for the picker
          const hex = colorToHex(val);
          html += `<input type="color" class="css-editor-color-picker" value="${hex}" data-prop="${prop}" onchange="window._cssEditor.setProp('${prop}', this.value)">`;
          html += `<input type="text" class="css-editor-prop-input" value="${escHtml(val)}" data-prop="${prop}" onchange="window._cssEditor.setProp('${prop}', this.value)" onkeydown="window._cssEditor.inputKey(event, '${prop}')">`;
        } else if (hasUnit) {
          const { num, unit } = parseUnit(val);
          html += `<input type="text" class="css-editor-prop-input css-editor-prop-input-unit" value="${escHtml(val)}" data-prop="${prop}" onchange="window._cssEditor.setProp('${prop}', this.value)" onkeydown="window._cssEditor.inputKey(event, '${prop}')">`;
          html += `<select class="css-editor-unit-select" data-prop="${prop}" onchange="window._cssEditor.changeUnit('${prop}', this.value, this)">
            ${['px','%','rem','em','vh','vw','auto',''].map(u => `<option ${u === unit ? 'selected' : ''}>${u}</option>`).join('')}
          </select>`;
        } else {
          html += `<input type="text" class="css-editor-prop-input" value="${escHtml(val)}" data-prop="${prop}" onchange="window._cssEditor.setProp('${prop}', this.value)" onkeydown="window._cssEditor.inputKey(event, '${prop}')">`;
        }

        if (isOverridden) {
          html += `<button class="css-editor-reset-btn" onclick="window._cssEditor.resetProp('${prop}')" title="Reset">✕</button>`;
        }
        html += `</div></div>`;
      }
      html += `</div></div>`;
    }
    container.innerHTML = html;
  }

  // ---- Helpers ----
  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }

  function colorToHex(val) {
    if (!val || val === 'transparent') return '#000000';
    if (val.startsWith('#')) return val.length === 4 ? '#' + val[1]+val[1]+val[2]+val[2]+val[3]+val[3] : val.substring(0, 7);
    const m = val.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m) return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
    // Use temp element
    const d = document.createElement('div');
    d.style.color = val;
    document.body.appendChild(d);
    const c = getComputedStyle(d).color;
    document.body.removeChild(d);
    const m2 = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (m2) return '#' + [m2[1],m2[2],m2[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
    return '#000000';
  }

  function parseUnit(val) {
    if (!val || val === 'auto') return { num: '', unit: 'auto' };
    const m = String(val).match(/^(-?[\d.]+)(px|%|rem|em|vh|vw)?$/);
    if (m) return { num: m[1], unit: m[2] || 'px' };
    return { num: val, unit: '' };
  }

  // ---- Public API ----
  function setProp(prop, value) {
    if (!selectedElement) return;
    const sel = selectorPath;
    const old = (customStyles[sel] && customStyles[sel][prop]) || window.getComputedStyle(selectedElement).getPropertyValue(prop).trim();
    pushUndo(sel, prop, old, value);
    applyStyleDirect(sel, prop, value);
    renderProperties();
  }

  function resetProp(prop) {
    if (!selectedElement) return;
    const sel = selectorPath;
    const old = customStyles[sel] && customStyles[sel][prop];
    if (old !== undefined) {
      pushUndo(sel, prop, old, '');
      applyStyleDirect(sel, prop, '');
      renderProperties();
    }
  }

  function resetElement() {
    if (!selectedElement) return;
    const sel = selectorPath;
    if (customStyles[sel]) {
      // Push each prop to undo
      for (const [p, v] of Object.entries(customStyles[sel])) {
        pushUndo(sel, p, v, '');
      }
      delete customStyles[sel];
      saveCustomStyles();
      injectStylesheet();
      renderProperties();
    }
  }

  function changeUnit(prop, newUnit, selectEl) {
    if (!selectedElement) return;
    const row = selectEl.closest('.css-editor-prop-input-wrap');
    const input = row.querySelector('.css-editor-prop-input');
    const { num } = parseUnit(input.value);
    const newVal = newUnit === 'auto' ? 'auto' : (num || '0') + newUnit;
    input.value = newVal;
    setProp(prop, newVal);
  }

  function inputKey(e, prop) {
    if (e.key === 'Enter') {
      setProp(prop, e.target.value);
    }
    // Arrow up/down for numbers
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const { num, unit } = parseUnit(e.target.value);
      const n = parseFloat(num);
      if (!isNaN(n)) {
        const step = e.shiftKey ? 10 : 1;
        const newNum = e.key === 'ArrowUp' ? n + step : n - step;
        const newVal = newNum + (unit || '');
        e.target.value = newVal;
        setProp(prop, newVal);
        e.preventDefault();
      }
    }
  }

  function copyCSS() {
    if (!selectedElement) return;
    const sel = selectorPath;
    const overrides = customStyles[sel];
    if (!overrides || !Object.keys(overrides).length) {
      showToast('No custom styles to copy');
      return;
    }
    const css = `${sel} {\n${Object.entries(overrides).map(([p,v]) => `  ${p}: ${v};`).join('\n')}\n}`;
    navigator.clipboard.writeText(css).then(() => showToast('CSS copied!')).catch(() => showToast('Copy failed'));
  }

  function exportAll() {
    const rules = [];
    for (const [sel, props] of Object.entries(customStyles)) {
      const decls = Object.entries(props).map(([p,v]) => `  ${p}: ${v};`).join('\n');
      if (decls) rules.push(`${sel} {\n${decls}\n}`);
    }
    if (!rules.length) { showToast('No custom styles to export'); return; }
    const css = `/* OrderFlow CSS Editor - Custom Styles */\n/* Exported: ${new Date().toISOString()} */\n\n${rules.join('\n\n')}\n`;
    const blob = new Blob([css], { type: 'text/css' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'orderflow-custom-styles.css';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Styles exported!');
  }

  function addCustomProp() {
    const propInput = document.getElementById('css-editor-custom-prop');
    const valInput = document.getElementById('css-editor-custom-val');
    if (propInput.value && valInput.value && selectedElement) {
      setProp(propInput.value.trim(), valInput.value.trim());
      propInput.value = '';
      valInput.value = '';
    }
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'css-editor-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  }

  function search(q) {
    searchQuery = q;
    renderProperties();
  }

  function toggleCat(cat) {
    collapsedCats[cat] = !collapsedCats[cat];
    renderProperties();
  }

  function selectElement(el) {
    if (el === panel || panel?.contains(el)) return;
    // Remove highlight from previous
    if (selectedElement) selectedElement.classList.remove('css-editor-selected');
    selectedElement = el;
    selectedElement.classList.add('css-editor-selected');
    selectorPath = getSelector(el);
    document.getElementById('css-editor-selector').textContent = selectorPath;
    document.getElementById('css-editor-selector').title = selectorPath;
    renderProperties();
    if (panel) panel.classList.add('css-editor-open');
  }

  function closePanel() {
    if (selectedElement) selectedElement.classList.remove('css-editor-selected');
    selectedElement = null;
    if (panel) panel.classList.remove('css-editor-open');
  }

  // ---- Activation ----
  function activate() {
    if (isActive) return;
    isActive = true;
    createPanel();
    injectStylesheet();

    clickHandler = function(e) {
      if (!document.body.classList.contains('edit-mode')) return;
      if (e.target === panel || panel?.contains(e.target)) return;
      // Don't intercept edit-mode-sidebar clicks
      if (e.target.closest('.edit-mode-sidebar')) return;
      if (e.target.closest('.topbar')) return;
      e.preventDefault();
      e.stopPropagation();
      selectElement(e.target);
    };
    document.addEventListener('click', clickHandler, true);

    // Keyboard shortcuts
    document.addEventListener('keydown', keyHandler);
  }

  function deactivate() {
    if (!isActive) return;
    isActive = false;
    closePanel();
    if (clickHandler) {
      document.removeEventListener('click', clickHandler, true);
      clickHandler = null;
    }
    document.removeEventListener('keydown', keyHandler);
  }

  function keyHandler(e) {
    if (!isActive) return;
    if (e.target.closest('#css-editor-panel')) {
      // Let inputs work normally except for our shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
      return;
    }
    if (e.key === 'Escape') closePanel();
  }

  // ---- Watch for edit mode toggle ----
  const observer = new MutationObserver(function(mutations) {
    for (const m of mutations) {
      if (m.attributeName === 'class') {
        if (document.body.classList.contains('edit-mode')) {
          activate();
        } else {
          deactivate();
        }
      }
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // If already in edit mode
  if (document.body.classList.contains('edit-mode')) activate();

  // Apply saved styles on load
  injectStylesheet();

  // ---- Expose API ----
  window._cssEditor = {
    setProp, resetProp, resetElement, changeUnit, inputKey,
    copyCSS, exportAll, addCustomProp, search, toggleCat,
    undo, redo, closePanel, activate, deactivate
  };
})();
