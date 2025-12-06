/**
 * Mind Fitness - Internationalization (i18n)
 * Language support for Thai and English
 */

(function(window) {
  'use strict';

  // Default language
  let currentLang = localStorage.getItem('mf_lang') || 'th';

  // Translations
  const translations = {
    th: {
      // Navigation
      'nav.home': 'หน้าแรก',
      'nav.school': 'โรงเรียน',
      'nav.mindspace': 'MindSpace',
      'nav.assessment': 'ประเมิน MHL',
      'nav.about': 'เกี่ยวกับเรา',

      // Common
      'common.loading': 'กำลังโหลด...',
      'common.submit': 'ส่ง',
      'common.cancel': 'ยกเลิก',
      'common.save': 'บันทึก',
      'common.close': 'ปิด',
      'common.next': 'ถัดไป',
      'common.previous': 'ก่อนหน้า',
      'common.start': 'เริ่มต้น',
      'common.finish': 'เสร็จสิ้น',

      // Assessment
      'assessment.title': 'แบบประเมินความรอบรู้ด้านสุขภาพจิต',
      'assessment.question': 'คำถามที่',
      'assessment.of': 'จาก',
      'assessment.complete': 'เสร็จสิ้นการประเมิน',

      // Crisis
      'crisis.hotline': 'สายด่วนสุขภาพจิต 1323 (24 ชั่วโมง)',
      'crisis.message': 'หากคุณต้องการความช่วยเหลือ กรุณาโทร',

      // Footer
      'footer.copyright': '© 2025 Mind Fitness | Mental Health Ecosystem',
      'footer.privacy': 'นโยบายความเป็นส่วนตัว',
      'footer.terms': 'ข้อกำหนด'
    },
    en: {
      // Navigation
      'nav.home': 'Home',
      'nav.school': 'School',
      'nav.mindspace': 'MindSpace',
      'nav.assessment': 'MHL Assessment',
      'nav.about': 'About Us',

      // Common
      'common.loading': 'Loading...',
      'common.submit': 'Submit',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.close': 'Close',
      'common.next': 'Next',
      'common.previous': 'Previous',
      'common.start': 'Start',
      'common.finish': 'Finish',

      // Assessment
      'assessment.title': 'Mental Health Literacy Assessment',
      'assessment.question': 'Question',
      'assessment.of': 'of',
      'assessment.complete': 'Assessment Complete',

      // Crisis
      'crisis.hotline': 'Mental Health Hotline 1323 (24 hours)',
      'crisis.message': 'If you need help, please call',

      // Footer
      'footer.copyright': '© 2025 Mind Fitness | Mental Health Ecosystem',
      'footer.privacy': 'Privacy Policy',
      'footer.terms': 'Terms of Service'
    }
  };

  /**
   * Get translation
   */
  function t(key, params = {}) {
    const langData = translations[currentLang] || translations['th'];
    let text = langData[key] || key;

    // Replace params
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });

    return text;
  }

  /**
   * Set language
   */
  function setLang(lang) {
    if (translations[lang]) {
      currentLang = lang;
      localStorage.setItem('mf_lang', lang);
      updatePageTranslations();
      return true;
    }
    return false;
  }

  /**
   * Get current language
   */
  function getLang() {
    return currentLang;
  }

  /**
   * Update all elements with data-i18n attribute
   */
  function updatePageTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = t(key);
    });
  }

  // Export to global scope
  window.MFi18n = {
    t: t,
    setLang: setLang,
    getLang: getLang,
    updatePageTranslations: updatePageTranslations
  };

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updatePageTranslations);
  } else {
    updatePageTranslations();
  }

})(window);
