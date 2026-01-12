// 2025-12-25T21:21:00Z 🟡🟡🟡 - [ADMIN MENU EDITOR] Custom drag-and-drop menu editor
// ⚠️⚠️⚠️ - [ADMIN MENU EDITOR] REFACTORED: Replaced JSONEditor with custom visual editor using SortableJS
(function initAdminMenuEditor() {
  'use strict';

  // 🟡🟡🟡 - [STATE] Editor state management
  let menuData = null;
  let originalMenuData = null;
  let sortableInstance = null;
  let nestedSortableInstances = {}; // 🟡🟡🟡 - [NESTED SORTABLE] Store nested sortable instances by section key
  let currentMenuState = {}; // Current state of menu sections
  let expandedSections = new Set(); // 🟡🟡🟡 - [EXPANDED STATE] Track which sections are expanded to persist across re-renders

  // 🟡🟡🟡 - [INITIALIZATION] Read menu data from DOM data attributes
  function readMenuDataFromDOM() {
    // 🟡🟡🟡 - [DOM DATA] Get menu data from menu-editor-container div data attributes
    const container = document.getElementById('menu-editor-container');
    if (!container) {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Menu editor container not found');
      const messageEl = document.getElementById('admin-message');
      if (messageEl) {
        messageEl.textContent = 'Menu editor container not found. Please refresh the page.';
        messageEl.className = 'admin-message error';
        messageEl.style.display = 'block';
      }
      return null;
    }

    try {
      // 🟡🟡🟡 - [DATA ATTRIBUTES] Read data from data attributes
      const menuItemsAttr = container.getAttribute('data-menu-items');
      const menuNameAttr = container.getAttribute('data-menu-name');
      const themeAttr = container.getAttribute('data-theme');

      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Reading menu data from DOM attributes');
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu items attr:', menuItemsAttr ? 'present' : 'missing');
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu name attr:', menuNameAttr);
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Theme attr:', themeAttr);

      // 🟡🟡🟡 - [PARSE DATA] Parse menu items JSON
      let menuItems = null;
      if (menuItemsAttr && menuItemsAttr !== 'null' && menuItemsAttr !== '') {
        try {
          menuItems = JSON.parse(menuItemsAttr);
        } catch (parseErr) {
          console.error('❗❗❗ - [ADMIN MENU EDITOR] Error parsing menu items JSON:', parseErr);
          console.error('❗❗❗ - [ADMIN MENU EDITOR] Raw menu items:', menuItemsAttr);
        }
      }

      const data = {
        menu: menuItems,
        menuName: menuNameAttr && menuNameAttr !== 'null' ? menuNameAttr : null,
        theme: themeAttr || 'default'
      };

      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu data parsed successfully:', {
        hasMenu: data.menu !== null,
        menuName: data.menuName,
        theme: data.theme
      });

      return data;
    } catch (err) {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Error reading menu data from DOM:', err);
      const messageEl = document.getElementById('admin-message');
      if (messageEl) {
        messageEl.textContent = 'Error reading menu data. Please refresh the page.';
        messageEl.className = 'admin-message error';
        messageEl.style.display = 'block';
      }
      return null;
    }
  }

  // 🟡🟡🟡 - [SECTION RENDERING] Get next available section key
  function getNextSectionKey() {
    const keys = Object.keys(currentMenuState);
    if (keys.length === 0) return 'section1';
    
    const numbers = keys
      .map(key => {
        const match = key.match(/^section(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `section${maxNum + 1}`;
  }

  // 🟡🟡🟡 2025-01-08 - [AUTO-GENERATE KEY] Get next available nested item key
  function generateNextNestedItemKey(sectionKey, itemType) {
    console.log('🟡🟡🟡 - [AUTO-GENERATE KEY] Generating key for section:', sectionKey, 'itemType:', itemType);
    
    const section = currentMenuState[sectionKey];
    if (!section) {
      console.error('❗❗❗ - [AUTO-GENERATE KEY] Section not found:', sectionKey);
      return `${itemType}1`;
    }

    // 🟡🟡🟡 2025-01-08 - Get existing keys based on item type
    let existingKeys = [];
    if (itemType === 'addon') {
      existingKeys = section['addon-items'] ? Object.keys(section['addon-items']) : [];
    } else {
      existingKeys = section.content ? Object.keys(section.content) : [];
    }

    // 🟡🟡🟡 2025-01-08 - Find the highest number for this item type
    const numbers = existingKeys
      .map(key => {
        // Match patterns like "radio1", "checkbox2", "checbox3" (note typo in original data)
        const match = key.match(new RegExp(`^${itemType}(\\d+)$`, 'i'));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    const maxNum = numbers.length > 0 ? Math.max(...numbers) : 0;
    const newKey = `${itemType}${maxNum + 1}`;
    
    console.log('✅✅✅ - [AUTO-GENERATE KEY] Generated key:', newKey, 'from existing keys:', existingKeys);
    return newKey;
  }

  // 🟡🟡🟡 - [SECTION RENDERING] Get preview text for section
  function getSectionPreview(section) {
    const htmlType = section['html-type'] || 'unknown';
    
    if (htmlType === 'h1' || htmlType === 'h2' || htmlType === 'p') {
      const content = section.content;
      if (typeof content === 'string') {
        return content.length > 50 ? content.substring(0, 50) + '...' : content;
      }
      return 'Text content';
    }
    
    if (htmlType === 'image') {
      return section.src ? `Image: ${section.src}` : 'Image (no source)';
    }
    
    if (htmlType === 'radio-group') {
      const content = section.content || {};
      const count = Object.keys(content).length;
      return `Radio Group (${count} options)`;
    }
    
    if (htmlType === 'checkbox-group') {
      const content = section.content || {};
      const count = Object.keys(content).length;
      return `Checkbox Group (${count} items)`;
    }
    
    if (htmlType === 'div-group') {
      const content = section.content || {};
      const count = Object.keys(content).length;
      return `Div Group (${count} items)`;
    }
    
    if (htmlType === 'unordered-list') {
      const content = section.content;
      if (Array.isArray(content)) {
        return `List (${content.length} items)`;
      }
      return 'List';
    }
    
    return 'Section';
  }

  // 🟡🟡🟡 - [SECTION RENDERING] Render section card
  function renderSectionCard(sectionKey, section) {
    const htmlType = section['html-type'] || 'unknown';
    const order = section.order || 0;
    const preview = getSectionPreview(section);
    const hasNested = htmlType === 'radio-group' || htmlType === 'checkbox-group' || 
                      htmlType === 'div-group' || section['addon-items'] || 
                      (htmlType === 'radio-group' && section.content && 
                       Object.values(section.content).some(r => r.popup));

    const card = document.createElement('div');
    card.className = 'admin-section-card';
    card.dataset.sectionKey = sectionKey;
    
    card.innerHTML = `
      <div class="admin-section-header">
        <div class="admin-section-header-left">
          <span class="admin-section-drag-handle" title="Drag to reorder">☰</span>
          <span class="admin-section-order">#${order}</span>
          <span class="admin-section-type-badge admin-section-type-${htmlType}">${htmlType}</span>
          <span class="admin-section-key">${sectionKey}</span>
        </div>
        <div class="admin-section-header-right">
          ${hasNested ? '<button class="admin-expand-toggle" data-section-key="' + sectionKey + '">' + (expandedSections.has(sectionKey) ? '▲' : '▼') + '</button>' : ''}
          <button class="admin-section-edit" data-section-key="${sectionKey}" title="Edit section">✏️</button>
          <button class="admin-section-delete" data-section-key="${sectionKey}" title="Delete section">❌</button>
        </div>
      </div>
      <div class="admin-section-content">
        <div class="admin-section-preview">${escapeHtml(preview)}</div>
        ${hasNested ? '<div class="admin-nested-content" data-section-key="' + sectionKey + '" style="' + (expandedSections.has(sectionKey) ? 'display: block;' : 'display: none;') + '"></div>' : ''}
      </div>
    `;

    // 🟡🟡🟡 - [NESTED CONTENT] Render nested content if applicable
    if (hasNested) {
      const nestedContainer = card.querySelector('.admin-nested-content');
      if (nestedContainer) {
        renderNestedContent(nestedContainer, sectionKey, section);
      }
    }

    // 🟡🟡🟡 - [EVENT LISTENERS] Attach event listeners
    const editBtn = card.querySelector('.admin-section-edit');
    const deleteBtn = card.querySelector('.admin-section-delete');
    const expandBtn = card.querySelector('.admin-expand-toggle');

    if (editBtn) {
      editBtn.addEventListener('click', () => editSection(sectionKey));
    }
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => deleteSection(sectionKey));
    }
    if (expandBtn) {
      expandBtn.addEventListener('click', () => toggleNestedContent(sectionKey));
    }

    // 🟡🟡🟡 - [ADD BUTTON] Create and append "+" button after section card
    const addButton = createAddSectionButton(sectionKey);

    // 🟡🟡🟡 - [WRAPPER] Wrap card and add button in a container
    const wrapper = document.createElement('div');
    wrapper.className = 'admin-section-wrapper';
    wrapper.appendChild(card);
    wrapper.appendChild(addButton);

    return wrapper;
  }

  // 🟡🟡🟡 - [NESTED CONTENT] Render nested content (radio options, checkboxes, addons, popups)
  function renderNestedContent(container, sectionKey, section) {
    const htmlType = section['html-type'] || '';
    
    if (htmlType === 'radio-group' && section.content) {
      const content = section.content;
      Object.keys(content).forEach(radioKey => {
        const radio = content[radioKey];
        const hasPopup = radio.popup && Object.keys(radio.popup).length > 0;
        const item = document.createElement('div');
        item.className = 'admin-nested-item admin-radio-item';
        item.dataset.itemKey = radioKey; // 🟡🟡🟡 - [NESTED SORTABLE] Store item key for reordering
        item.innerHTML = `
          <div class="admin-nested-item-header">
            <span class="admin-nested-item-drag-handle" title="Drag to reorder">☰</span>
            <strong>${escapeHtml(radio.label || radioKey)}</strong>
            <span class="admin-nested-item-price"><img src="/public/dirham.svg" alt="AED" class="admin-dirham-icon" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block; margin-right: 0.25em;">${radio.price || 0} ${radio['price-basis'] || ''}</span>
            ${hasPopup ? '<button class="admin-expand-toggle-nested" data-section-key="' + sectionKey + '" data-radio-key="' + radioKey + '">▼</button>' : ''}
            <button class="admin-nested-item-edit" data-section-key="${sectionKey}" data-radio-key="${radioKey}">✏️</button>
            <button class="admin-nested-item-delete" data-section-key="${sectionKey}" data-radio-key="${radioKey}">❌</button>
          </div>
          ${radio.description ? '<div class="admin-nested-item-description">' + escapeHtml(radio.description) + '</div>' : ''}
          ${hasPopup ? '<div class="admin-popup-content" data-section-key="' + sectionKey + '" data-radio-key="' + radioKey + '" style="display: none;"></div>' : ''}
        `;
        
        if (hasPopup) {
          const popupContainer = item.querySelector('.admin-popup-content');
          if (popupContainer) {
            // 🟡🟡🟡 - [POPUP CONTENT] Pass sectionKey and radioKey for editing functionality
            renderPopupContent(popupContainer, radio.popup, sectionKey, radioKey);
          }
          const popupToggle = item.querySelector('.admin-expand-toggle-nested');
          if (popupToggle) {
            popupToggle.addEventListener('click', () => togglePopupContent(sectionKey, radioKey));
          }
        }
        
        const editBtn = item.querySelector('.admin-nested-item-edit');
        const deleteBtn = item.querySelector('.admin-nested-item-delete');
        if (editBtn) {
          editBtn.addEventListener('click', () => editRadioOption(sectionKey, radioKey));
        }
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => deleteRadioOption(sectionKey, radioKey));
        }
        
        // 🟡🟡🟡 - [ADD BUTTON] Add "+" button after nested item
        const addNestedButton = createAddNestedItemButton(sectionKey, 'radio', radioKey);
        
        container.appendChild(item);
        container.appendChild(addNestedButton);
      });
    } else if (htmlType === 'checkbox-group' && section.content) {
      const content = section.content;
      Object.keys(content).forEach(checkboxKey => {
        const checkbox = content[checkboxKey];
        const item = document.createElement('div');
        item.className = 'admin-nested-item admin-checkbox-item';
        item.dataset.itemKey = checkboxKey; // 🟡🟡🟡 - [NESTED SORTABLE] Store item key for reordering
        item.innerHTML = `
          <div class="admin-nested-item-header">
            <span class="admin-nested-item-drag-handle" title="Drag to reorder">☰</span>
            <strong>${escapeHtml(checkbox.label || checkboxKey)}</strong>
            <span class="admin-nested-item-price"><img src="/public/dirham.svg" alt="AED" class="admin-dirham-icon" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block; margin-right: 0.25em;">${checkbox.price || 0} ${checkbox['price-basis'] || ''}</span>
            <button class="admin-nested-item-edit" data-section-key="${sectionKey}" data-checkbox-key="${checkboxKey}">✏️</button>
            <button class="admin-nested-item-delete" data-section-key="${sectionKey}" data-checkbox-key="${checkboxKey}">❌</button>
          </div>
        `;
        
        const editBtn = item.querySelector('.admin-nested-item-edit');
        const deleteBtn = item.querySelector('.admin-nested-item-delete');
        if (editBtn) {
          editBtn.addEventListener('click', () => editCheckboxItem(sectionKey, checkboxKey));
        }
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => deleteCheckboxItem(sectionKey, checkboxKey));
        }
        
        // 🟡🟡🟡 - [ADD BUTTON] Add "+" button after nested item
        const addNestedButton = createAddNestedItemButton(sectionKey, 'checkbox', checkboxKey);
        
        container.appendChild(item);
        container.appendChild(addNestedButton);
      });
    } else if (htmlType === 'div-group' && section.content) {
      const content = section.content;
      Object.keys(content).forEach(divKey => {
        const div = content[divKey];
        const item = document.createElement('div');
        item.className = 'admin-nested-item admin-div-item';
        item.dataset.itemKey = divKey; // 🟡🟡🟡 - [NESTED SORTABLE] Store item key for reordering
        item.innerHTML = `
          <div class="admin-nested-item-header">
            <span class="admin-nested-item-drag-handle" title="Drag to reorder">☰</span>
            <strong>${escapeHtml(div.label || divKey)}</strong>
            <span class="admin-nested-item-price"><img src="/public/dirham.svg" alt="AED" class="admin-dirham-icon" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block; margin-right: 0.25em;">${div.price || 0} ${div['price-basis'] || ''}</span>
            <button class="admin-nested-item-edit" data-section-key="${sectionKey}" data-div-key="${divKey}">✏️</button>
            <button class="admin-nested-item-delete" data-section-key="${sectionKey}" data-div-key="${divKey}">❌</button>
          </div>
        `;
        
        const editBtn = item.querySelector('.admin-nested-item-edit');
        const deleteBtn = item.querySelector('.admin-nested-item-delete');
        if (editBtn) {
          editBtn.addEventListener('click', () => editDivItem(sectionKey, divKey));
        }
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => deleteDivItem(sectionKey, divKey));
        }
        
        // 🟡🟡🟡 - [ADD BUTTON] Add "+" button after nested item
        const addNestedButton = createAddNestedItemButton(sectionKey, 'div', divKey);
        
        container.appendChild(item);
        container.appendChild(addNestedButton);
      });
    } else if (section['addon-items']) {
      const addons = section['addon-items'];
      Object.keys(addons).forEach(addonKey => {
        const addon = addons[addonKey];
        const item = document.createElement('div');
        item.className = 'admin-nested-item admin-addon-item';
        item.dataset.itemKey = addonKey; // 🟡🟡🟡 - [NESTED SORTABLE] Store item key for reordering
        item.innerHTML = `
          <div class="admin-nested-item-header">
            <span class="admin-nested-item-drag-handle" title="Drag to reorder">☰</span>
            <strong>${escapeHtml(addon.label || addonKey)}</strong>
            <span class="admin-nested-item-price"><img src="/public/dirham.svg" alt="AED" class="admin-dirham-icon" style="width: 1em; height: 1em; vertical-align: middle; display: inline-block; margin-right: 0.25em;">${addon.price || 0} ${addon['price-basis'] || ''}</span>
            <button class="admin-nested-item-edit" data-section-key="${sectionKey}" data-addon-key="${addonKey}">✏️</button>
            <button class="admin-nested-item-delete" data-section-key="${sectionKey}" data-addon-key="${addonKey}">❌</button>
          </div>
        `;
        
        const editBtn = item.querySelector('.admin-nested-item-edit');
        const deleteBtn = item.querySelector('.admin-nested-item-delete');
        if (editBtn) {
          editBtn.addEventListener('click', () => editAddonItem(sectionKey, addonKey));
        }
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => deleteAddonItem(sectionKey, addonKey));
        }
        
        // 🟡🟡🟡 - [ADD BUTTON] Add "+" button after nested item
        const addNestedButton = createAddNestedItemButton(sectionKey, 'addon', addonKey);
        
        container.appendChild(item);
        container.appendChild(addNestedButton);
      });
    }

    // 🟡🟡🟡 - [NESTED SORTABLE] Initialize SortableJS for nested content container if visible
    // Note: Only initialize if container is visible (not hidden)
    // If hidden, it will be initialized when expanded via toggleNestedContent()
    if (container.style.display !== 'none') {
      initializeNestedSortable(container, sectionKey, section);
    }
  }

  // 🟡🟡🟡 - [NESTED CONTENT] Render popup content (nested sections within radio popup)
  function renderPopupContent(container, popup, sectionKey, radioKey) {
    Object.keys(popup).forEach(popupSectionKey => {
      const popupSection = popup[popupSectionKey];
      const item = document.createElement('div');
      item.className = 'admin-popup-section';
      item.innerHTML = `
        <div class="admin-popup-section-header">
          <span class="admin-popup-section-type">${popupSection['html-type'] || 'unknown'}</span>
          <span class="admin-popup-section-preview">${escapeHtml(getSectionPreview(popupSection))}</span>
          <button class="admin-popup-section-edit" data-section-key="${sectionKey}" data-radio-key="${radioKey}" data-popup-section-key="${popupSectionKey}">✏️</button>
        </div>
      `;
      
      const editBtn = item.querySelector('.admin-popup-section-edit');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          // 🟡🟡🟡 - [POPUP EDIT] Edit popup section
          editPopupSection(sectionKey, radioKey, popupSectionKey);
        });
      }
      
      container.appendChild(item);
    });
  }

  // 🟡🟡🟡 - [UTILITY] Escape HTML to prevent XSS
  function escapeHtml(text) {
    if (typeof text !== 'string') return String(text);
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 🟡🟡🟡 - [UTILITY] Get plus icon HTML for add buttons
  function getPlusIconHTML() {
    return '<img src="/public/kloi_plus_sign.svg" alt="Plus sign" class="kloi_plus_icon">';
  }

  // 🟡🟡🟡 - [UTILITY] Create add section button after a section
  function createAddSectionButton(sectionKey) {
    const addButton = document.createElement('button');
    addButton.className = 'admin-add-section-after';
    addButton.innerHTML = getPlusIconHTML();
    addButton.title = 'Add section after this';
    addButton.dataset.insertAfterSectionKey = sectionKey;
    addButton.addEventListener('click', () => {
      showAddSectionModal(sectionKey);
    });
    return addButton;
  }

  // 🟡🟡🟡 - [UTILITY] Create add nested item button after a nested item
  function createAddNestedItemButton(sectionKey, itemType, insertAfterItemKey) {
    const addButton = document.createElement('button');
    addButton.className = 'admin-add-nested-item-after';
    addButton.innerHTML = getPlusIconHTML();
    addButton.title = insertAfterItemKey ? 'Add item after this' : 'Add item at end';
    addButton.dataset.sectionKey = sectionKey;
    if (insertAfterItemKey) {
      addButton.dataset.insertAfterItemKey = insertAfterItemKey;
    }
    addButton.dataset.itemType = itemType;
    addButton.addEventListener('click', () => {
      showAddNestedItemModal(sectionKey, itemType, insertAfterItemKey);
    });
    return addButton;
  }

  // 🟡🟡🟡 - [RENDERING] Render all sections
  function renderSections() {
    const sectionsList = document.getElementById('sections-list');
    if (!sectionsList) {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Sections list container not found');
      return;
    }

    // 🟡🟡🟡 - [CLEANUP] Destroy all nested sortable instances before re-rendering
    Object.keys(nestedSortableInstances).forEach(sectionKey => {
      if (nestedSortableInstances[sectionKey]) {
        nestedSortableInstances[sectionKey].destroy();
      }
    });
    nestedSortableInstances = {};

    // 🟡🟡🟡 - [SORT] Sort sections by order
    const sortedSections = Object.keys(currentMenuState)
      .map(key => ({ key, section: currentMenuState[key] }))
      .sort((a, b) => {
        const orderA = a.section.order || 0;
        const orderB = b.section.order || 0;
        return orderA - orderB;
      });

    // 🟡🟡🟡 - [CLEAR] Clear existing sections
    sectionsList.innerHTML = '';

    // 🟡🟡🟡 - [RENDER] Render each section (now returns wrapper with card and add button)
    sortedSections.forEach(({ key, section }) => {
      const wrapper = renderSectionCard(key, section);
      sectionsList.appendChild(wrapper);
    });

    // 🟡🟡🟡 - [ADD BUTTON] Add "+" button at the end of list for adding to end
    const addButtonEnd = createAddSectionButton(null);
    sectionsList.appendChild(addButtonEnd);

    // 🟡🟡🟡 - [SORTABLE] Initialize or update SortableJS for main sections
    if (typeof Sortable !== 'undefined') {
      if (sortableInstance) {
        sortableInstance.destroy();
      }
      
      sortableInstance = new Sortable(sectionsList, {
        handle: '.admin-section-drag-handle',
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        filter: '.admin-add-section-after', // 🟡🟡🟡 - [FILTER] Prevent dragging add buttons
        onMove: function(evt) {
          // 🟡🟡🟡 - [REALTIME UPDATE] Update order numbers in real-time during drag movement
          // Use requestAnimationFrame for smooth updates
          requestAnimationFrame(() => {
            updateSectionOrderNumbers();
          });
          // Don't return anything to allow the move
        },
        onSort: function(evt) {
          // 🟡🟡🟡 - [REALTIME UPDATE] Update order numbers when order changes
          updateSectionOrderNumbers();
        },
        onEnd: function(evt) {
          // 🟡🟡🟡 - [REORDER] Update order values after drag
          updateSectionOrders();
          // 🟡🟡🟡 - [REALTIME UPDATE] Ensure order numbers are correct after drag ends
          updateSectionOrderNumbers();
          console.log('✅✅✅ - [ADMIN MENU EDITOR] Sections reordered');
        }
      });
      
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Main sections SortableJS initialized');
    } else {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] SortableJS library not loaded');
    }

    // 🟡🟡🟡 - [NESTED SORTABLE] Initialize nested sortables for all expanded nested content
    initializeAllNestedSortables();

    // 🟡🟡🟡 - [REALTIME UPDATE] Update order numbers on initial render
    updateSectionOrderNumbers();
  }

  // 🟡🟡🟡 - [NESTED SORTABLE] Initialize sortables for all visible nested content containers
  function initializeAllNestedSortables() {
    const cards = document.querySelectorAll('.admin-section-card');
    cards.forEach(card => {
      const sectionKey = card.dataset.sectionKey;
      if (!sectionKey || !currentMenuState[sectionKey]) return;

      const nestedContainer = card.querySelector('.admin-nested-content');
      if (nestedContainer && nestedContainer.style.display !== 'none') {
        // 🟡🟡🟡 - [INITIALIZE] Only initialize if container is visible
        initializeNestedSortable(nestedContainer, sectionKey, currentMenuState[sectionKey]);
      }
    });
  }

  // 🟡🟡🟡 - [REALTIME UPDATE] Update order numbers displayed in UI based on visual position
  function updateSectionOrderNumbers() {
    const sectionsList = document.getElementById('sections-list');
    if (!sectionsList) return;

    // 🟡🟡🟡 - [WRAPPER] Get section cards from wrappers (excluding add buttons)
    const wrappers = sectionsList.querySelectorAll('.admin-section-wrapper');
    wrappers.forEach((wrapper, index) => {
      const card = wrapper.querySelector('.admin-section-card');
      if (card) {
        const orderSpan = card.querySelector('.admin-section-order');
        if (orderSpan) {
          orderSpan.textContent = `#${index + 1}`;
        }
      }
    });
  }

  // 🟡🟡🟡 - [REORDER] Update order values based on visual position
  function updateSectionOrders() {
    const sectionsList = document.getElementById('sections-list');
    if (!sectionsList) return;

    // 🟡🟡🟡 - [WRAPPER] Get section cards from wrappers (excluding add buttons)
    const wrappers = sectionsList.querySelectorAll('.admin-section-wrapper');
    wrappers.forEach((wrapper, index) => {
      const card = wrapper.querySelector('.admin-section-card');
      if (card) {
        const sectionKey = card.dataset.sectionKey;
        if (currentMenuState[sectionKey]) {
          currentMenuState[sectionKey].order = index + 1;
        }
      }
    });
  }

  // 🟡🟡🟡 - [NESTED SORTABLE] Initialize SortableJS for nested content container
  function initializeNestedSortable(container, sectionKey, section) {
    // 🟡🟡🟡 - [CLEANUP] Destroy existing sortable instance if it exists
    if (nestedSortableInstances[sectionKey]) {
      nestedSortableInstances[sectionKey].destroy();
      delete nestedSortableInstances[sectionKey];
    }

    // 🟡🟡🟡 - [VALIDATION] Only initialize if SortableJS is available and container has items
    if (typeof Sortable === 'undefined') {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] SortableJS library not loaded for nested content');
      return;
    }

    const items = container.querySelectorAll('.admin-nested-item');
    if (items.length === 0) {
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] No nested items to sort for section:', sectionKey);
      return;
    }

    // 🟡🟡🟡 - [SORTABLE] Initialize SortableJS for nested container
    nestedSortableInstances[sectionKey] = new Sortable(container, {
      handle: '.admin-nested-item-drag-handle',
      animation: 150,
      ghostClass: 'sortable-ghost',
      dragClass: 'sortable-drag',
      filter: '.admin-add-nested-item-after', // 🟡🟡🟡 - [FILTER] Prevent dragging add buttons
      onEnd: function(evt) {
        // 🟡🟡🟡 - [REORDER] Update nested item order after drag
        updateNestedItemOrder(sectionKey, section);
        console.log('✅✅✅ - [ADMIN MENU EDITOR] Nested items reordered for section:', sectionKey);
      }
    });

    console.log('✅✅✅ - [ADMIN MENU EDITOR] Nested SortableJS initialized for section:', sectionKey);
  }

  // 🟡🟡🟡 - [NESTED SORTABLE] Update nested item order based on visual position
  function updateNestedItemOrder(sectionKey, section) {
    const card = document.querySelector(`[data-section-key="${sectionKey}"]`);
    if (!card) return;

    const nestedContainer = card.querySelector('.admin-nested-content');
    if (!nestedContainer) return;

    const htmlType = section['html-type'] || '';
    // 🟡🟡🟡 - [FILTER] Get only nested items, excluding add buttons
    const items = nestedContainer.querySelectorAll('.admin-nested-item:not(.admin-add-nested-item-after)');
    
    // 🟡🟡🟡 - [REORDER] Get ordered list of item keys from DOM
    const orderedKeys = Array.from(items).map(item => item.dataset.itemKey).filter(key => key);

    if (htmlType === 'radio-group' && section.content) {
      // 🟡🟡🟡 - [RADIO GROUP] Rebuild content object with new order
      const newContent = {};
      orderedKeys.forEach(key => {
        if (section.content[key]) {
          newContent[key] = section.content[key];
        }
      });
      // 🟡🟡🟡 - [PRESERVE] Preserve any keys that weren't in DOM (shouldn't happen, but safety check)
      Object.keys(section.content).forEach(key => {
        if (!newContent[key]) {
          newContent[key] = section.content[key];
        }
      });
      currentMenuState[sectionKey].content = newContent;
    } else if (htmlType === 'checkbox-group' && section.content) {
      // 🟡🟡🟡 - [CHECKBOX GROUP] Rebuild content object with new order
      const newContent = {};
      orderedKeys.forEach(key => {
        if (section.content[key]) {
          newContent[key] = section.content[key];
        }
      });
      Object.keys(section.content).forEach(key => {
        if (!newContent[key]) {
          newContent[key] = section.content[key];
        }
      });
      currentMenuState[sectionKey].content = newContent;
    } else if (htmlType === 'div-group' && section.content) {
      // 🟡🟡🟡 - [DIV GROUP] Rebuild content object with new order
      const newContent = {};
      orderedKeys.forEach(key => {
        if (section.content[key]) {
          newContent[key] = section.content[key];
        }
      });
      Object.keys(section.content).forEach(key => {
        if (!newContent[key]) {
          newContent[key] = section.content[key];
        }
      });
      currentMenuState[sectionKey].content = newContent;
    } else if (section['addon-items']) {
      // 🟡🟡🟡 - [ADDON ITEMS] Rebuild addon-items object with new order
      const newAddonItems = {};
      orderedKeys.forEach(key => {
        if (section['addon-items'][key]) {
          newAddonItems[key] = section['addon-items'][key];
        }
      });
      Object.keys(section['addon-items']).forEach(key => {
        if (!newAddonItems[key]) {
          newAddonItems[key] = section['addon-items'][key];
        }
      });
      currentMenuState[sectionKey]['addon-items'] = newAddonItems;
    }
  }

  // 🟡🟡🟡 - [TOGGLE] Toggle nested content visibility
  function toggleNestedContent(sectionKey) {
    const card = document.querySelector(`[data-section-key="${sectionKey}"]`);
    if (!card) return;

    const nestedContent = card.querySelector('.admin-nested-content');
    const toggleBtn = card.querySelector('.admin-expand-toggle');
    
    if (nestedContent && toggleBtn) {
      const isVisible = nestedContent.style.display !== 'none';
      
      // 🟡🟡🟡 - [EXPANDED STATE] Update expanded state tracking
      if (isVisible) {
        // 🟡🟡🟡 - [COLLAPSE] Collapsing - remove from expanded set
        expandedSections.delete(sectionKey);
        nestedContent.style.display = 'none';
        toggleBtn.textContent = '▼';
        
        // 🟡🟡🟡 - [CLEANUP] Destroy sortable when collapsing
        if (nestedSortableInstances[sectionKey]) {
          nestedSortableInstances[sectionKey].destroy();
          delete nestedSortableInstances[sectionKey];
        }
      } else {
        // 🟡🟡🟡 - [EXPAND] Expanding - add to expanded set
        expandedSections.add(sectionKey);
        nestedContent.style.display = 'block';
        toggleBtn.textContent = '▲';
        
        // 🟡🟡🟡 - [INITIALIZE] Initialize sortable when expanding
        if (currentMenuState[sectionKey]) {
          setTimeout(() => {
            initializeNestedSortable(nestedContent, sectionKey, currentMenuState[sectionKey]);
          }, 50); // Small delay to ensure DOM is updated
        }
      }
      
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Toggled nested content for section:', sectionKey, 'expanded:', !isVisible);
    }
  }

  // 🟡🟡🟡 - [TOGGLE] Toggle popup content visibility
  function togglePopupContent(sectionKey, radioKey) {
    const popupContent = document.querySelector(
      `.admin-popup-content[data-section-key="${sectionKey}"][data-radio-key="${radioKey}"]`
    );
    const toggleBtn = document.querySelector(
      `.admin-expand-toggle-nested[data-section-key="${sectionKey}"][data-radio-key="${radioKey}"]`
    );
    
    if (popupContent && toggleBtn) {
      const isVisible = popupContent.style.display !== 'none';
      popupContent.style.display = isVisible ? 'none' : 'block';
      toggleBtn.textContent = isVisible ? '▼' : '▲';
    }
  }

  // 🟡🟡🟡 - [SECTION MANAGEMENT] Add new section
  function addSection() {
    showAddSectionModal(null);
  }

  // 🟡🟡🟡 - [MODAL] Show add section modal
  function showAddSectionModal(insertAfterSectionKey = null) {
    const htmlTypes = [
      { value: 'h1', label: 'Heading 1 (H1)' },
      { value: 'h2', label: 'Heading 2 (H2)' },
      { value: 'p', label: 'Paragraph (P)' },
      { value: 'image', label: 'Image' },
      { value: 'radio-group', label: 'Radio Group' },
      { value: 'checkbox-group', label: 'Checkbox Group' },
      { value: 'div-group', label: 'Div Group' },
      { value: 'unordered-list', label: 'Unordered List' }
    ];

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Modal can only be closed via Cancel or Confirm buttons to prevent accidental data loss
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3>Add New Section</h3>
        </div>
        <div class="admin-modal-body">
          <div class="admin-form-group">
            <label>Select HTML Type:</label>
            <select id="new-section-html-type" class="admin-form-input">
              ${htmlTypes.map(type => `<option value="${type.value}">${type.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="admin-modal-footer">
          <button class="admin-button-secondary admin-modal-cancel">Cancel</button>
          <button class="admin-button-primary admin-modal-confirm">Add Section</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Close modal function - only called by Cancel or Confirm buttons
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Cancel button discards changes and closes modal
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Confirm button saves changes and closes modal
    modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
      const htmlType = document.getElementById('new-section-html-type').value;
      createNewSection(htmlType, insertAfterSectionKey);
      closeModal();
    });
  }

  // 🟡🟡🟡 - [SECTION MANAGEMENT] Create new section
  function createNewSection(htmlType, insertAfterSectionKey = null) {
    const sectionKey = getNextSectionKey();
    
    // 🟡🟡🟡 - [ORDER] Calculate order based on insert position
    let newOrder;
    if (insertAfterSectionKey && currentMenuState[insertAfterSectionKey]) {
      // 🟡🟡🟡 - [INSERT AFTER] Insert after specified section
      const insertAfterOrder = currentMenuState[insertAfterSectionKey].order || 0;
      // 🟡🟡🟡 - [REORDER] Update orders of all sections after insertion point
      Object.keys(currentMenuState).forEach(key => {
        if (currentMenuState[key].order > insertAfterOrder) {
          currentMenuState[key].order += 1;
        }
      });
      newOrder = insertAfterOrder + 1;
    } else {
      // 🟡🟡🟡 - [APPEND] Append to end
      const maxOrder = Math.max(...Object.values(currentMenuState).map(s => s.order || 0), 0);
      newOrder = maxOrder + 1;
    }
    
    const newSection = {
      order: newOrder,
      'html-type': htmlType
    };

    // 🟡🟡🟡 - [DEFAULTS] Set default content based on HTML type
    if (htmlType === 'h1' || htmlType === 'h2' || htmlType === 'p') {
      newSection.content = '';
    } else if (htmlType === 'image') {
      newSection.src = '';
      newSection.alt = '';
      newSection.caption = '';
    } else if (htmlType === 'radio-group' || htmlType === 'checkbox-group' || htmlType === 'div-group') {
      newSection.content = {};
    } else if (htmlType === 'unordered-list') {
      newSection.content = [];
    }

    currentMenuState[sectionKey] = newSection;
    renderSections();
    
    // 🟡🟡🟡 - [EDIT] Automatically open edit modal for new section
    setTimeout(() => editSection(sectionKey), 100);
    
    console.log('✅✅✅ - [ADMIN MENU EDITOR] New section created:', sectionKey, 'after:', insertAfterSectionKey || 'end');
  }

  // 🟡🟡🟡 - [NESTED ITEMS] Show modal to add nested item
  function showAddNestedItemModal(sectionKey, itemType, insertAfterItemKey = null) {
    const section = currentMenuState[sectionKey];
    if (!section) {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Section not found:', sectionKey);
      return;
    }

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Modal can only be closed via Cancel or Confirm buttons to prevent accidental data loss
    // 🟡🟡🟡 2025-01-08 - [AUTO-GENERATE KEY] Item key is auto-generated, no longer shown to user
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3>Add New ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Item</h3>
        </div>
        <div class="admin-modal-body">
          <div class="admin-form-group">
            <label>Label:</label>
            <input type="text" id="new-nested-item-label" class="admin-form-input" placeholder="Item label">
          </div>
          <div class="admin-form-group">
            <label>Price:</label>
            <input type="number" id="new-nested-item-price" class="admin-form-input" value="0" step="0.01">
          </div>
          <div class="admin-form-group">
            <label>Price Basis:</label>
            <select id="new-nested-item-price-basis" class="admin-form-input">
              <option value="Per day">Per day</option>
              <option value="Per event">Per event</option>
              <option value="Per guest" selected>Per guest</option>
            </select>
          </div>
          ${itemType === 'radio' ? `
          <div class="admin-form-group">
            <label>Description (optional):</label>
            <textarea id="new-nested-item-description" class="admin-form-input" rows="3" placeholder="Item description"></textarea>
          </div>
          ` : ''}
        </div>
        <div class="admin-modal-footer">
          <button class="admin-button-secondary admin-modal-cancel">Cancel</button>
          <button class="admin-button-primary admin-modal-confirm">Add Item</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Close modal function - only called by Cancel or Confirm buttons
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Cancel button discards changes and closes modal
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Confirm button saves changes and closes modal
    modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
      const label = document.getElementById('new-nested-item-label').value.trim();
      const price = parseFloat(document.getElementById('new-nested-item-price').value) || 0;
      // ⚠️⚠️⚠️ 2025-01-08 - [PRICE BASIS] Default to "Per guest" if empty to prevent invalid data
      const priceBasis = document.getElementById('new-nested-item-price-basis').value.trim() || 'Per guest';
      const description = itemType === 'radio' ? document.getElementById('new-nested-item-description').value.trim() : '';

      // 🟡🟡🟡 2025-01-08 - [AUTO-GENERATE KEY] Generate unique item key automatically
      const itemKey = generateNextNestedItemKey(sectionKey, itemType);
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Auto-generated item key:', itemKey);

      if (!label) {
        alert('Please enter a label');
        return;
      }

      createNewNestedItem(sectionKey, itemType, itemKey, { label, price, 'price-basis': priceBasis, description }, insertAfterItemKey);
      closeModal();
    });
  }

  // 🟡🟡🟡 - [NESTED ITEMS] Create new nested item
  function createNewNestedItem(sectionKey, itemType, itemKey, itemData, insertAfterItemKey = null) {
    const section = currentMenuState[sectionKey];
    if (!section) {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Section not found:', sectionKey);
      return;
    }

    // 🟡🟡🟡 - [VALIDATE] Check if item key already exists
    if (itemType === 'radio' || itemType === 'checkbox' || itemType === 'div') {
      if (section.content && section.content[itemKey]) {
        alert(`Item key "${itemKey}" already exists. Please use a different key.`);
        return;
      }
    } else if (itemType === 'addon') {
      if (section['addon-items'] && section['addon-items'][itemKey]) {
        alert(`Item key "${itemKey}" already exists. Please use a different key.`);
        return;
      }
    }

    // 🟡🟡🟡 - [CREATE] Create new item object
    // ⚠️⚠️⚠️ 2025-01-08 - [PRICE BASIS] Default to "Per guest" if empty to prevent invalid data
    const newItem = {
      label: itemData.label || itemKey,
      price: itemData.price || 0,
      'price-basis': itemData['price-basis'] || 'Per guest'
    };

    if (itemType === 'radio' && itemData.description) {
      newItem.description = itemData.description;
      newItem.popup = {};
    }

    // 🟡🟡🟡 - [INSERT] Insert item at correct position
    if (itemType === 'radio' || itemType === 'checkbox' || itemType === 'div') {
      if (!section.content) {
        section.content = {};
      }

      if (insertAfterItemKey && section.content[insertAfterItemKey]) {
        // 🟡🟡🟡 - [REORDER] Insert after specified item
        const keys = Object.keys(section.content);
        const insertIndex = keys.indexOf(insertAfterItemKey);
        const newContent = {};
        
        // 🟡🟡🟡 - [REBUILD] Rebuild object with new item in correct position
        keys.forEach((key, index) => {
          newContent[key] = section.content[key];
          if (index === insertIndex) {
            newContent[itemKey] = newItem;
          }
        });
        
        // 🟡🟡🟡 - [APPEND] If insertAfterItemKey not found, append to end
        if (insertIndex === -1) {
          newContent[itemKey] = newItem;
        }
        
        section.content = newContent;
      } else {
        // 🟡🟡🟡 - [APPEND] Append to end
        section.content[itemKey] = newItem;
      }
    } else if (itemType === 'addon') {
      if (!section['addon-items']) {
        section['addon-items'] = {};
      }

      if (insertAfterItemKey && section['addon-items'][insertAfterItemKey]) {
        // 🟡🟡🟡 - [REORDER] Insert after specified item
        const keys = Object.keys(section['addon-items']);
        const insertIndex = keys.indexOf(insertAfterItemKey);
        const newAddonItems = {};
        
        keys.forEach((key, index) => {
          newAddonItems[key] = section['addon-items'][key];
          if (index === insertIndex) {
            newAddonItems[itemKey] = newItem;
          }
        });
        
        if (insertIndex === -1) {
          newAddonItems[itemKey] = newItem;
        }
        
        section['addon-items'] = newAddonItems;
      } else {
        // 🟡🟡🟡 - [APPEND] Append to end
        section['addon-items'][itemKey] = newItem;
      }
    }

    currentMenuState[sectionKey] = section;
    renderSections();
    
    console.log('✅✅✅ - [ADMIN MENU EDITOR] New nested item created:', itemKey, 'type:', itemType, 'after:', insertAfterItemKey || 'end');
  }

  // 🟡🟡🟡 - [SECTION MANAGEMENT] Edit section
  function editSection(sectionKey) {
    const section = currentMenuState[sectionKey];
    if (!section) {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Section not found:', sectionKey);
      return;
    }

    const htmlType = section['html-type'] || 'unknown';
    showEditSectionModal(sectionKey, section, htmlType);
  }

  // 🟡🟡🟡 - [MODAL] Show edit section modal
  function showEditSectionModal(sectionKey, section, htmlType) {
    let modalContent = '';

    if (htmlType === 'h1' || htmlType === 'h2' || htmlType === 'p') {
      modalContent = `
        <div class="admin-form-group">
          <label>Content:</label>
          <textarea id="edit-section-content" class="admin-form-input" rows="4">${escapeHtml(section.content || '')}</textarea>
        </div>
      `;
    } else if (htmlType === 'image') {
      const currentImageSrc = section.src || '';
      modalContent = `
        <div class="admin-form-group">
          <label>Image Source (src):</label>
          <input type="text" id="edit-section-src" class="admin-form-input" value="${escapeHtml(currentImageSrc)}">
        </div>
        <div class="admin-form-group">
          <label>Upload New Image:</label>
          <div class="admin-image-upload-container">
            <input type="file" id="edit-section-image-upload" class="admin-file-input" accept="image/jpeg,image/png" style="display: none;">
            <button type="button" class="admin-button-secondary admin-upload-button" data-section-key="${sectionKey}">Choose Image</button>
            <span class="admin-upload-status" id="upload-status-${sectionKey}"></span>
          </div>
          <div class="admin-image-preview-container" id="image-preview-${sectionKey}" style="${currentImageSrc ? '' : 'display: none;'}">
            <img src="${escapeHtml(currentImageSrc)}" alt="Preview" class="admin-image-preview" onerror="this.style.display='none';">
          </div>
        </div>
        <div class="admin-form-group">
          <label>Alt Text:</label>
          <input type="text" id="edit-section-alt" class="admin-form-input" value="${escapeHtml(section.alt || '')}">
        </div>
        <div class="admin-form-group">
          <label>Caption:</label>
          <input type="text" id="edit-section-caption" class="admin-form-input" value="${escapeHtml(section.caption || '')}">
        </div>
      `;
    } else if (htmlType === 'radio-group' || htmlType === 'checkbox-group' || htmlType === 'div-group') {
      modalContent = `
        <div class="admin-form-group">
          <p>Use the expand/collapse button on the section card to manage items.</p>
          <p>Click the edit button on individual items to modify them.</p>
        </div>
      `;
    } else if (htmlType === 'unordered-list') {
      const listItems = Array.isArray(section.content) ? section.content.join('\n') : '';
      modalContent = `
        <div class="admin-form-group">
          <label>List Items (one per line):</label>
          <textarea id="edit-section-content" class="admin-form-input" rows="6">${escapeHtml(listItems)}</textarea>
        </div>
      `;
    }

    // 🟡🟡🟡 - [ADDON ITEMS] Check if section has addon-items
    if (section['addon-items']) {
      modalContent += `
        <div class="admin-form-group">
          <p>This section has addon items. Use the expand/collapse button to manage them.</p>
        </div>
      `;
    }

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Modal can only be closed via Cancel or Confirm buttons to prevent accidental data loss
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content admin-modal-large">
        <div class="admin-modal-header">
          <h3>Edit Section: ${sectionKey} (${htmlType})</h3>
        </div>
        <div class="admin-modal-body">
          ${modalContent}
        </div>
        <div class="admin-modal-footer">
          <button class="admin-button-secondary admin-modal-cancel">Cancel</button>
          <button class="admin-button-primary admin-modal-confirm">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Close modal function - only called by Cancel or Confirm buttons
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Cancel button discards changes and closes modal
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Confirm button saves changes and closes modal
    modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
      saveSectionChanges(sectionKey, section, htmlType, modal);
      closeModal();
    });

    // 🟡🟡🟡 - [IMAGE UPLOAD] Setup image upload functionality for image sections
    if (htmlType === 'image') {
      const fileInput = modal.querySelector('#edit-section-image-upload');
      const uploadButton = modal.querySelector('.admin-upload-button');
      const statusSpan = modal.querySelector(`#upload-status-${sectionKey}`);
      const previewContainer = modal.querySelector(`#image-preview-${sectionKey}`);
      const srcInput = modal.querySelector('#edit-section-src');

      if (uploadButton && fileInput) {
        uploadButton.addEventListener('click', () => {
          fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          await handleImageUpload(sectionKey, file, statusSpan, previewContainer, srcInput);
        });
      }
    }
  }

  // 🟡🟡🟡 - [SECTION MANAGEMENT] Save section changes
  function saveSectionChanges(sectionKey, section, htmlType, modal) {
    if (htmlType === 'h1' || htmlType === 'h2' || htmlType === 'p') {
      const contentInput = modal.querySelector('#edit-section-content');
      if (contentInput) {
        section.content = contentInput.value.trim();
      }
    } else if (htmlType === 'image') {
      const srcInput = modal.querySelector('#edit-section-src');
      const altInput = modal.querySelector('#edit-section-alt');
      const captionInput = modal.querySelector('#edit-section-caption');
      if (srcInput) section.src = srcInput.value.trim();
      if (altInput) section.alt = altInput.value.trim();
      if (captionInput) section.caption = captionInput.value.trim();
    } else if (htmlType === 'unordered-list') {
      const contentInput = modal.querySelector('#edit-section-content');
      if (contentInput) {
        const lines = contentInput.value.split('\n').map(line => line.trim()).filter(line => line);
        section.content = lines;
      }
    }

    currentMenuState[sectionKey] = section;
    renderSections();
    console.log('✅✅✅ - [ADMIN MENU EDITOR] Section updated:', sectionKey);
  }

  // 🟡🟡🟡 - [SECTION MANAGEMENT] Delete section
  function deleteSection(sectionKey) {
    if (!confirm(`Are you sure you want to delete section "${sectionKey}"? This cannot be undone.`)) {
      return;
    }

    delete currentMenuState[sectionKey];
    updateSectionOrders();
    renderSections();
    console.log('✅✅✅ - [ADMIN MENU EDITOR] Section deleted:', sectionKey);
  }

  // 🟡🟡🟡 - [NESTED ITEMS] Edit radio option
  function editRadioOption(sectionKey, radioKey) {
    const section = currentMenuState[sectionKey];
    if (!section || !section.content || !section.content[radioKey]) return;

    const radio = section.content[radioKey];
    showEditRadioModal(sectionKey, radioKey, radio);
  }

  // 🟡🟡🟡 - [MODAL] Show edit radio modal
  // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Modal can only be closed via Cancel or Confirm buttons to prevent accidental data loss
  function showEditRadioModal(sectionKey, radioKey, radio) {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content admin-modal-large">
        <div class="admin-modal-header">
          <h3>Edit Radio Option</h3>
        </div>
        <div class="admin-modal-body">
          <div class="admin-form-group">
            <label>Label:</label>
            <input type="text" id="edit-radio-label" class="admin-form-input" value="${escapeHtml(radio.label || '')}">
          </div>
          <div class="admin-form-group">
            <label>Price:</label>
            <input type="number" id="edit-radio-price" class="admin-form-input" value="${radio.price || 0}" step="0.01">
          </div>
          <div class="admin-form-group">
            <label>Price Basis:</label>
            <select id="edit-radio-price-basis" class="admin-form-input">
              <option value="Per day"${radio['price-basis'] === 'Per day' ? ' selected' : ''}>Per day</option>
              <option value="Per event"${radio['price-basis'] === 'Per event' ? ' selected' : ''}>Per event</option>
              <option value="Per guest"${radio['price-basis'] === 'Per guest' || !radio['price-basis'] ? ' selected' : ''}>Per guest</option>
            </select>
          </div>
          <div class="admin-form-group">
            <label>Description:</label>
            <textarea id="edit-radio-description" class="admin-form-input" rows="3">${escapeHtml(radio.description || '')}</textarea>
          </div>
        </div>
        <div class="admin-modal-footer">
          <button class="admin-button-secondary admin-modal-cancel">Cancel</button>
          <button class="admin-button-primary admin-modal-confirm">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Close modal function - only called by Cancel or Confirm buttons
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Cancel button discards changes and closes modal
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Confirm button saves changes and closes modal
    modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
      const labelInput = modal.querySelector('#edit-radio-label');
      const priceInput = modal.querySelector('#edit-radio-price');
      const priceBasisInput = modal.querySelector('#edit-radio-price-basis');
      const descriptionInput = modal.querySelector('#edit-radio-description');

      if (labelInput) radio.label = labelInput.value.trim();
      if (priceInput) radio.price = parseFloat(priceInput.value) || 0;
      // ⚠️⚠️⚠️ 2025-01-08 - [PRICE BASIS] Default to "Per guest" if empty to prevent invalid data
      if (priceBasisInput) radio['price-basis'] = priceBasisInput.value.trim() || 'Per guest';
      if (descriptionInput) radio.description = descriptionInput.value.trim();

      // Preserve popup if it exists
      if (!radio.popup) radio.popup = {};

      currentMenuState[sectionKey].content[radioKey] = radio;
      renderSections();
      closeModal();
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Radio option updated:', radioKey);
    });
  }

  // 🟡🟡🟡 - [NESTED ITEMS] Delete radio option
  function deleteRadioOption(sectionKey, radioKey) {
    if (!confirm(`Are you sure you want to delete radio option "${radioKey}"?`)) {
      return;
    }

    const section = currentMenuState[sectionKey];
    if (section && section.content) {
      delete section.content[radioKey];
      renderSections();
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Radio option deleted:', radioKey);
    }
  }

  // 🟡🟡🟡 - [NESTED ITEMS] Edit checkbox item
  function editCheckboxItem(sectionKey, checkboxKey) {
    const section = currentMenuState[sectionKey];
    if (!section || !section.content || !section.content[checkboxKey]) return;

    const checkbox = section.content[checkboxKey];
    showEditCheckboxModal(sectionKey, checkboxKey, checkbox);
  }

  // 🟡🟡🟡 - [MODAL] Show edit checkbox modal
  // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Modal can only be closed via Cancel or Confirm buttons to prevent accidental data loss
  function showEditCheckboxModal(sectionKey, checkboxKey, checkbox) {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3>Edit Checkbox Item</h3>
        </div>
        <div class="admin-modal-body">
          <div class="admin-form-group">
            <label>Label:</label>
            <input type="text" id="edit-checkbox-label" class="admin-form-input" value="${escapeHtml(checkbox.label || '')}">
          </div>
          <div class="admin-form-group">
            <label>Price:</label>
            <input type="number" id="edit-checkbox-price" class="admin-form-input" value="${checkbox.price || 0}" step="0.01">
          </div>
          <div class="admin-form-group">
            <label>Price Basis:</label>
            <select id="edit-checkbox-price-basis" class="admin-form-input">
              <option value="Per day"${checkbox['price-basis'] === 'Per day' ? ' selected' : ''}>Per day</option>
              <option value="Per event"${checkbox['price-basis'] === 'Per event' ? ' selected' : ''}>Per event</option>
              <option value="Per guest"${checkbox['price-basis'] === 'Per guest' || !checkbox['price-basis'] ? ' selected' : ''}>Per guest</option>
            </select>
          </div>
        </div>
        <div class="admin-modal-footer">
          <button class="admin-button-secondary admin-modal-cancel">Cancel</button>
          <button class="admin-button-primary admin-modal-confirm">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Close modal function - only called by Cancel or Confirm buttons
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Cancel button discards changes and closes modal
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Confirm button saves changes and closes modal
    modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
      const labelInput = modal.querySelector('#edit-checkbox-label');
      const priceInput = modal.querySelector('#edit-checkbox-price');
      const priceBasisInput = modal.querySelector('#edit-checkbox-price-basis');

      if (labelInput) checkbox.label = labelInput.value.trim();
      if (priceInput) checkbox.price = parseFloat(priceInput.value) || 0;
      // ⚠️⚠️⚠️ 2025-01-08 - [PRICE BASIS] Default to "Per guest" if empty to prevent invalid data
      if (priceBasisInput) checkbox['price-basis'] = priceBasisInput.value.trim() || 'Per guest';

      currentMenuState[sectionKey].content[checkboxKey] = checkbox;
      renderSections();
      closeModal();
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Checkbox item updated:', checkboxKey);
    });
  }

  // 🟡🟡🟡 - [NESTED ITEMS] Delete checkbox item
  function deleteCheckboxItem(sectionKey, checkboxKey) {
    if (!confirm(`Are you sure you want to delete checkbox item "${checkboxKey}"?`)) {
      return;
    }

    const section = currentMenuState[sectionKey];
    if (section && section.content) {
      delete section.content[checkboxKey];
      renderSections();
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Checkbox item deleted:', checkboxKey);
    }
  }

  // 🟡🟡🟡 - [NESTED ITEMS] Edit div item
  function editDivItem(sectionKey, divKey) {
    const section = currentMenuState[sectionKey];
    if (!section || !section.content || !section.content[divKey]) return;

    const div = section.content[divKey];
    showEditDivModal(sectionKey, divKey, div);
  }

  // 🟡🟡🟡 - [MODAL] Show edit div modal
  // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Modal can only be closed via Cancel or Confirm buttons to prevent accidental data loss
  function showEditDivModal(sectionKey, divKey, div) {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3>Edit Div Item</h3>
        </div>
        <div class="admin-modal-body">
          <div class="admin-form-group">
            <label>Label:</label>
            <input type="text" id="edit-div-label" class="admin-form-input" value="${escapeHtml(div.label || '')}">
          </div>
          <div class="admin-form-group">
            <label>Price:</label>
            <input type="number" id="edit-div-price" class="admin-form-input" value="${div.price || 0}" step="0.01">
          </div>
          <div class="admin-form-group">
            <label>Price Basis:</label>
            <select id="edit-div-price-basis" class="admin-form-input">
              <option value="Per day"${div['price-basis'] === 'Per day' ? ' selected' : ''}>Per day</option>
              <option value="Per event"${div['price-basis'] === 'Per event' ? ' selected' : ''}>Per event</option>
              <option value="Per guest"${div['price-basis'] === 'Per guest' || !div['price-basis'] ? ' selected' : ''}>Per guest</option>
            </select>
          </div>
        </div>
        <div class="admin-modal-footer">
          <button class="admin-button-secondary admin-modal-cancel">Cancel</button>
          <button class="admin-button-primary admin-modal-confirm">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Close modal function - only called by Cancel or Confirm buttons
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Cancel button discards changes and closes modal
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Confirm button saves changes and closes modal
    modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
      const labelInput = modal.querySelector('#edit-div-label');
      const priceInput = modal.querySelector('#edit-div-price');
      const priceBasisInput = modal.querySelector('#edit-div-price-basis');

      if (labelInput) div.label = labelInput.value.trim();
      if (priceInput) div.price = parseFloat(priceInput.value) || 0;
      // ⚠️⚠️⚠️ 2025-01-08 - [PRICE BASIS] Default to "Per guest" if empty to prevent invalid data
      if (priceBasisInput) div['price-basis'] = priceBasisInput.value.trim() || 'Per guest';

      currentMenuState[sectionKey].content[divKey] = div;
      renderSections();
      closeModal();
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Div item updated:', divKey);
    });
  }

  // 🟡🟡🟡 - [NESTED ITEMS] Delete div item
  function deleteDivItem(sectionKey, divKey) {
    if (!confirm(`Are you sure you want to delete div item "${divKey}"?`)) {
      return;
    }

    const section = currentMenuState[sectionKey];
    if (section && section.content) {
      delete section.content[divKey];
      renderSections();
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Div item deleted:', divKey);
    }
  }

  // 🟡🟡🟡 - [NESTED ITEMS] Edit addon item
  function editAddonItem(sectionKey, addonKey) {
    const section = currentMenuState[sectionKey];
    if (!section || !section['addon-items'] || !section['addon-items'][addonKey]) return;

    const addon = section['addon-items'][addonKey];
    showEditAddonModal(sectionKey, addonKey, addon);
  }

  // 🟡🟡🟡 - [MODAL] Show edit addon modal
  // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Modal can only be closed via Cancel or Confirm buttons to prevent accidental data loss
  function showEditAddonModal(sectionKey, addonKey, addon) {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3>Edit Addon Item</h3>
        </div>
        <div class="admin-modal-body">
          <div class="admin-form-group">
            <label>Label:</label>
            <input type="text" id="edit-addon-label" class="admin-form-input" value="${escapeHtml(addon.label || '')}">
          </div>
          <div class="admin-form-group">
            <label>Price:</label>
            <input type="number" id="edit-addon-price" class="admin-form-input" value="${addon.price || 0}" step="0.01">
          </div>
          <div class="admin-form-group">
            <label>Price Basis:</label>
            <select id="edit-addon-price-basis" class="admin-form-input">
              <option value="Per day"${addon['price-basis'] === 'Per day' ? ' selected' : ''}>Per day</option>
              <option value="Per event"${addon['price-basis'] === 'Per event' ? ' selected' : ''}>Per event</option>
              <option value="Per guest"${addon['price-basis'] === 'Per guest' || !addon['price-basis'] ? ' selected' : ''}>Per guest</option>
            </select>
          </div>
        </div>
        <div class="admin-modal-footer">
          <button class="admin-button-secondary admin-modal-cancel">Cancel</button>
          <button class="admin-button-primary admin-modal-confirm">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Close modal function - only called by Cancel or Confirm buttons
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Cancel button discards changes and closes modal
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Confirm button saves changes and closes modal
    modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
      const labelInput = modal.querySelector('#edit-addon-label');
      const priceInput = modal.querySelector('#edit-addon-price');
      const priceBasisInput = modal.querySelector('#edit-addon-price-basis');

      if (labelInput) addon.label = labelInput.value.trim();
      if (priceInput) addon.price = parseFloat(priceInput.value) || 0;
      // ⚠️⚠️⚠️ 2025-01-08 - [PRICE BASIS] Default to "Per guest" if empty to prevent invalid data
      if (priceBasisInput) addon['price-basis'] = priceBasisInput.value.trim() || 'Per guest';

      currentMenuState[sectionKey]['addon-items'][addonKey] = addon;
      renderSections();
      closeModal();
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Addon item updated:', addonKey);
    });
  }

  // 🟡🟡🟡 - [NESTED ITEMS] Delete addon item
  function deleteAddonItem(sectionKey, addonKey) {
    if (!confirm(`Are you sure you want to delete addon item "${addonKey}"?`)) {
      return;
    }

    const section = currentMenuState[sectionKey];
    if (section && section['addon-items']) {
      delete section['addon-items'][addonKey];
      renderSections();
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Addon item deleted:', addonKey);
    }
  }

  // 🟡🟡🟡 - [POPUP SECTIONS] Edit popup section
  function editPopupSection(sectionKey, radioKey, popupSectionKey) {
    const section = currentMenuState[sectionKey];
    if (!section || !section.content || !section.content[radioKey] || !section.content[radioKey].popup || !section.content[radioKey].popup[popupSectionKey]) {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Popup section not found:', sectionKey, radioKey, popupSectionKey);
      return;
    }

    const popupSection = section.content[radioKey].popup[popupSectionKey];
    const htmlType = popupSection['html-type'] || 'unknown';
    showEditPopupSectionModal(sectionKey, radioKey, popupSectionKey, popupSection, htmlType);
  }

  // 🟡🟡🟡 - [MODAL] Show edit popup section modal
  function showEditPopupSectionModal(sectionKey, radioKey, popupSectionKey, popupSection, htmlType) {
    let modalContent = '';

    if (htmlType === 'h1' || htmlType === 'h2' || htmlType === 'p') {
      modalContent = `
        <div class="admin-form-group">
          <label>Content:</label>
          <textarea id="edit-popup-section-content" class="admin-form-input" rows="4">${escapeHtml(popupSection.content || '')}</textarea>
        </div>
      `;
    } else if (htmlType === 'image') {
      const currentImageSrc = popupSection.src || '';
      modalContent = `
        <div class="admin-form-group">
          <label>Image Source (src):</label>
          <input type="text" id="edit-popup-section-src" class="admin-form-input" value="${escapeHtml(currentImageSrc)}">
        </div>
        <div class="admin-form-group">
          <label>Upload New Image:</label>
          <div class="admin-image-upload-container">
            <input type="file" id="edit-popup-section-image-upload" class="admin-file-input" accept="image/jpeg,image/png" style="display: none;">
            <button type="button" class="admin-button-secondary admin-upload-button" data-section-key="${sectionKey}" data-radio-key="${radioKey}" data-popup-section-key="${popupSectionKey}">Choose Image</button>
            <span class="admin-upload-status" id="upload-status-popup-${sectionKey}-${radioKey}-${popupSectionKey}"></span>
          </div>
          <div class="admin-image-preview-container" id="image-preview-popup-${sectionKey}-${radioKey}-${popupSectionKey}" style="${currentImageSrc ? '' : 'display: none;'}">
            <img src="${escapeHtml(currentImageSrc)}" alt="Preview" class="admin-image-preview" onerror="this.style.display='none';">
          </div>
        </div>
        <div class="admin-form-group">
          <label>Alt Text:</label>
          <input type="text" id="edit-popup-section-alt" class="admin-form-input" value="${escapeHtml(popupSection.alt || '')}">
        </div>
        <div class="admin-form-group">
          <label>Caption:</label>
          <input type="text" id="edit-popup-section-caption" class="admin-form-input" value="${escapeHtml(popupSection.caption || '')}">
        </div>
      `;
    } else if (htmlType === 'unordered-list') {
      const listItems = Array.isArray(popupSection.content) ? popupSection.content.join('\n') : '';
      modalContent = `
        <div class="admin-form-group">
          <label>List Items (one per line):</label>
          <textarea id="edit-popup-section-content" class="admin-form-input" rows="6">${escapeHtml(listItems)}</textarea>
        </div>
      `;
    } else {
      modalContent = `
        <div class="admin-form-group">
          <p>Editing for HTML type "${htmlType}" is not yet supported in popup sections.</p>
        </div>
      `;
    }

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Modal can only be closed via Cancel or Confirm buttons to prevent accidental data loss
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content admin-modal-large">
        <div class="admin-modal-header">
          <h3>Edit Popup Section: ${popupSectionKey} (${htmlType})</h3>
        </div>
        <div class="admin-modal-body">
          ${modalContent}
        </div>
        <div class="admin-modal-footer">
          <button class="admin-button-secondary admin-modal-cancel">Cancel</button>
          <button class="admin-button-primary admin-modal-confirm">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Close modal function - only called by Cancel or Confirm buttons
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Cancel button discards changes and closes modal
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
    // ⚠️⚠️⚠️ 2025-01-XX - [MODAL] Confirm button saves changes and closes modal
    modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
      savePopupSectionChanges(sectionKey, radioKey, popupSectionKey, popupSection, htmlType, modal);
      closeModal();
    });

    // 🟡🟡🟡 - [IMAGE UPLOAD] Setup image upload functionality for image sections
    if (htmlType === 'image') {
      const fileInput = modal.querySelector('#edit-popup-section-image-upload');
      const uploadButton = modal.querySelector('.admin-upload-button');
      const statusSpan = modal.querySelector(`#upload-status-popup-${sectionKey}-${radioKey}-${popupSectionKey}`);
      const previewContainer = modal.querySelector(`#image-preview-popup-${sectionKey}-${radioKey}-${popupSectionKey}`);
      const srcInput = modal.querySelector('#edit-popup-section-src');

      if (uploadButton && fileInput) {
        uploadButton.addEventListener('click', () => {
          fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          await handleImageUploadForPopup(sectionKey, radioKey, popupSectionKey, file, statusSpan, previewContainer, srcInput);
        });
      }
    }
  }

  // 🟡🟡🟡 - [POPUP SECTIONS] Save popup section changes
  function savePopupSectionChanges(sectionKey, radioKey, popupSectionKey, popupSection, htmlType, modal) {
    if (htmlType === 'h1' || htmlType === 'h2' || htmlType === 'p') {
      const contentInput = modal.querySelector('#edit-popup-section-content');
      if (contentInput) {
        popupSection.content = contentInput.value.trim();
      }
    } else if (htmlType === 'image') {
      const srcInput = modal.querySelector('#edit-popup-section-src');
      const altInput = modal.querySelector('#edit-popup-section-alt');
      const captionInput = modal.querySelector('#edit-popup-section-caption');
      if (srcInput) popupSection.src = srcInput.value.trim();
      if (altInput) popupSection.alt = altInput.value.trim();
      if (captionInput) popupSection.caption = captionInput.value.trim();
    } else if (htmlType === 'unordered-list') {
      const contentInput = modal.querySelector('#edit-popup-section-content');
      if (contentInput) {
        const lines = contentInput.value.split('\n').map(line => line.trim()).filter(line => line);
        popupSection.content = lines;
      }
    }

    // 🟡🟡🟡 - [UPDATE STATE] Update the popup section in current menu state
    if (currentMenuState[sectionKey] && currentMenuState[sectionKey].content && currentMenuState[sectionKey].content[radioKey]) {
      if (!currentMenuState[sectionKey].content[radioKey].popup) {
        currentMenuState[sectionKey].content[radioKey].popup = {};
      }
      currentMenuState[sectionKey].content[radioKey].popup[popupSectionKey] = popupSection;
      renderSections();
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Popup section updated:', popupSectionKey);
    }
  }

  // 🟡🟡🟡 - [IMAGE UPLOAD] Handle image file upload for popup sections
  async function handleImageUploadForPopup(sectionKey, radioKey, popupSectionKey, file, statusSpan, previewContainer, srcInput) {
    // 🟡🟡🟡 - [VALIDATION] Client-side validation - JPG and PNG only, max 5MB
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];

    if (file.size > maxSize) {
      if (statusSpan) {
        statusSpan.textContent = '❌ File size exceeds 5MB limit';
        statusSpan.className = 'admin-upload-status error';
      }
      console.error('❗❗❗ - [ADMIN MENU EDITOR] File too large:', file.size, 'bytes');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      if (statusSpan) {
        statusSpan.textContent = '❌ Invalid file type. Only JPG and PNG are allowed.';
        statusSpan.className = 'admin-upload-status error';
      }
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Invalid file type:', file.type);
      return;
    }

    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      if (statusSpan) {
        statusSpan.textContent = '❌ Invalid file extension. Only .jpg, .jpeg, and .png are allowed.';
        statusSpan.className = 'admin-upload-status error';
      }
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Invalid file extension:', fileName);
      return;
    }

    // 🟡🟡🟡 - [CROPPING] Show cropping status
    if (statusSpan) {
      statusSpan.textContent = '⏳ Processing image...';
      statusSpan.className = 'admin-upload-status uploading';
    }

    try {
      // 🟡🟡🟡 - [CROP] Crop image to square (1:1) if not already square
      let processedFile = file;
      try {
        processedFile = await cropImageToSquare(file);
        console.log('✅✅✅ - [ADMIN MENU EDITOR] Image processed for square crop (popup)');
      } catch (cropError) {
        console.error('❗❗❗ - [ADMIN MENU EDITOR] Error cropping image, using original:', cropError);
        // 🟡🟡🟡 - [FALLBACK] If cropping fails, use original file
        processedFile = file;
      }

      // 🟡🟡🟡 - [UPLOAD] Show upload status
      if (statusSpan) {
        statusSpan.textContent = '⏳ Uploading...';
        statusSpan.className = 'admin-upload-status uploading';
      }

      // 🟡🟡🟡 - [FORMDATA] Create FormData with processed file
      const formData = new FormData();
      formData.append('image', processedFile);

      // 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] Get CSRF token from container data attribute
      const container = document.getElementById('menu-editor-container');
      const csrfToken = container ? container.getAttribute('data-csrf-token') : null;
      
      // 🟡🟡🟡 - [API CALL] Upload file to server
      const headers = {};
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      
      const response = await fetch('/admin/api/upload-image', {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const result = await response.json();

      if (result.success && result.filePath) {
        // 🟡🟡🟡 - [SUCCESS] Update src field with returned path
        if (srcInput) {
          srcInput.value = result.filePath;
        }

        // 🟡🟡🟡 - [PREVIEW] Show image preview
        if (previewContainer) {
          const img = previewContainer.querySelector('img');
          if (img) {
            img.src = result.filePath;
            img.style.display = 'block';
          }
          previewContainer.style.display = 'block';
        }

        if (statusSpan) {
          statusSpan.textContent = '✅ Upload successful!';
          statusSpan.className = 'admin-upload-status success';
        }

        console.log('✅✅✅ - [ADMIN MENU EDITOR] Image uploaded successfully for popup section:', result.filePath);

        // 🟡🟡🟡 - [CLEAR STATUS] Clear status message after 3 seconds
        setTimeout(() => {
          if (statusSpan) {
            statusSpan.textContent = '';
            statusSpan.className = 'admin-upload-status';
          }
        }, 3000);
      } else {
        // 🟡🟡🟡 - [ERROR] Show error message
        if (statusSpan) {
          statusSpan.textContent = '❌ ' + (result.message || 'Upload failed');
          statusSpan.className = 'admin-upload-status error';
        }
        console.error('❗❗❗ - [ADMIN MENU EDITOR] Upload failed:', result.message);
      }
    } catch (error) {
      // 🟡🟡🟡 - [ERROR] Handle network or other errors
      if (statusSpan) {
        statusSpan.textContent = '❌ Error uploading image. Please try again.';
        statusSpan.className = 'admin-upload-status error';
      }
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Error uploading image:', error);
    }
  }

  // 🟡🟡🟡 - [JSON OUTPUT] Convert editor state to JSON
  function getMenuJSON() {
    // 🟡🟡🟡 - [DEEP COPY] Create deep copy to avoid mutating state
    const json = JSON.parse(JSON.stringify(currentMenuState));
    
    // 🟡🟡🟡 - [VALIDATE] Ensure all sections have required properties
    Object.keys(json).forEach(key => {
      const section = json[key];
      if (!section['html-type']) {
        console.warn('⚠️⚠️⚠️ - [ADMIN MENU EDITOR] Section missing html-type:', key);
      }
      if (section.order === undefined) {
        section.order = 0;
      }
    });
    
    return json;
  }

  // 🟡🟡🟡 - [SAVE CONFIRMATION POPUP] Show save confirmation popup
  function showSaveConfirmationPopup(success, message, onRetry) {
    // 🟡🟡🟡 - [CLEANUP] Remove existing popup if any
    const existingPopup = document.querySelector('.admin-save-confirmation-popup');
    if (existingPopup) {
      document.body.removeChild(existingPopup);
    }

    const popup = document.createElement('div');
    popup.className = 'admin-save-confirmation-popup';
    popup.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;';
    
    const buttonText = success ? 'SAVED SUCCESSFULLY!' : 'FAILED TO SAVE, PLEASE TRY AGAIN';
    const buttonClass = success ? 'admin-button-success' : 'admin-button-retry';
    const popupClass = success ? 'admin-save-success' : 'admin-save-failed';
    
    popup.innerHTML = `
      <div class="admin-save-confirmation-content" style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px; text-align: center; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div class="admin-save-confirmation-message" style="margin-bottom: 1.5rem; font-size: 1.1rem; color: ${success ? '#28a745' : '#dc3545'};">
          ${escapeHtml(message)}
        </div>
        <button class="${buttonClass}" style="padding: 0.75rem 2rem; font-size: 1rem; font-weight: bold; border: none; border-radius: 4px; cursor: pointer; ${success ? 'background: #28a745; color: white;' : 'background: #dc3545; color: white;'}">
          ${buttonText}
        </button>
      </div>
    `;

    document.body.appendChild(popup);

    const button = popup.querySelector(`.${buttonClass}`);
    if (button) {
      button.addEventListener('click', () => {
        if (success) {
          // 🟡🟡🟡 - [SUCCESS] Close popup on success
          document.body.removeChild(popup);
        } else {
          // 🟡🟡🟡 - [RETRY] Retry save on failure
          document.body.removeChild(popup);
          if (onRetry) {
            onRetry();
          }
        }
      });
    }

    // 🟡🟡🟡 - [CLOSE] Close popup on backdrop click (only for success)
    if (success) {
      popup.addEventListener('click', (e) => {
        if (e.target === popup) {
          document.body.removeChild(popup);
        }
      });
    }
  }

  // 🟡🟡🟡 - [SAVE MENU] Save menu to server with retry logic
  async function saveMenu() {
    const saveButton = document.getElementById('save-menu-button');
    if (!saveButton) {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Save button not found');
      return;
    }

    // 🟡🟡🟡 - [SAVE ATTEMPT] Attempt to save menu
    const attemptSave = async () => {
      try {
        // 🟡🟡🟡 - [JSON OUTPUT] Get current menu state as JSON
        const menuItems = getMenuJSON();

        // 🟡🟡🟡 - [UI STATE] Disable save button and show loading state
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
        hideMessage();

        // 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] Get CSRF token from container data attribute
        const container = document.getElementById('menu-editor-container');
        const csrfToken = container ? container.getAttribute('data-csrf-token') : null;
        
        // 🟡🟡🟡 - [API CALL] Send menu data to server
        const headers = {
          'Content-Type': 'application/json'
        };
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken;
        }
        
        const response = await fetch('/admin/api/menu/save', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            name: menuData.menuName || 'Menu',
            menuItems: menuItems
          })
        });

        const result = await response.json();

        if (result.success) {
          console.log('✅✅✅ - [ADMIN MENU EDITOR] Menu saved successfully');
          // 🟡🟡🟡 - [ORIGINAL DATA] Update original data to current state
          originalMenuData = JSON.parse(JSON.stringify(menuItems));
          // 🟡🟡🟡 - [SUCCESS POPUP] Show success confirmation popup
          showSaveConfirmationPopup(true, 'Menu saved successfully to database!', null);
        } else {
          console.error('❗❗❗ - [ADMIN MENU EDITOR] Save failed:', result.message);
          // 🟡🟡🟡 - [FAILURE POPUP] Show failure confirmation popup with retry
          showSaveConfirmationPopup(false, result.message || 'Failed to save menu to database.', attemptSave);
        }
      } catch (err) {
        console.error('❌❌❌ - [ADMIN MENU EDITOR] Error saving menu:', err);
        // 🟡🟡🟡 - [ERROR POPUP] Show error confirmation popup with retry
        showSaveConfirmationPopup(false, 'Error saving menu. Please check your connection and try again.', attemptSave);
      } finally {
        // 🟡🟡🟡 - [UI STATE] Re-enable save button
        saveButton.disabled = false;
        saveButton.textContent = 'Save Menu';
      }
    };

    // 🟡🟡🟡 - [INITIAL SAVE] Start save attempt
    await attemptSave();
  }

  // 🟡🟡🟡 - [RESET MENU] Reset menu to original state
  function resetMenu() {
    if (!originalMenuData) {
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] No original data to reset to');
      showMessage('No original data to reset to.', 'info');
      return;
    }

    if (confirm('Are you sure you want to reset all changes? This cannot be undone.')) {
      try {
        // 🟡🟡🟡 - [RESET] Restore original data
        currentMenuState = JSON.parse(JSON.stringify(originalMenuData));
        renderSections();
        console.log('✅✅✅ - [ADMIN MENU EDITOR] Menu reset to original state');
        showMessage('Menu reset to original state.', 'success');
        setTimeout(hideMessage, 3000);
      } catch (err) {
        console.error('❗❗❗ - [ADMIN MENU EDITOR] Error resetting menu:', err);
        showMessage('Error resetting menu.', 'error');
      }
    }
  }

  // 🟡🟡🟡 - [SHOW MESSAGE] Display success/error message
  function showMessage(message, type) {
    const messageEl = document.getElementById('admin-message');
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className = `admin-message ${type}`;
    messageEl.style.display = 'block';

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(hideMessage, 5000);
    }
  }

  // 🟡🟡🟡 - [HIDE MESSAGE] Hide message
  function hideMessage() {
    const messageEl = document.getElementById('admin-message');
    if (messageEl) {
      messageEl.style.display = 'none';
    }
  }

  // 🟡🟡🟡 - [IMAGE CROPPING] Crop image to square (1:1) proportions using Canvas API
  async function cropImageToSquare(file) {
    return new Promise((resolve, reject) => {
      // 🟡🟡🟡 - [IMAGE LOAD] Load image from file
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            // 🟡🟡🟡 - [DIMENSIONS] Get image dimensions
            const width = img.width;
            const height = img.height;
            console.log('🟡🟡🟡 - [IMAGE CROPPING] Original dimensions:', width, 'x', height);

            // 🟡🟡🟡 - [SQUARE CHECK] Check if already square
            if (width === height) {
              console.log('✅✅✅ - [IMAGE CROPPING] Image is already square, no cropping needed');
              resolve(file);
              return;
            }

            // 🟡🟡🟡 - [CROP SIZE] Calculate square crop size (use smaller dimension)
            const cropSize = Math.min(width, height);
            const cropX = (width - cropSize) / 2;
            const cropY = (height - cropSize) / 2;

            // 🟡🟡🟡 - [CANVAS] Create canvas for cropping
            const canvas = document.createElement('canvas');
            canvas.width = cropSize;
            canvas.height = cropSize;
            const ctx = canvas.getContext('2d');

            // 🟡🟡🟡 - [DRAW] Draw cropped image to canvas
            ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);

            // 🟡🟡🟡 - [CONVERT] Convert canvas to blob
            canvas.toBlob((blob) => {
              if (blob) {
                // 🟡🟡🟡 - [FILE] Create new file from blob with original name
                const croppedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now()
                });
                console.log('✅✅✅ - [IMAGE CROPPING] Image cropped to square:', cropSize, 'x', cropSize);
                resolve(croppedFile);
              } else {
                reject(new Error('Failed to create cropped image'));
              }
            }, file.type, 0.92); // Use 0.92 quality for JPEG/PNG
          } catch (error) {
            console.error('❗❗❗ - [IMAGE CROPPING] Error cropping image:', error);
            reject(error);
          }
        };
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  // 🟡🟡🟡 - [IMAGE UPLOAD] Handle image file upload
  async function handleImageUpload(sectionKey, file, statusSpan, previewContainer, srcInput) {
    // 🟡🟡🟡 - [VALIDATION] Client-side validation - JPG and PNG only, max 5MB
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];

    if (file.size > maxSize) {
      if (statusSpan) {
        statusSpan.textContent = '❌ File size exceeds 5MB limit';
        statusSpan.className = 'admin-upload-status error';
      }
      console.error('❗❗❗ - [ADMIN MENU EDITOR] File too large:', file.size, 'bytes');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      if (statusSpan) {
        statusSpan.textContent = '❌ Invalid file type. Only JPG and PNG are allowed.';
        statusSpan.className = 'admin-upload-status error';
      }
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Invalid file type:', file.type);
      return;
    }

    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      if (statusSpan) {
        statusSpan.textContent = '❌ Invalid file extension. Only .jpg, .jpeg, and .png are allowed.';
        statusSpan.className = 'admin-upload-status error';
      }
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Invalid file extension:', fileName);
      return;
    }

    // 🟡🟡🟡 - [CROPPING] Show cropping status
    if (statusSpan) {
      statusSpan.textContent = '⏳ Processing image...';
      statusSpan.className = 'admin-upload-status uploading';
    }

    try {
      // 🟡🟡🟡 - [CROP] Crop image to square (1:1) if not already square
      let processedFile = file;
      try {
        processedFile = await cropImageToSquare(file);
        console.log('✅✅✅ - [ADMIN MENU EDITOR] Image processed for square crop');
      } catch (cropError) {
        console.error('❗❗❗ - [ADMIN MENU EDITOR] Error cropping image, using original:', cropError);
        // 🟡🟡🟡 - [FALLBACK] If cropping fails, use original file
        processedFile = file;
      }

      // 🟡🟡🟡 - [UPLOAD] Show upload status
      if (statusSpan) {
        statusSpan.textContent = '⏳ Uploading...';
        statusSpan.className = 'admin-upload-status uploading';
      }

      // 🟡🟡🟡 - [FORMDATA] Create FormData with processed file
      const formData = new FormData();
      formData.append('image', processedFile);

      // 2026-01-12T19:10:00Z 🟡🟡🟡 - [CSRF] Get CSRF token from container data attribute
      const container = document.getElementById('menu-editor-container');
      const csrfToken = container ? container.getAttribute('data-csrf-token') : null;
      
      // 🟡🟡🟡 - [API CALL] Upload file to server
      const headers = {};
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      
      const response = await fetch('/admin/api/upload-image', {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const result = await response.json();

      if (result.success && result.filePath) {
        // 🟡🟡🟡 - [SUCCESS] Update src field with returned path
        if (srcInput) {
          srcInput.value = result.filePath;
        }

        // 🟡🟡🟡 - [PREVIEW] Show image preview
        if (previewContainer) {
          const img = previewContainer.querySelector('img');
          if (img) {
            img.src = result.filePath;
            img.style.display = 'block';
          }
          previewContainer.style.display = 'block';
        }

        if (statusSpan) {
          statusSpan.textContent = '✅ Upload successful!';
          statusSpan.className = 'admin-upload-status success';
        }

        console.log('✅✅✅ - [ADMIN MENU EDITOR] Image uploaded successfully:', result.filePath);

        // 🟡🟡🟡 - [CLEAR STATUS] Clear status message after 3 seconds
        setTimeout(() => {
          if (statusSpan) {
            statusSpan.textContent = '';
            statusSpan.className = 'admin-upload-status';
          }
        }, 3000);
      } else {
        // 🟡🟡🟡 - [ERROR] Show error message
        if (statusSpan) {
          statusSpan.textContent = '❌ ' + (result.message || 'Upload failed');
          statusSpan.className = 'admin-upload-status error';
        }
        console.error('❗❗❗ - [ADMIN MENU EDITOR] Upload failed:', result.message);
      }
    } catch (error) {
      // 🟡🟡🟡 - [ERROR] Handle network or other errors
      if (statusSpan) {
        statusSpan.textContent = '❌ Error uploading image. Please try again.';
        statusSpan.className = 'admin-upload-status error';
      }
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Error uploading image:', error);
    }
  }

  // 🟡🟡🟡 - [PREVIEW] Convert relative image path to absolute URL for Blob preview
  function convertImagePathToAbsolute(src) {
    if (!src) return '';
    
    // 🟡🟡🟡 - [ABSOLUTE URL] If already absolute (starts with http:// or https://), return as-is
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    
    // 🟡🟡🟡 - [RELATIVE PATH] Convert relative path to absolute URL using current origin
    // Remove leading slash if present, then add origin
    const cleanPath = src.startsWith('/') ? src : '/' + src;
    const absoluteUrl = window.location.origin + cleanPath;
    
    console.log('🟡🟡🟡 - [MENU PREVIEW] Converting image path:', src, 'to absolute URL:', absoluteUrl);
    return absoluteUrl;
  }

  // 🟡🟡🟡 - [PREVIEW] Render a single section to HTML
  function renderSectionToHTML(sectionKey, section) {
    const htmlType = section['html-type'] || 'unknown';
    let html = '';

    // 🟡🟡🟡 - [HEADINGS] Render h1 and h2 headings
    if (htmlType === 'h1') {
      html += `<h1 class="menu-preview-h1">${escapeHtml(section.content || '')}</h1>`;
    } else if (htmlType === 'h2') {
      html += `<h2 class="menu-preview-h2">${escapeHtml(section.content || '')}</h2>`;
      
      // 🟡🟡🟡 - [ADDON ITEMS] Handle addon-items if present in h2 section
      if (section['addon-items']) {
        html += renderAddonItemsToHTML(section['addon-items']);
      }
    } else if (htmlType === 'p') {
      // 🟡🟡🟡 - [PARAGRAPH] Render paragraph
      html += `<p class="menu-preview-p">${escapeHtml(section.content || '')}</p>`;
    } else if (htmlType === 'image') {
      // 🟡🟡🟡 - [IMAGE] Render image with alt and caption
      const src = section.src || '';
      const alt = section.alt || '';
      const caption = section.caption || '';
      html += `<div class="menu-preview-image-container">`;
      if (src) {
        // 🟡🟡🟡 - [ABSOLUTE URL] Convert relative path to absolute URL for Blob preview
        const absoluteSrc = convertImagePathToAbsolute(src);
        html += `<img src="${escapeHtml(absoluteSrc)}" alt="${escapeHtml(alt)}" class="menu-preview-image" onerror="this.style.display='none';">`;
      }
      if (caption) {
        html += `<p class="menu-preview-image-caption">${escapeHtml(caption)}</p>`;
      }
      html += `</div>`;
    } else if (htmlType === 'unordered-list') {
      // 🟡🟡🟡 - [LIST] Render unordered list
      const items = Array.isArray(section.content) ? section.content : [];
      html += `<ul class="menu-preview-list">`;
      items.forEach(item => {
        html += `<li>${escapeHtml(item)}</li>`;
      });
      html += `</ul>`;
    } else if (htmlType === 'radio-group') {
      // 🟡🟡🟡 - [RADIO GROUP] Render radio button group
      html += renderRadioGroupToHTML(section.content || {}, sectionKey);
    } else if (htmlType === 'checkbox-group') {
      // 🟡🟡🟡 - [CHECKBOX GROUP] Render checkbox group
      html += renderCheckboxGroupToHTML(section.content || {});
    } else if (htmlType === 'div-group') {
      // 🟡🟡🟡 - [DIV GROUP] Render div group
      html += renderDivGroupToHTML(section.content || {});
    }

    return html;
  }

  // 🟡🟡🟡 - [PREVIEW] Render addon items to HTML
  function renderAddonItemsToHTML(addonItems) {
    if (!addonItems || Object.keys(addonItems).length === 0) return '';
    
    let html = '<div class="menu-preview-addon-group">';
    Object.keys(addonItems).forEach(addonKey => {
      const addon = addonItems[addonKey];
      const label = escapeHtml(addon.label || addonKey);
      const price = addon.price || 0;
      const priceBasis = escapeHtml(addon['price-basis'] || '');
      html += `<div class="menu-preview-addon-item">`;
      html += `<span class="menu-preview-addon-label">${label}</span>`;
      html += `<span class="menu-preview-addon-price">${price} ${priceBasis}</span>`;
      html += `</div>`;
    });
    html += '</div>';
    return html;
  }

  // 🟡🟡🟡 - [PREVIEW] Render radio group to HTML
  function renderRadioGroupToHTML(radioContent, sectionKey) {
    if (!radioContent || Object.keys(radioContent).length === 0) return '';
    
    let html = '<div class="menu-preview-radio-group">';
    Object.keys(radioContent).forEach(radioKey => {
      const radio = radioContent[radioKey];
      const label = escapeHtml(radio.label || radioKey);
      const price = radio.price || 0;
      const priceBasis = escapeHtml(radio['price-basis'] || '');
      const description = escapeHtml(radio.description || '');
      const hasPopup = radio.popup && Object.keys(radio.popup).length > 0;
      
      html += `<div class="menu-preview-radio-item" data-radio-key="${sectionKey}-${radioKey}">`;
      html += `<div class="menu-preview-radio-header">`;
      html += `<input type="radio" name="menu-preview-radio-${sectionKey}" id="radio-${sectionKey}-${radioKey}" class="menu-preview-radio-input">`;
      html += `<label for="radio-${sectionKey}-${radioKey}" class="menu-preview-radio-label">${label}</label>`;
      html += `<span class="menu-preview-radio-price">${price} ${priceBasis}</span>`;
      html += `</div>`;
      
      if (description) {
        html += `<p class="menu-preview-radio-description">${description}</p>`;
      }
      
      // 🟡🟡🟡 - [POPUP] Render popup content if present
      if (hasPopup) {
        html += `<div class="menu-preview-popup-content" id="popup-${sectionKey}-${radioKey}" style="display: none;">`;
        html += renderPopupContentToHTML(radio.popup);
        html += `</div>`;
        html += `<button type="button" class="menu-preview-popup-toggle" data-popup-id="popup-${sectionKey}-${radioKey}">View Details</button>`;
      }
      
      html += `</div>`;
    });
    html += '</div>';
    return html;
  }

  // 🟡🟡🟡 - [PREVIEW] Render popup content to HTML
  function renderPopupContentToHTML(popup) {
    if (!popup || Object.keys(popup).length === 0) return '';
    
    // 🟡🟡🟡 - [SORT] Sort popup sections by order if available, otherwise by key
    const popupSections = Object.keys(popup).map(key => ({
      key,
      section: popup[key],
      order: popup[key].order || 0
    })).sort((a, b) => a.order - b.order);
    
    let html = '<div class="menu-preview-popup-sections">';
    popupSections.forEach(({ key, section }) => {
      html += renderSectionToHTML(key, section);
    });
    html += '</div>';
    return html;
  }

  // 🟡🟡🟡 - [PREVIEW] Render checkbox group to HTML
  function renderCheckboxGroupToHTML(checkboxContent) {
    if (!checkboxContent || Object.keys(checkboxContent).length === 0) return '';
    
    let html = '<div class="menu-preview-checkbox-group">';
    Object.keys(checkboxContent).forEach(checkboxKey => {
      const checkbox = checkboxContent[checkboxKey];
      const label = escapeHtml(checkbox.label || checkboxKey);
      const price = checkbox.price || 0;
      const priceBasis = escapeHtml(checkbox['price-basis'] || '');
      
      html += `<div class="menu-preview-checkbox-item">`;
      html += `<input type="checkbox" id="checkbox-${checkboxKey}" class="menu-preview-checkbox-input">`;
      html += `<label for="checkbox-${checkboxKey}" class="menu-preview-checkbox-label">${label}</label>`;
      html += `<span class="menu-preview-checkbox-price">${price} ${priceBasis}</span>`;
      html += `</div>`;
    });
    html += '</div>';
    return html;
  }

  // 🟡🟡🟡 - [PREVIEW] Render div group to HTML
  function renderDivGroupToHTML(divContent) {
    if (!divContent || Object.keys(divContent).length === 0) return '';
    
    let html = '<div class="menu-preview-div-group">';
    Object.keys(divContent).forEach(divKey => {
      const div = divContent[divKey];
      const label = escapeHtml(div.label || divKey);
      const price = div.price || 0;
      const priceBasis = escapeHtml(div['price-basis'] || '');
      
      html += `<div class="menu-preview-div-item">`;
      html += `<span class="menu-preview-div-label">${label}</span>`;
      html += `<span class="menu-preview-div-price">${price} ${priceBasis}</span>`;
      html += `</div>`;
    });
    html += '</div>';
    return html;
  }

  // 🟡🟡🟡 - [PREVIEW] Generate complete HTML preview page
  function generatePreviewHTML(menuJSON) {
    // 🟡🟡🟡 - [SORT] Sort sections by order
    const sections = Object.keys(menuJSON)
      .map(key => ({
        key,
        section: menuJSON[key],
        order: menuJSON[key].order || 0
      }))
      .sort((a, b) => a.order - b.order);

    // 🟡🟡🟡 - [RENDER] Render all sections
    let sectionsHTML = '';
    sections.forEach(({ key, section }) => {
      sectionsHTML += `<div class="menu-preview-section" data-section-key="${key}">`;
      sectionsHTML += renderSectionToHTML(key, section);
      sectionsHTML += `</div>`;
    });

    // 🟡🟡🟡 - [HTML] Generate complete HTML page
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Menu Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    .menu-preview-container {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .menu-preview-section {
      margin-bottom: 2rem;
    }
    .menu-preview-h1 {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
      color: #222;
    }
    .menu-preview-h2 {
      font-size: 2rem;
      font-weight: bold;
      margin-bottom: 1rem;
      margin-top: 2rem;
      color: #333;
    }
    .menu-preview-p {
      font-size: 1.1rem;
      margin-bottom: 1rem;
      color: #555;
    }
    .menu-preview-image-container {
      margin: 1.5rem 0;
      text-align: center;
    }
    .menu-preview-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .menu-preview-image-caption {
      margin-top: 0.5rem;
      font-style: italic;
      color: #666;
      font-size: 0.9rem;
    }
    .menu-preview-list {
      margin: 1rem 0;
      padding-left: 2rem;
    }
    .menu-preview-list li {
      margin-bottom: 0.5rem;
    }
    .menu-preview-radio-group,
    .menu-preview-checkbox-group,
    .menu-preview-div-group,
    .menu-preview-addon-group {
      margin: 1.5rem 0;
    }
    .menu-preview-radio-item,
    .menu-preview-checkbox-item,
    .menu-preview-div-item,
    .menu-preview-addon-item {
      padding: 1rem;
      margin-bottom: 0.75rem;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      background: #fafafa;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .menu-preview-radio-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
    }
    .menu-preview-radio-label,
    .menu-preview-checkbox-label,
    .menu-preview-div-label,
    .menu-preview-addon-label {
      flex: 1;
      font-weight: 500;
    }
    .menu-preview-radio-price,
    .menu-preview-checkbox-price,
    .menu-preview-div-price,
    .menu-preview-addon-price {
      font-weight: bold;
      color: #0066cc;
    }
    .menu-preview-radio-description {
      margin-top: 0.5rem;
      color: #666;
      font-size: 0.95rem;
    }
    .menu-preview-popup-toggle {
      margin-top: 0.5rem;
      padding: 0.5rem 1rem;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .menu-preview-popup-toggle:hover {
      background: #0052a3;
    }
    .menu-preview-popup-content {
      margin-top: 1rem;
      padding: 1.5rem;
      background: #f9f9f9;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
    }
    .menu-preview-popup-sections {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .menu-preview-radio-input,
    .menu-preview-checkbox-input {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
    .menu-preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e0e0e0;
    }
    .menu-preview-title {
      margin: 0;
      color: #0066cc;
    }
    .menu-preview-print-button {
      padding: 0.75rem 1.5rem;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: background 0.2s;
    }
    .menu-preview-print-button:hover {
      background: #0052a3;
    }
    .menu-preview-print-button:active {
      transform: translateY(1px);
    }
    /* 🟡🟡🟡 - [PRINT STYLES] Print-optimized styles for A4 paper */
    @media print {
      * {
        box-shadow: none !important;
        text-shadow: none !important;
      }
      body {
        background: white;
        padding: 0.5cm;
        font-size: 10pt;
        line-height: 1.2 !important;
        color: #000;
      }
      .menu-preview-container {
        padding: 0;
        box-shadow: none;
        border-radius: 0;
      }
      .menu-preview-header {
        display: none;
      }
      .menu-preview-section {
        margin-bottom: 0.5rem;
        page-break-inside: avoid;
      }
      .menu-preview-h1 {
        font-size: 18pt;
        margin-bottom: 0.3rem;
        margin-top: 0.5rem;
        line-height: 1.2;
        page-break-after: avoid;
      }
      .menu-preview-h2 {
        font-size: 14pt;
        margin-bottom: 0.3rem;
        margin-top: 0.8rem;
        line-height: 1.2;
        page-break-after: avoid;
      }
      .menu-preview-p {
        font-size: 10pt;
        margin-bottom: 0.3rem;
        line-height: 1.2;
      }
      .menu-preview-image-container {
        margin: 0.5rem 0;
        page-break-inside: avoid;
      }
      .menu-preview-image {
        max-width: 100%;
        max-height: 4cm;
        object-fit: contain;
        border-radius: 0;
        box-shadow: none;
      }
      .menu-preview-image-caption {
        margin-top: 0.2rem;
        font-size: 8pt;
        line-height: 1.2;
      }
      .menu-preview-list {
        margin: 0.3rem 0;
        padding-left: 1.2rem;
      }
      .menu-preview-list li {
        margin-bottom: 0.2rem;
        font-size: 10pt;
        line-height: 1.2;
      }
      .menu-preview-radio-group,
      .menu-preview-checkbox-group,
      .menu-preview-div-group,
      .menu-preview-addon-group {
        margin: 0.5rem 0;
      }
      .menu-preview-radio-item,
      .menu-preview-checkbox-item,
      .menu-preview-div-item,
      .menu-preview-addon-item {
        padding: 0.3rem 0.5rem;
        margin-bottom: 0.3rem;
        border: 1px solid #ccc;
        border-radius: 0;
        background: white;
        page-break-inside: avoid;
      }
      .menu-preview-radio-header {
        gap: 0.5rem;
      }
      .menu-preview-radio-label,
      .menu-preview-checkbox-label,
      .menu-preview-div-label,
      .menu-preview-addon-label {
        font-size: 10pt;
        line-height: 1.2;
      }
      .menu-preview-radio-price,
      .menu-preview-checkbox-price,
      .menu-preview-div-price,
      .menu-preview-addon-price {
        font-size: 10pt;
        line-height: 1.2;
      }
      .menu-preview-radio-description {
        margin-top: 0.2rem;
        font-size: 9pt;
        line-height: 1.2;
      }
      .menu-preview-popup-toggle {
        display: none !important;
      }
      .menu-preview-popup-content {
        display: block !important;
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: white;
        border: 1px solid #ccc;
        border-radius: 0;
        page-break-inside: avoid;
      }
      .menu-preview-popup-sections {
        gap: 0.3rem;
      }
      .menu-preview-radio-input,
      .menu-preview-checkbox-input {
        width: 14px;
        height: 14px;
      }
      /* 🟡🟡🟡 - [PRINT OPTIMIZATION] Prevent page breaks in awkward places */
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
      }
      img {
        page-break-inside: avoid;
        page-break-after: avoid;
      }
      /* 🟡🟡🟡 - [PRINT OPTIMIZATION] Optimize for A4 (210mm x 297mm) */
      @page {
        size: A4;
        margin: 1cm;
      }
    }
  </style>
</head>
<body>
  <div class="menu-preview-container">
    <div class="menu-preview-header">
      <h1 class="menu-preview-title">Menu Preview</h1>
      <button class="menu-preview-print-button" onclick="handlePrintMenu()">🖨️ Print Menu</button>
    </div>
    ${sectionsHTML}
  </div>
  <script>
    // 🟡🟡🟡 - [POPUP TOGGLE] Handle popup toggle functionality
    document.addEventListener('DOMContentLoaded', function() {
      const popupToggles = document.querySelectorAll('.menu-preview-popup-toggle');
      popupToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
          const popupId = this.getAttribute('data-popup-id');
          const popup = document.getElementById(popupId);
          if (popup) {
            const isVisible = popup.style.display !== 'none';
            popup.style.display = isVisible ? 'none' : 'block';
            this.textContent = isVisible ? 'View Details' : 'Hide Details';
          }
        });
      });
    });

    // 🟡🟡🟡 - [PRINT HANDLER] Handle print menu functionality
    function handlePrintMenu() {
      console.log('🟡🟡🟡 - [PRINT MENU] Preparing menu for printing');
      
      // 🟡🟡🟡 - [EXPAND POPUPS] Expand all collapsed popups before printing
      const popups = document.querySelectorAll('.menu-preview-popup-content');
      let expandedCount = 0;
      popups.forEach(popup => {
        if (popup.style.display === 'none') {
          popup.style.display = 'block';
          expandedCount++;
        }
      });
      
      if (expandedCount > 0) {
        console.log('✅✅✅ - [PRINT MENU] Expanded', expandedCount, 'collapsed popups for printing');
      }
      
      // 🟡🟡🟡 - [PRINT] Trigger browser print dialog
      // Small delay to ensure DOM updates are applied
      setTimeout(() => {
        window.print();
        console.log('✅✅✅ - [PRINT MENU] Print dialog opened');
      }, 100);
    }
  </script>
