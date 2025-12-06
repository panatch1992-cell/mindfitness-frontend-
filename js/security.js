/**
 * Mind Fitness Security Utilities
 * ISO/IEC 27001 Compliance Module
 *
 * @version 1.0.0
 * @license MIT
 */

(function(window) {
  'use strict';

  // Security configuration
  const SECURITY_CONFIG = {
    encryptionKey: 'MF_2025_SEC_KEY', // In production, use environment variable
    tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
    maxInputLength: 10000,
    allowedTags: ['b', 'i', 'em', 'strong', 'br'],
  };

  /**
   * Simple XOR encryption for localStorage
   * Note: For production, use Web Crypto API or external library
   */
  const Encryption = {
    // Generate a simple hash key
    generateKey: function(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(36);
    },

    // XOR encrypt/decrypt
    xorCipher: function(text, key) {
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    },

    // Encrypt data
    encrypt: function(data) {
      try {
        const jsonStr = JSON.stringify(data);
        const encrypted = this.xorCipher(jsonStr, SECURITY_CONFIG.encryptionKey);
        return btoa(unescape(encodeURIComponent(encrypted)));
      } catch (e) {
        console.error('Encryption error:', e);
        return null;
      }
    },

    // Decrypt data
    decrypt: function(encryptedData) {
      try {
        const decoded = decodeURIComponent(escape(atob(encryptedData)));
        const decrypted = this.xorCipher(decoded, SECURITY_CONFIG.encryptionKey);
        return JSON.parse(decrypted);
      } catch (e) {
        console.error('Decryption error:', e);
        return null;
      }
    }
  };

  /**
   * Secure Storage wrapper for localStorage
   */
  const SecureStorage = {
    set: function(key, value, encrypt = true) {
      try {
        const data = {
          value: encrypt ? Encryption.encrypt(value) : value,
          encrypted: encrypt,
          timestamp: Date.now(),
          expiry: Date.now() + SECURITY_CONFIG.tokenExpiry
        };
        localStorage.setItem('mf_' + key, JSON.stringify(data));
        return true;
      } catch (e) {
        console.error('SecureStorage set error:', e);
        return false;
      }
    },

    get: function(key) {
      try {
        const item = localStorage.getItem('mf_' + key);
        if (!item) return null;

        const data = JSON.parse(item);

        // Check expiry
        if (data.expiry && Date.now() > data.expiry) {
          this.remove(key);
          return null;
        }

        return data.encrypted ? Encryption.decrypt(data.value) : data.value;
      } catch (e) {
        console.error('SecureStorage get error:', e);
        return null;
      }
    },

    remove: function(key) {
      localStorage.removeItem('mf_' + key);
    },

    clear: function() {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('mf_'));
      keys.forEach(k => localStorage.removeItem(k));
    }
  };

  /**
   * Input Sanitization
   * Prevents XSS attacks
   */
  const Sanitizer = {
    // Remove HTML tags except allowed ones
    stripTags: function(input, allowedTags = []) {
      if (typeof input !== 'string') return '';

      // First, escape all HTML
      let clean = input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

      return clean;
    },

    // Sanitize for display (escape HTML)
    escapeHtml: function(text) {
      if (typeof text !== 'string') return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    // Sanitize user input
    sanitizeInput: function(input) {
      if (typeof input !== 'string') return '';

      // Trim and limit length
      let clean = input.trim().substring(0, SECURITY_CONFIG.maxInputLength);

      // Remove potential script injections
      clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      clean = clean.replace(/javascript:/gi, '');
      clean = clean.replace(/on\w+\s*=/gi, '');
      clean = clean.replace(/data:/gi, '');

      return clean;
    },

    // Sanitize for rendering in HTML
    sanitizeForDisplay: function(input) {
      return this.escapeHtml(this.sanitizeInput(input));
    }
  };

  /**
   * CSRF Protection
   */
  const CSRF = {
    // Generate CSRF token
    generateToken: function() {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    // Get or create CSRF token
    getToken: function() {
      let token = sessionStorage.getItem('mf_csrf_token');
      if (!token) {
        token = this.generateToken();
        sessionStorage.setItem('mf_csrf_token', token);
      }
      return token;
    },

    // Add token to fetch options
    addToHeaders: function(headers = {}) {
      return {
        ...headers,
        'X-CSRF-Token': this.getToken()
      };
    }
  };

  /**
   * Rate Limiting (Client-side)
   */
  const RateLimiter = {
    limits: {},

    // Check if action is allowed
    check: function(action, maxRequests = 10, windowMs = 60000) {
      const now = Date.now();
      const key = 'rl_' + action;

      if (!this.limits[key]) {
        this.limits[key] = { count: 0, resetTime: now + windowMs };
      }

      if (now > this.limits[key].resetTime) {
        this.limits[key] = { count: 0, resetTime: now + windowMs };
      }

      if (this.limits[key].count >= maxRequests) {
        return false;
      }

      this.limits[key].count++;
      return true;
    },

    // Get remaining requests
    remaining: function(action, maxRequests = 10) {
      const key = 'rl_' + action;
      if (!this.limits[key]) return maxRequests;
      return Math.max(0, maxRequests - this.limits[key].count);
    }
  };

  /**
   * Security Headers Check
   */
  const SecurityCheck = {
    // Check if running on HTTPS
    isSecure: function() {
      return location.protocol === 'https:' || location.hostname === 'localhost';
    },

    // Log security warnings
    audit: function() {
      const warnings = [];

      if (!this.isSecure()) {
        warnings.push('WARNING: Not running on HTTPS');
      }

      if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
        warnings.push('WARNING: Web Crypto API not available');
      }

      if (warnings.length > 0) {
        console.warn('Security Audit:', warnings);
      }

      return warnings;
    }
  };

  // Export to global scope
  window.MFSecurity = {
    Encryption: Encryption,
    SecureStorage: SecureStorage,
    Sanitizer: Sanitizer,
    CSRF: CSRF,
    RateLimiter: RateLimiter,
    SecurityCheck: SecurityCheck,
    version: '1.0.0'
  };

  // Run security audit on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      SecurityCheck.audit();
    });
  } else {
    SecurityCheck.audit();
  }

})(window);
