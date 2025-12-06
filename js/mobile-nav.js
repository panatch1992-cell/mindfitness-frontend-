/**
 * Mind Fitness - Mobile Navigation
 * Handles mobile menu toggle
 */

(function(window, document) {
  'use strict';

  function initMobileNav() {
    const toggle = document.getElementById('mobile-nav-toggle') || document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-nav') || document.querySelector('.nav');

    if (!toggle || !nav) return;

    // Toggle menu on click
    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      nav.classList.toggle('active');

      // Update toggle icon
      if (nav.classList.contains('active')) {
        toggle.innerHTML = '&times;';
        toggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      } else {
        toggle.innerHTML = '&#9776;';
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    // Close menu when clicking on a link
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        nav.classList.remove('active');
        toggle.innerHTML = '&#9776;';
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && nav.classList.contains('active')) {
        nav.classList.remove('active');
        toggle.innerHTML = '&#9776;';
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (nav.classList.contains('active') &&
          !nav.contains(e.target) &&
          !toggle.contains(e.target)) {
        nav.classList.remove('active');
        toggle.innerHTML = '&#9776;';
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }

})(window, document);