</body>
</html>`;

    return html;
  }

  // 🟡🟡🟡 - [PREVIEW] Open menu preview in new tab
  function openMenuPreview() {
    try {
      // 🟡🟡🟡 - [JSON] Get current menu state as JSON
      const menuJSON = getMenuJSON();
      
      if (!menuJSON || Object.keys(menuJSON).length === 0) {
        alert('No menu content to preview. Please add some sections first.');
        console.warn('⚠️⚠️⚠️ - [MENU PREVIEW] No menu content to preview');
        return;
      }

      console.log('🟡🟡🟡 - [MENU PREVIEW] Generating preview for menu with', Object.keys(menuJSON).length, 'sections');

      // 🟡🟡🟡 - [HTML] Generate preview HTML
      const previewHTML = generatePreviewHTML(menuJSON);

      // 🟡🟡🟡 - [BLOB] Create blob URL for preview
      const blob = new Blob([previewHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);

      // 🟡🟡🟡 - [OPEN] Open preview in new tab
      const previewWindow = window.open(url, '_blank');
      
      if (!previewWindow) {
        alert('Please allow popups to view the menu preview.');
        console.error('❗❗❗ - [MENU PREVIEW] Failed to open preview window (popup blocked)');
        URL.revokeObjectURL(url);
        return;
      }

      // 🟡🟡🟡 - [CLEANUP] Revoke blob URL after window opens
      previewWindow.addEventListener('load', () => {
        setTimeout(() => URL.revokeObjectURL(url), 100);
      });

      console.log('✅✅✅ - [MENU PREVIEW] Preview opened successfully');
    } catch (error) {
      console.error('❗❗❗ - [MENU PREVIEW] Error generating preview:', error);
      alert('Error generating preview. Please check the console for details.');
    }
  }

  // 🟡🟡🟡 - [INITIALIZATION] Initialize editor with menu data
  function initializeEditor(data) {
    console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Initializing custom menu editor');

    menuData = data;
    const { menu } = data;

    // 🟡🟡🟡 - [INITIAL STATE] Initialize current menu state
    currentMenuState = menu ? JSON.parse(JSON.stringify(menu)) : {};
    originalMenuData = menu ? JSON.parse(JSON.stringify(menu)) : {};

    console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu state initialized:', {
      hasMenu: Object.keys(currentMenuState).length > 0,
      sectionCount: Object.keys(currentMenuState).length
    });

    // 🟡🟡🟡 - [RENDER] Render sections
    renderSections();

    // 🟡🟡🟡 - [EVENT LISTENERS] Attach event listeners
    // Note: add-section-button removed - now using "+" buttons after each section
    const previewButton = document.getElementById('preview-menu-button');
    const saveButton = document.getElementById('save-menu-button');
    const resetButton = document.getElementById('reset-menu-button');

    if (previewButton) {
      previewButton.addEventListener('click', openMenuPreview);
    }

    if (saveButton) {
      saveButton.addEventListener('click', saveMenu);
    }

    if (resetButton) {
      resetButton.addEventListener('click', resetMenu);
    }

    console.log('✅✅✅ - [ADMIN MENU EDITOR] Custom menu editor initialized successfully');
  }

  // 🟡🟡🟡 - [START] Initialize when DOM is ready
  function startInitialization() {
    console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Starting initialization');
    const data = readMenuDataFromDOM();
    if (data) {
      initializeEditor(data);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] DOMContentLoaded fired, reading menu data');
      startInitialization();
    });
  } else {
    // 🟡🟡🟡 - [INITIALIZATION] DOM already ready, start immediately
    console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] DOM already ready, reading menu data');
    startInitialization();
  }

})();
