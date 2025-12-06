/**
 * Mind Fitness - Content Protection
 * Disable right-click and text selection for protected content
 */

(function(window, document) {
  'use strict';

  // Only enable protection on specific pages
  const protectedPages = ['privacy-policy.html', 'terms.html'];
  const currentPage = window.location.pathname.split('/').pop();

  if (!protectedPages.includes(currentPage)) {
    return;
  }

  // Disable right-click on protected elements
  document.addEventListener('contextmenu', function(e) {
    if (e.target.classList.contains('protected-content')) {
      e.preventDefault();
      return false;
    }
  });

  // Disable text selection on protected elements
  document.addEventListener('selectstart', function(e) {
    if (e.target.classList.contains('protected-content')) {
      e.preventDefault();
      return false;
    }
  });

  // Disable copy on protected elements
  document.addEventListener('copy', function(e) {
    if (e.target.classList.contains('protected-content')) {
      e.preventDefault();
      return false;
    }
  });

  // Disable keyboard shortcuts for copying
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
      const selection = window.getSelection();
      if (selection.anchorNode) {
        let parent = selection.anchorNode.parentElement;
        while (parent) {
          if (parent.classList && parent.classList.contains('protected-content')) {
            e.preventDefault();
            return false;
          }
          parent = parent.parentElement;
        }
      }
    }
  });

})(window, document);
