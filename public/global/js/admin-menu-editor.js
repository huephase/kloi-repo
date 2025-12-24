// 🟡🟡🟡 - [ADMIN MENU EDITOR] Admin menu editor JavaScript module
(function initAdminMenuEditor() {
  'use strict';

  // 🟡🟡🟡 - [INITIALIZATION] Read menu data from DOM data attributes
  function readMenuDataFromDOM() {
    // 🟡🟡🟡 - [DOM DATA] Get menu data from jsoneditor div data attributes
    const container = document.getElementById('jsoneditor');
    if (!container) {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] JSON editor container not found');
      const messageEl = document.getElementById('admin-message');
      if (messageEl) {
        messageEl.textContent = 'JSON editor container not found. Please refresh the page.';
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

      const menuData = {
        menu: menuItems,
        menuName: menuNameAttr && menuNameAttr !== 'null' ? menuNameAttr : null,
        theme: themeAttr || 'default'
      };

      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu data parsed successfully:', {
        hasMenu: menuData.menu !== null,
        menuName: menuData.menuName,
        theme: menuData.theme
      });

      return menuData;
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

  // 🟡🟡🟡 - [INITIALIZATION] Initialize editor with menu data
  function initializeEditor(menuData) {
    console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Initializing admin menu editor');

    // 🟡🟡🟡 - [MENU DATA] Extract menu data with defaults
    const { menu, menuName, theme } = menuData;
    
    // 🟡🟡🟡 - [MENU DATA] Log menu data for debugging
    console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Menu data extracted:', { 
      hasMenu: menu !== null && menu !== undefined, 
      menuName, 
      theme 
    });
    
    let jsonEditor = null;
    let originalMenuData = null;

    // 🟡🟡🟡 - [JSON EDITOR] Initialize JSON Editor
    function initializeJsonEditor() {
    const container = document.getElementById('jsoneditor');
    if (!container) {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] JSON editor container not found');
      return;
    }

    // 🟡🟡🟡 - [EDITOR OPTIONS] Configure JSON Editor options
    const options = {
      mode: 'tree',
      modes: ['code', 'tree', 'form', 'text', 'view'],
      search: true,
      history: true,
      navigationBar: true,
      statusBar: true,
      mainMenuBar: true,
      onError: function(err) {
        console.error('❗❗❗ - [ADMIN MENU EDITOR] JSON Editor error:', err);
      },
      onModeChange: function(newMode) {
        console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Editor mode changed to:', newMode);
      }
    };

    // 🟡🟡🟡 - [JSON EDITOR] Check if JSONEditor library is loaded
    if (typeof JSONEditor === 'undefined') {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] JSONEditor library not loaded. Check CDN connection.');
      const messageEl = document.getElementById('admin-message');
      if (messageEl) {
        messageEl.textContent = 'JSON Editor library failed to load. Please refresh the page.';
        messageEl.className = 'admin-message error';
        messageEl.style.display = 'block';
      }
      return;
    }

    try {
      // 🟡🟡🟡 - [INITIALIZE] Create JSON Editor instance
      jsonEditor = new JSONEditor(container, options);
      
      // 🟡🟡🟡 - [LOAD DATA] Load menu data into editor
      const initialData = menu || {};
      jsonEditor.set(initialData);
      originalMenuData = JSON.parse(JSON.stringify(initialData)); // Deep copy
      
      console.log('✅✅✅ - [ADMIN MENU EDITOR] JSON Editor initialized successfully');
    } catch (err) {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Error initializing JSON Editor:', err);
      showMessage('Error initializing JSON editor. Please refresh the page.', 'error');
    }
  }

  // 🟡🟡🟡 - [SAVE MENU] Save menu to server
  async function saveMenu() {
    const saveButton = document.getElementById('save-menu-button');
    if (!saveButton || !jsonEditor) {
      console.error('❗❗❗ - [ADMIN MENU EDITOR] Save button or editor not found');
      return;
    }

    try {
      // 🟡🟡🟡 - [VALIDATION] Validate JSON before saving
      let menuItems;
      try {
        menuItems = jsonEditor.get();
      } catch (err) {
        console.error('❗❗❗ - [ADMIN MENU EDITOR] Invalid JSON:', err);
        showMessage('Invalid JSON. Please fix errors before saving.', 'error');
        return;
      }

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
          name: menuName || 'Menu',
          menuItems: menuItems
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅✅✅ - [ADMIN MENU EDITOR] Menu saved successfully');
        showMessage('Menu saved successfully!', 'success');
        // Update original data to current state
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
    if (!jsonEditor || !originalMenuData) {
      console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] No original data to reset to');
      return;
    }

    if (confirm('Are you sure you want to reset all changes? This cannot be undone.')) {
      try {
        jsonEditor.set(originalMenuData);
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

    // 🟡🟡🟡 - [INITIALIZE] Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeJsonEditor);
    } else {
      initializeJsonEditor();
    }

    // 🟡🟡🟡 - [EVENT LISTENERS] Attach event listeners
    document.addEventListener('DOMContentLoaded', function() {
      const saveButton = document.getElementById('save-menu-button');
      const resetButton = document.getElementById('reset-menu-button');

      if (saveButton) {
        saveButton.addEventListener('click', saveMenu);
      }

      if (resetButton) {
        resetButton.addEventListener('click', resetMenu);
      }

      console.log('✅✅✅ - [ADMIN MENU EDITOR] Event listeners attached');
    });
  }

  // 🟡🟡🟡 - [START] Initialize when DOM is ready
  // ⚠️⚠️⚠️ - [INITIALIZATION] Wait for DOMContentLoaded to ensure DOM is ready
  function startInitialization() {
    console.log('🟡🟡🟡 - [ADMIN MENU EDITOR] Starting initialization');
    const menuData = readMenuDataFromDOM();
    if (menuData) {
      initializeEditor(menuData);
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

