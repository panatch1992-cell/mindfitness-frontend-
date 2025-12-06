/**
 * Mind Fitness Security Tests
 * ISO/IEC 27001 Compliance Testing
 *
 * Run with: npx jest tests/security.test.js
 */

describe('MFSecurity Module', () => {
  // Mock browser environment
  beforeAll(() => {
    global.window = {};
    global.document = {
      readyState: 'complete',
      createElement: (tag) => ({
        textContent: '',
        get innerHTML() { return this.textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
      })
    };
    global.localStorage = {
      store: {},
      getItem: function(key) { return this.store[key] || null; },
      setItem: function(key, value) { this.store[key] = value; },
      removeItem: function(key) { delete this.store[key]; },
      clear: function() { this.store = {}; }
    };
    global.sessionStorage = {
      store: {},
      getItem: function(key) { return this.store[key] || null; },
      setItem: function(key, value) { this.store[key] = value; }
    };
    global.crypto = {
      getRandomValues: (arr) => arr.map(() => Math.floor(Math.random() * 256))
    };
    global.btoa = (str) => Buffer.from(str).toString('base64');
    global.atob = (str) => Buffer.from(str, 'base64').toString();

    // Load the security module
    require('../js/security.js');
  });

  describe('Encryption', () => {
    test('should encrypt and decrypt data correctly', () => {
      const testData = { message: 'Hello, World!', number: 42 };
      const encrypted = window.MFSecurity.Encryption.encrypt(testData);
      expect(encrypted).toBeTruthy();
      expect(typeof encrypted).toBe('string');

      const decrypted = window.MFSecurity.Encryption.decrypt(encrypted);
      expect(decrypted).toEqual(testData);
    });

    test('should return null for invalid encrypted data', () => {
      const result = window.MFSecurity.Encryption.decrypt('invalid-data');
      expect(result).toBeNull();
    });
  });

  describe('SecureStorage', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    test('should store and retrieve encrypted data', () => {
      const testData = { user: 'test', score: 100 };
      window.MFSecurity.SecureStorage.set('test_key', testData);
      const retrieved = window.MFSecurity.SecureStorage.get('test_key');
      expect(retrieved).toEqual(testData);
    });

    test('should return null for non-existent key', () => {
      const result = window.MFSecurity.SecureStorage.get('non_existent');
      expect(result).toBeNull();
    });

    test('should remove data correctly', () => {
      window.MFSecurity.SecureStorage.set('to_remove', { data: 'test' });
      window.MFSecurity.SecureStorage.remove('to_remove');
      expect(window.MFSecurity.SecureStorage.get('to_remove')).toBeNull();
    });
  });

  describe('Sanitizer', () => {
    test('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const sanitized = window.MFSecurity.Sanitizer.escapeHtml(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;');
    });

    test('should sanitize user input', () => {
      const maliciousInput = '<img src=x onerror=alert(1)>';
      const sanitized = window.MFSecurity.Sanitizer.sanitizeInput(maliciousInput);
      expect(sanitized).not.toContain('onerror');
    });

    test('should limit input length', () => {
      const longInput = 'a'.repeat(20000);
      const sanitized = window.MFSecurity.Sanitizer.sanitizeInput(longInput);
      expect(sanitized.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('CSRF', () => {
    test('should generate valid CSRF token', () => {
      const token = window.MFSecurity.CSRF.generateToken();
      expect(token).toBeTruthy();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    test('should add CSRF token to headers', () => {
      const headers = window.MFSecurity.CSRF.addToHeaders({ 'Content-Type': 'application/json' });
      expect(headers['X-CSRF-Token']).toBeTruthy();
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  describe('RateLimiter', () => {
    test('should allow requests within limit', () => {
      for (let i = 0; i < 5; i++) {
        expect(window.MFSecurity.RateLimiter.check('test_action', 10, 60000)).toBe(true);
      }
    });

    test('should block requests exceeding limit', () => {
      for (let i = 0; i < 10; i++) {
        window.MFSecurity.RateLimiter.check('limited_action', 5, 60000);
      }
      expect(window.MFSecurity.RateLimiter.check('limited_action', 5, 60000)).toBe(false);
    });
  });

  describe('SecurityCheck', () => {
    test('should detect HTTPS requirement', () => {
      global.location = { protocol: 'http:', hostname: 'example.com' };
      expect(window.MFSecurity.SecurityCheck.isSecure()).toBe(false);

      global.location = { protocol: 'https:', hostname: 'example.com' };
      expect(window.MFSecurity.SecurityCheck.isSecure()).toBe(true);

      global.location = { protocol: 'http:', hostname: 'localhost' };
      expect(window.MFSecurity.SecurityCheck.isSecure()).toBe(true);
    });
  });
});

describe('XSS Prevention', () => {
  test('should prevent script injection in posts', () => {
    const maliciousContent = '<script>document.cookie</script>';
    const div = document.createElement('div');
    div.textContent = maliciousContent;
    expect(div.innerHTML).not.toContain('<script>');
  });

  test('should prevent event handler injection', () => {
    const input = '<img src=x onerror=alert(1)>';
    const sanitized = window.MFSecurity.Sanitizer.sanitizeInput(input);
    expect(sanitized).not.toMatch(/onerror\s*=/i);
  });

  test('should prevent javascript: protocol injection', () => {
    const input = 'javascript:alert(1)';
    const sanitized = window.MFSecurity.Sanitizer.sanitizeInput(input);
    expect(sanitized).not.toMatch(/javascript:/i);
  });
});

describe('Data Protection', () => {
  test('sensitive data should be encrypted in storage', () => {
    const sensitiveData = { phone: '0891234567', score: 85 };
    window.MFSecurity.SecureStorage.set('sensitive', sensitiveData);

    const rawData = localStorage.getItem('mf_sensitive');
    const parsed = JSON.parse(rawData);

    // Data should be encrypted
    expect(parsed.encrypted).toBe(true);
    // Raw value should not contain plaintext
    expect(parsed.value).not.toContain('0891234567');
  });
});
