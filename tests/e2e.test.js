/**
 * Mind Fitness E2E Tests
 * ISO/IEC 29110 Software Implementation Testing
 *
 * Run with: npx playwright test tests/e2e.test.js
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:8000';

test.describe('Home Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Mind Fitness/);
  });

  test('should have security headers', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    const headers = response.headers();

    // Check for security headers (meta tags in HTML)
    const content = await page.content();
    expect(content).toContain('Content-Security-Policy');
    expect(content).toContain('X-Content-Type-Options');
  });

  test('should navigate to MindSpace', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('a[href*="mindspace"]');
    await expect(page).toHaveURL(/mindspace/);
  });
});

test.describe('MindSpace Hub', () => {
  test('should display all features', async ({ page }) => {
    await page.goto(`${BASE_URL}/mindspace/index.html`);

    await expect(page.locator('text=น้องมายด์ AI')).toBeVisible();
    await expect(page.locator('text=Vent Wall')).toBeVisible();
    await expect(page.locator('text=Private Chat')).toBeVisible();
  });

  test('should navigate to AI chatbot', async ({ page }) => {
    await page.goto(`${BASE_URL}/mindspace/index.html`);
    await page.click('a[href="mindbot.html"]');
    await expect(page).toHaveURL(/mindbot/);
  });
});

test.describe('AI Chatbot (Mindbot)', () => {
  test('should load chatbot interface', async ({ page }) => {
    await page.goto(`${BASE_URL}/mindspace/mindbot.html`);

    await expect(page.locator('#messageInput')).toBeVisible();
    await expect(page.locator('#sendBtn')).toBeVisible();
  });

  test('should have suggestion buttons', async ({ page }) => {
    await page.goto(`${BASE_URL}/mindspace/mindbot.html`);

    await expect(page.locator('text=รู้สึกเครียด')).toBeVisible();
    await expect(page.locator('text=อยากระบาย')).toBeVisible();
  });

  test('should sanitize user input', async ({ page }) => {
    await page.goto(`${BASE_URL}/mindspace/mindbot.html`);

    // Try to inject script
    await page.fill('#messageInput', '<script>alert("xss")</script>');
    await page.click('#sendBtn');

    // Wait for message to appear
    await page.waitForTimeout(500);

    // Check that script is escaped
    const content = await page.content();
    expect(content).not.toContain('<script>alert');
    expect(content).toContain('&lt;script&gt;');
  });
});

test.describe('Vent Wall', () => {
  test('should load feed', async ({ page }) => {
    await page.goto(`${BASE_URL}/mindspace/vent-wall.html`);

    await expect(page.locator('.post-composer')).toBeVisible();
  });

  test('should open post modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/mindspace/vent-wall.html`);

    await page.click('.composer-input');
    await expect(page.locator('#postModal')).toBeVisible();
  });

  test('should have mood selector', async ({ page }) => {
    await page.goto(`${BASE_URL}/mindspace/vent-wall.html`);

    await page.click('.composer-input');
    await expect(page.locator('.mood-selector')).toBeVisible();
    await expect(page.locator('[data-mood="sad"]')).toBeVisible();
  });
});

test.describe('Private Chat', () => {
  test('should show matching screen', async ({ page }) => {
    await page.goto(`${BASE_URL}/mindspace/private-chat.html`);

    await expect(page.locator('#matchingScreen')).toBeVisible();
    await expect(page.locator('#startMatchBtn')).toBeVisible();
  });

  test('should display rules', async ({ page }) => {
    await page.goto(`${BASE_URL}/mindspace/private-chat.html`);

    await expect(page.locator('.rules')).toBeVisible();
    await expect(page.locator('text=เคารพซึ่งกันและกัน')).toBeVisible();
  });

  test('should start matching on button click', async ({ page }) => {
    await page.goto(`${BASE_URL}/mindspace/private-chat.html`);

    await page.click('#startMatchBtn');
    await expect(page.locator('#searchingScreen')).toBeVisible();
  });
});

test.describe('Dashboard', () => {
  test('should load dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/mindspace/dashboard.html`);

    await expect(page.locator('.stats-grid')).toBeVisible();
    await expect(page.locator('#chatCount')).toBeVisible();
  });

  test('should display activity section', async ({ page }) => {
    await page.goto(`${BASE_URL}/mindspace/dashboard.html`);

    await expect(page.locator('.activity-section')).toBeVisible();
  });
});

test.describe('Security', () => {
  test('should have CSP headers on all pages', async ({ page }) => {
    const pages = [
      '/index.html',
      '/mindspace/index.html',
      '/mindspace/mindbot.html',
      '/mindspace/vent-wall.html'
    ];

    for (const url of pages) {
      await page.goto(`${BASE_URL}${url}`);
      const content = await page.content();
      expect(content).toContain('Content-Security-Policy');
    }
  });

  test('should load security.js', async ({ page }) => {
    await page.goto(`${BASE_URL}/mindspace/mindbot.html`);

    const securityLoaded = await page.evaluate(() => {
      return typeof window.MFSecurity !== 'undefined';
    });

    expect(securityLoaded).toBe(true);
  });
});

test.describe('Accessibility', () => {
  test('should have proper page titles', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await expect(page).toHaveTitle(/Mind Fitness/);

    await page.goto(`${BASE_URL}/mindspace/mindbot.html`);
    await expect(page).toHaveTitle(/น้องมายด์/);
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('a[href*="mindspace"]')).toBeVisible();
  });
});

test.describe('Privacy & Terms', () => {
  test('should have privacy policy link', async ({ page }) => {
    await page.goto(BASE_URL);

    await expect(page.locator('a[href*="privacy-policy"]')).toBeVisible();
  });

  test('should load privacy policy page', async ({ page }) => {
    await page.goto(`${BASE_URL}/privacy-policy.html`);

    await expect(page.locator('text=นโยบายความเป็นส่วนตัว')).toBeVisible();
    await expect(page.locator('text=PDPA')).toBeVisible();
  });

  test('should load terms page', async ({ page }) => {
    await page.goto(`${BASE_URL}/terms.html`);

    await expect(page.locator('text=ข้อกำหนดการใช้งาน')).toBeVisible();
  });
});
