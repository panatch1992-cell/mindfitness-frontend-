/**
 * Mind Fitness - Cookie Consent
 * PDPA compliant cookie consent banner
 */

(function(window, document) {
  'use strict';

  const COOKIE_NAME = 'mf_cookie_consent';
  const COOKIE_EXPIRY = 365; // days

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
  }

  function hasConsent() {
    return getCookie(COOKIE_NAME) === 'accepted';
  }

  function setConsent(accepted) {
    setCookie(COOKIE_NAME, accepted ? 'accepted' : 'declined', COOKIE_EXPIRY);
  }

  function createBanner() {
    const banner = document.createElement('div');
    banner.id = 'cookie-consent-banner';
    banner.innerHTML = `
      <style>
        #cookie-consent-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #0B1E47;
          color: white;
          padding: 16px 24px;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
          font-family: 'Sarabun', sans-serif;
        }
        #cookie-consent-banner p {
          margin: 0;
          font-size: 14px;
          flex: 1;
          min-width: 200px;
        }
        #cookie-consent-banner a {
          color: #00A8A8;
        }
        .cookie-buttons {
          display: flex;
          gap: 12px;
        }
        .cookie-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .cookie-btn-accept {
          background: #00A8A8;
          color: white;
        }
        .cookie-btn-accept:hover {
          background: #008b8b;
        }
        .cookie-btn-decline {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
        }
        .cookie-btn-decline:hover {
          border-color: white;
        }
        @media (max-width: 600px) {
          #cookie-consent-banner {
            flex-direction: column;
            text-align: center;
          }
          .cookie-buttons {
            width: 100%;
            justify-content: center;
          }
        }
      </style>
      <p>
        เว็บไซต์นี้ใช้คุกกี้เพื่อปรับปรุงประสบการณ์การใช้งาน
        <a href="privacy-policy.html">นโยบายความเป็นส่วนตัว</a>
      </p>
      <div class="cookie-buttons">
        <button class="cookie-btn cookie-btn-decline" id="cookie-decline">ปฏิเสธ</button>
        <button class="cookie-btn cookie-btn-accept" id="cookie-accept">ยอมรับ</button>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('cookie-accept').addEventListener('click', function() {
      setConsent(true);
      banner.remove();
    });

    document.getElementById('cookie-decline').addEventListener('click', function() {
      setConsent(false);
      banner.remove();
    });
  }

  function init() {
    if (!hasConsent() && getCookie(COOKIE_NAME) !== 'declined') {
      createBanner();
    }
  }

  // Export
  window.MFCookieConsent = {
    hasConsent: hasConsent,
    setConsent: setConsent
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
