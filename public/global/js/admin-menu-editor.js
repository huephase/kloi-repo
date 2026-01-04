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
          ${hasNested ? '<button class="admin-expand-toggle" data-section-key="' + sectionKey + '">▼</button>' : ''}
          <button class="admin-section-edit" data-section-key="${sectionKey}" title="Edit section">✏️</button>
          <button class="admin-section-delete" data-section-key="${sectionKey}" title="Delete section">🗑️</button>
        </div>
      </div>
      <div class="admin-section-content">
        <div class="admin-section-preview">${escapeHtml(preview)}</div>
        ${hasNested ? '<div class="admin-nested-content" data-section-key="' + sectionKey + '" style="display: none;"></div>' : ''}
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
    const addButton = document.createElement('button');
    addButton.className = 'admin-add-section-after';
    addButton.innerHTML = '<img src="/public/kloi_plus_sign.svg" alt="Plus sign" class="kloi_plus_icon">';
    addButton.title = 'Add section after this';
    addButton.dataset.insertAfterSectionKey = sectionKey;
    addButton.addEventListener('click', () => {
      showAddSectionModal(sectionKey);
    });

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
            <button class="admin-nested-item-delete" data-section-key="${sectionKey}" data-radio-key="${radioKey}">🗑️</button>
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
        const addNestedButton = document.createElement('button');
        addNestedButton.className = 'admin-add-nested-item-after';
        addNestedButton.innerHTML = '+';
        addNestedButton.title = 'Add item after this';
        addNestedButton.dataset.sectionKey = sectionKey;
        addNestedButton.dataset.insertAfterItemKey = radioKey;
        addNestedButton.dataset.itemType = 'radio';
        addNestedButton.addEventListener('click', () => {
          showAddNestedItemModal(sectionKey, 'radio', radioKey);
        });
        
        container.appendChild(item);
        container.appendChild(addNestedButton);
      });
      
      // 🟡🟡🟡 - [ADD BUTTON] Add "+" button at end of nested list
      const addNestedButtonEnd = document.createElement('button');
      addNestedButtonEnd.className = 'admin-add-nested-item-after';
      addNestedButtonEnd.innerHTML = '<img src="/public/kloi_plus_sign.svg" alt="Plus sign" class="kloi_plus_icon">';
      addNestedButtonEnd.title = 'Add item at end';
      addNestedButtonEnd.dataset.sectionKey = sectionKey;
      addNestedButtonEnd.dataset.itemType = 'radio';
      addNestedButtonEnd.addEventListener('click', () => {
        showAddNestedItemModal(sectionKey, 'radio', null);
      });
      container.appendChild(addNestedButtonEnd);
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
            <button class="admin-nested-item-delete" data-section-key="${sectionKey}" data-checkbox-key="${checkboxKey}">🗑️</button>
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
        const addNestedButton = document.createElement('button');
        addNestedButton.className = 'admin-add-nested-item-after';
        addNestedButton.innerHTML = '+';
        addNestedButton.title = 'Add item after this';
        addNestedButton.dataset.sectionKey = sectionKey;
        addNestedButton.dataset.insertAfterItemKey = checkboxKey;
        addNestedButton.dataset.itemType = 'checkbox';
        addNestedButton.addEventListener('click', () => {
          showAddNestedItemModal(sectionKey, 'checkbox', checkboxKey);
        });
        
        container.appendChild(item);
        container.appendChild(addNestedButton);
      });
      
      // 🟡🟡🟡 - [ADD BUTTON] Add "+" button at end of nested list
      const addNestedButtonEnd = document.createElement('button');
      addNestedButtonEnd.className = 'admin-add-nested-item-after';
      addNestedButtonEnd.innerHTML = '+';
      addNestedButtonEnd.title = 'Add item at end';
      addNestedButtonEnd.dataset.sectionKey = sectionKey;
      addNestedButtonEnd.dataset.itemType = 'checkbox';
      addNestedButtonEnd.addEventListener('click', () => {
        showAddNestedItemModal(sectionKey, 'checkbox', null);
      });
      container.appendChild(addNestedButtonEnd);
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
            <button class="admin-nested-item-delete" data-section-key="${sectionKey}" data-div-key="${divKey}">🗑️</button>
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
        const addNestedButton = document.createElement('button');
        addNestedButton.className = 'admin-add-nested-item-after';
        addNestedButton.innerHTML = '+';
        addNestedButton.title = 'Add item after this';
        addNestedButton.dataset.sectionKey = sectionKey;
        addNestedButton.dataset.insertAfterItemKey = divKey;
        addNestedButton.dataset.itemType = 'div';
        addNestedButton.addEventListener('click', () => {
          showAddNestedItemModal(sectionKey, 'div', divKey);
        });
        
        container.appendChild(item);
        container.appendChild(addNestedButton);
      });
      
      // 🟡🟡🟡 - [ADD BUTTON] Add "+" button at end of nested list
      const addNestedButtonEnd = document.createElement('button');
      addNestedButtonEnd.className = 'admin-add-nested-item-after';
      addNestedButtonEnd.innerHTML = '+';
      addNestedButtonEnd.title = 'Add item at end';
      addNestedButtonEnd.dataset.sectionKey = sectionKey;
      addNestedButtonEnd.dataset.itemType = 'div';
      addNestedButtonEnd.addEventListener('click', () => {
        showAddNestedItemModal(sectionKey, 'div', null);
      });
      container.appendChild(addNestedButtonEnd);
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
            <button class="admin-nested-item-delete" data-section-key="${sectionKey}" data-addon-key="${addonKey}">🗑️</button>
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
        const addNestedButton = document.createElement('button');
        addNestedButton.className = 'admin-add-nested-item-after';
        addNestedButton.innerHTML = '+';
        addNestedButton.title = 'Add item after this';
        addNestedButton.dataset.sectionKey = sectionKey;
        addNestedButton.dataset.insertAfterItemKey = addonKey;
        addNestedButton.dataset.itemType = 'addon';
        addNestedButton.addEventListener('click', () => {
          showAddNestedItemModal(sectionKey, 'addon', addonKey);
        });
        
        container.appendChild(item);
        container.appendChild(addNestedButton);
      });
      
      // 🟡🟡🟡 - [ADD BUTTON] Add "+" button at end of nested list
      const addNestedButtonEnd = document.createElement('button');
      addNestedButtonEnd.className = 'admin-add-nested-item-after';
      addNestedButtonEnd.innerHTML = '+';
      addNestedButtonEnd.title = 'Add item at end';
      addNestedButtonEnd.dataset.sectionKey = sectionKey;
      addNestedButtonEnd.dataset.itemType = 'addon';
      addNestedButtonEnd.addEventListener('click', () => {
        showAddNestedItemModal(sectionKey, 'addon', null);
      });
      container.appendChild(addNestedButtonEnd);
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
    const addButtonEnd = document.createElement('button');
    addButtonEnd.className = 'admin-add-section-after';
    addButtonEnd.innerHTML = '+';
    addButtonEnd.title = 'Add section at end';
    addButtonEnd.addEventListener('click', () => {
      showAddSectionModal(null);
    });
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
      nestedContent.style.display = isVisible ? 'none' : 'block';
      toggleBtn.textContent = isVisible ? '▼' : '▲';
      
      // 🟡🟡🟡 - [NESTED SORTABLE] Initialize sortable when expanding, destroy when collapsing
      if (!isVisible && currentMenuState[sectionKey]) {
        // 🟡🟡🟡 - [INITIALIZE] Initialize sortable when expanding
        setTimeout(() => {
          initializeNestedSortable(nestedContent, sectionKey, currentMenuState[sectionKey]);
        }, 50); // Small delay to ensure DOM is updated
      } else if (isVisible && nestedSortableInstances[sectionKey]) {
        // 🟡🟡🟡 - [CLEANUP] Destroy sortable when collapsing
        nestedSortableInstances[sectionKey].destroy();
        delete nestedSortableInstances[sectionKey];
      }
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

    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3>Add New Section</h3>
          <button class="admin-modal-close">&times;</button>
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

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector('.admin-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
    modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
      const htmlType = document.getElementById('new-section-html-type').value;
      createNewSection(htmlType, insertAfterSectionKey);
      closeModal();
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
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

    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3>Add New ${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Item</h3>
          <button class="admin-modal-close">&times;</button>
        </div>
        <div class="admin-modal-body">
          <div class="admin-form-group">
            <label>Item Key (identifier):</label>
            <input type="text" id="new-nested-item-key" class="admin-form-input" placeholder="e.g., option1, item1">
          </div>
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
            <input type="text" id="new-nested-item-price-basis" class="admin-form-input" placeholder="e.g., Per guest">
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

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector('.admin-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
    modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
      const itemKey = document.getElementById('new-nested-item-key').value.trim();
      const label = document.getElementById('new-nested-item-label').value.trim();
      const price = parseFloat(document.getElementById('new-nested-item-price').value) || 0;
      const priceBasis = document.getElementById('new-nested-item-price-basis').value.trim();
      const description = itemType === 'radio' ? document.getElementById('new-nested-item-description').value.trim() : '';

      if (!itemKey) {
        alert('Please enter an item key');
        return;
      }

      createNewNestedItem(sectionKey, itemType, itemKey, { label, price, 'price-basis': priceBasis, description }, insertAfterItemKey);
      closeModal();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
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
    const newItem = {
      label: itemData.label || itemKey,
      price: itemData.price || 0,
      'price-basis': itemData['price-basis'] || ''
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
            <input type="file" id="edit-section-image-upload" class="admin-file-input" accept="image/jpeg,image/png,image/svg+xml" style="display: none;">
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

    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content admin-modal-large">
        <div class="admin-modal-header">
          <h3>Edit Section: ${sectionKey} (${htmlType})</h3>
          <button class="admin-modal-close">&times;</button>
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

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector('.admin-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
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

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
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
  function showEditRadioModal(sectionKey, radioKey, radio) {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content admin-modal-large">
        <div class="admin-modal-header">
          <h3>Edit Radio Option: ${radioKey}</h3>
          <button class="admin-modal-close">&times;</button>
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
            <input type="text" id="edit-radio-price-basis" class="admin-form-input" value="${escapeHtml(radio['price-basis'] || '')}" placeholder="e.g., Per guest">
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

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector('.admin-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
    modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
      const labelInput = modal.querySelector('#edit-radio-label');
      const priceInput = modal.querySelector('#edit-radio-price');
      const priceBasisInput = modal.querySelector('#edit-radio-price-basis');
      const descriptionInput = modal.querySelector('#edit-radio-description');

      if (labelInput) radio.label = labelInput.value.trim();
      if (priceInput) radio.price = parseFloat(priceInput.value) || 0;
      if (priceBasisInput) radio['price-basis'] = priceBasisInput.value.trim();
      if (descriptionInput) radio.description = descriptionInput.value.trim();

      // Preserve popup if it exists
      if (!radio.popup) radio.popup = {};

      currentMenuState[sectionKey].content[radioKey] = radio;
      renderSections();
      closeModal();
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Radio option updated:', radioKey);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
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
  function showEditCheckboxModal(sectionKey, checkboxKey, checkbox) {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3>Edit Checkbox Item: ${checkboxKey}</h3>
          <button class="admin-modal-close">&times;</button>
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
            <input type="text" id="edit-checkbox-price-basis" class="admin-form-input" value="${escapeHtml(checkbox['price-basis'] || '')}" placeholder="e.g., Per guest">
          </div>
        </div>
        <div class="admin-modal-footer">
          <button class="admin-button-secondary admin-modal-cancel">Cancel</button>
          <button class="admin-button-primary admin-modal-confirm">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector('.admin-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
    modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
      const labelInput = modal.querySelector('#edit-checkbox-label');
      const priceInput = modal.querySelector('#edit-checkbox-price');
      const priceBasisInput = modal.querySelector('#edit-checkbox-price-basis');

      if (labelInput) checkbox.label = labelInput.value.trim();
      if (priceInput) checkbox.price = parseFloat(priceInput.value) || 0;
      if (priceBasisInput) checkbox['price-basis'] = priceBasisInput.value.trim();

      currentMenuState[sectionKey].content[checkboxKey] = checkbox;
      renderSections();
      closeModal();
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Checkbox item updated:', checkboxKey);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
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
  function showEditDivModal(sectionKey, divKey, div) {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3>Edit Div Item: ${divKey}</h3>
          <button class="admin-modal-close">&times;</button>
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
            <input type="text" id="edit-div-price-basis" class="admin-form-input" value="${escapeHtml(div['price-basis'] || '')}" placeholder="e.g., Per day">
          </div>
        </div>
        <div class="admin-modal-footer">
          <button class="admin-button-secondary admin-modal-cancel">Cancel</button>
          <button class="admin-button-primary admin-modal-confirm">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector('.admin-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
    modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
      const labelInput = modal.querySelector('#edit-div-label');
      const priceInput = modal.querySelector('#edit-div-price');
      const priceBasisInput = modal.querySelector('#edit-div-price-basis');

      if (labelInput) div.label = labelInput.value.trim();
      if (priceInput) div.price = parseFloat(priceInput.value) || 0;
      if (priceBasisInput) div['price-basis'] = priceBasisInput.value.trim();

      currentMenuState[sectionKey].content[divKey] = div;
      renderSections();
      closeModal();
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Div item updated:', divKey);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
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
  function showEditAddonModal(sectionKey, addonKey, addon) {
    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3>Edit Addon Item: ${addonKey}</h3>
          <button class="admin-modal-close">&times;</button>
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
            <input type="text" id="edit-addon-price-basis" class="admin-form-input" value="${escapeHtml(addon['price-basis'] || '')}" placeholder="e.g., Per guest">
          </div>
        </div>
        <div class="admin-modal-footer">
          <button class="admin-button-secondary admin-modal-cancel">Cancel</button>
          <button class="admin-button-primary admin-modal-confirm">Save Changes</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector('.admin-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
    modal.querySelector('.admin-modal-confirm').addEventListener('click', () => {
      const labelInput = modal.querySelector('#edit-addon-label');
      const priceInput = modal.querySelector('#edit-addon-price');
      const priceBasisInput = modal.querySelector('#edit-addon-price-basis');

      if (labelInput) addon.label = labelInput.value.trim();
      if (priceInput) addon.price = parseFloat(priceInput.value) || 0;
      if (priceBasisInput) addon['price-basis'] = priceBasisInput.value.trim();

      currentMenuState[sectionKey]['addon-items'][addonKey] = addon;
      renderSections();
      closeModal();
      console.log('✅✅✅ - [ADMIN MENU EDITOR] Addon item updated:', addonKey);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
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
            <input type="file" id="edit-popup-section-image-upload" class="admin-file-input" accept="image/jpeg,image/png,image/svg+xml" style="display: none;">
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

    const modal = document.createElement('div');
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content admin-modal-large">
        <div class="admin-modal-header">
          <h3>Edit Popup Section: ${popupSectionKey} (${htmlType})</h3>
          <button class="admin-modal-close">&times;</button>
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

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector('.admin-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.admin-modal-cancel').addEventListener('click', closeModal);
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

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
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
    // 🟡🟡🟡 - [VALIDATION] Client-side validation (same as regular image upload)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.svg'];

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
        statusSpan.textContent = '❌ Invalid file type. Only JPG, PNG, and SVG are allowed.';
        statusSpan.className = 'admin-upload-status error';
      }
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Invalid file type:', file.type);
      return;
    }

    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      if (statusSpan) {
        statusSpan.textContent = '❌ Invalid file extension. Only .jpg, .jpeg, .png, and .svg are allowed.';
        statusSpan.className = 'admin-upload-status error';
      }
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Invalid file extension:', fileName);
      return;
    }

    // 🟡🟡🟡 - [UPLOAD] Show upload status
    if (statusSpan) {
      statusSpan.textContent = '⏳ Uploading...';
      statusSpan.className = 'admin-upload-status uploading';
    }

    try {
      // 🟡🟡🟡 - [FORMDATA] Create FormData with file
      const formData = new FormData();
      formData.append('image', file);

      // 🟡🟡🟡 - [API CALL] Upload file to server
      const response = await fetch('/admin/api/upload-image', {
        method: 'POST',
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

  // 🟡🟡🟡 - [SAVE MENU] Save menu to server
  async function saveMenu() {
    const saveButton = document.getElementById('save-menu-button');
    if (!saveButton) {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Save button not found');
      return;
    }

    try {
      // 🟡🟡🟡 - [JSON OUTPUT] Get current menu state as JSON
      const menuItems = getMenuJSON();

      // 🟡🟡🟡 - [UI STATE] Disable save button and show loading state
      saveButton.disabled = true;
      saveButton.textContent = 'Saving...';
      hideMessage();

      // 🟡🟡🟡 - [API CALL] Send menu data to server
      const response = await fetch('/admin/api/menu/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: menuData.menuName || 'Menu',
          menuItems: menuItems
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅✅✅ - [ADMIN MENU EDITOR] Menu saved successfully');
        showMessage('Menu saved successfully!', 'success');
        // 🟡🟡🟡 - [ORIGINAL DATA] Update original data to current state
        originalMenuData = JSON.parse(JSON.stringify(menuItems));
      } else {
        console.error('❗❗❗ - [ADMIN MENU EDITOR] Save failed:', result.message);
        showMessage(result.message || 'Failed to save menu. Please try again.', 'error');
      }
    } catch (err) {
      console.error('❌❌❌ - [ADMIN MENU EDITOR] Error saving menu:', err);
      showMessage('Error saving menu. Please check your connection and try again.', 'error');
    } finally {
      // 🟡🟡🟡 - [UI STATE] Re-enable save button
      saveButton.disabled = false;
      saveButton.textContent = 'Save Menu';
    }
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

  // 🟡🟡🟡 - [IMAGE UPLOAD] Handle image file upload
  async function handleImageUpload(sectionKey, file, statusSpan, previewContainer, srcInput) {
    // 🟡🟡🟡 - [VALIDATION] Client-side validation
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.svg'];

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
        statusSpan.textContent = '❌ Invalid file type. Only JPG, PNG, and SVG are allowed.';
        statusSpan.className = 'admin-upload-status error';
      }
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Invalid file type:', file.type);
      return;
    }

    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      if (statusSpan) {
        statusSpan.textContent = '❌ Invalid file extension. Only .jpg, .jpeg, .png, and .svg are allowed.';
        statusSpan.className = 'admin-upload-status error';
      }
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Invalid file extension:', fileName);
      return;
    }

    // 🟡🟡🟡 - [UPLOAD] Show upload status
    if (statusSpan) {
      statusSpan.textContent = '⏳ Uploading...';
      statusSpan.className = 'admin-upload-status uploading';
    }

    try {
      // 🟡🟡🟡 - [FORMDATA] Create FormData with file
      const formData = new FormData();
      formData.append('image', file);

      // 🟡🟡🟡 - [API CALL] Upload file to server
      const response = await fetch('/admin/api/upload-image', {
        method: 'POST',
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
    const saveButton = document.getElementById('save-menu-button');
    const resetButton = document.getElementById('reset-menu-button');

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
