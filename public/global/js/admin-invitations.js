// 2025-12-30T17:30:00Z 🟡🟡🟡 - [ADMIN INVITATIONS] Client-side JavaScript for invitation management page

(function() {
  'use strict';

  console.log('🟡🟡🟡 - [ADMIN INVITATIONS] Initializing invitation management page');

  // 🟡🟡🟡 - [DOM ELEMENTS] Get form and UI elements
  const invitationForm = document.getElementById('invitation-form');
  const createButton = document.getElementById('create-invitation-button');
  const invitationResult = document.getElementById('invitation-result');
  const invitationLinkDisplay = document.getElementById('invitation-link-display');
  const copyButton = document.getElementById('copy-invitation-link-button');
  const messageEl = document.getElementById('admin-message');
  const invitationMessage = invitationResult.querySelector('.admin-invitation-message');

  // 🟡🟡🟡 - [FORM SUBMISSION] Handle invitation form submission
  if (invitationForm) {
    invitationForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      console.log('🟡🟡🟡 - [ADMIN INVITATIONS] Form submitted');

      // 🟡🟡🟡 - [VALIDATION] Get form data
      const formData = new FormData(invitationForm);
      const email = formData.get('email')?.trim() || '';
      const theme = formData.get('theme')?.trim() || '';

      // 🟡🟡🟡 - [CLIENT VALIDATION] Basic client-side validation
      if (!email || !theme) {
        showMessage('Please fill in all required fields', 'error');
        return;
      }

      // 🟡🟡🟡 - [EMAIL VALIDATION] Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
      }

      // 🟡🟡🟡 - [THEME VALIDATION] Theme format check
      const themeRegex = /^[a-zA-Z0-9_-]+$/;
      if (!themeRegex.test(theme)) {
        showMessage('Theme can only contain letters, numbers, underscores, and hyphens', 'error');
        return;
      }

      // 🟡🟡🟡 - [UI STATE] Disable button and show loading state
      createButton.disabled = true;
      createButton.textContent = 'Creating...';
      hideMessage();
      invitationResult.style.display = 'none';

      try {
        // 🟡🟡🟡 - [API REQUEST] Send invitation creation request
        console.log('🟡🟡🟡 - [ADMIN INVITATIONS] Sending invitation creation request');
        const response = await fetch('/admin/invitations/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: email,
            theme: theme
          })
        });

        const data = await response.json();
        console.log('🟡🟡🟡 - [ADMIN INVITATIONS] Response received:', data);

        if (response.ok && data.success) {
          // ✅✅✅ - [SUCCESS] Display invitation link
          console.log('✅✅✅ - [ADMIN INVITATIONS] Invitation created successfully');
          
          invitationLinkDisplay.value = data.invitationLink;
          invitationMessage.textContent = `Invitation link created for ${email}. The invitation email has been sent, and you can also share this link directly.`;
          invitationResult.style.display = 'block';
          
          // 🟡🟡🟡 - [SCROLL] Scroll to result
          invitationResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          
          showMessage('Invitation created successfully!', 'success');
        } else {
          // ❗❗❗ - [ERROR] Show error message
          console.error('❗❗❗ - [ADMIN INVITATIONS] Error creating invitation:', data.message);
          showMessage(data.message || 'Failed to create invitation. Please try again.', 'error');
        }
      } catch (error) {
        // ❗❗❗ - [ERROR] Handle network or other errors
        console.error('❗❗❗ - [ADMIN INVITATIONS] Error during invitation creation:', error);
        showMessage('An error occurred while creating the invitation. Please try again.', 'error');
      } finally {
        // 🟡🟡🟡 - [UI STATE] Re-enable button
        createButton.disabled = false;
        createButton.textContent = 'Create Invitation Link';
      }
    });
  }

  // 🟡🟡🟡 - [COPY FUNCTIONALITY] Handle copy to clipboard
  if (copyButton && invitationLinkDisplay) {
    copyButton.addEventListener('click', async function() {
      const link = invitationLinkDisplay.value;
      
      if (!link) {
        showMessage('No invitation link to copy', 'error');
        return;
      }

      try {
        // 🟡🟡🟡 - [CLIPBOARD API] Use modern Clipboard API with fallback
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(link);
          console.log('✅✅✅ - [ADMIN INVITATIONS] Link copied to clipboard via Clipboard API');
        } else {
          // 🟡🟡🟡 - [FALLBACK] Fallback for older browsers
          invitationLinkDisplay.select();
          invitationLinkDisplay.setSelectionRange(0, 99999); // For mobile devices
          document.execCommand('copy');
          console.log('🟡🟡🟡 - [ADMIN INVITATIONS] Link copied to clipboard via fallback method');
        }

        // ✅✅✅ - [FEEDBACK] Show success feedback
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        copyButton.style.backgroundColor = '#28a745';
        
        setTimeout(() => {
          copyButton.textContent = originalText;
          copyButton.style.backgroundColor = '';
        }, 2000);

        showMessage('Invitation link copied to clipboard!', 'success');
      } catch (error) {
        console.error('❗❗❗ - [ADMIN INVITATIONS] Error copying to clipboard:', error);
        showMessage('Failed to copy link. Please select and copy manually.', 'error');
      }
    });
  }

  // 🟡🟡🟡 - [MESSAGE DISPLAY] Show message to user
  function showMessage(message, type) {
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.className = `admin-message ${type}`;
    messageEl.style.display = 'block';

    // 🟡🟡🟡 - [AUTO HIDE] Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        hideMessage();
      }, 5000);
    }
  }

  // 🟡🟡🟡 - [MESSAGE HIDE] Hide message
  function hideMessage() {
    if (messageEl) {
      messageEl.style.display = 'none';
    }
  }

  console.log('✅✅✅ - [ADMIN INVITATIONS] Invitation management page initialized');
})();

