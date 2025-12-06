/**
 * Mind Fitness - Auto Translate Module
 * Simple i18n support for Thai/English
 */

(function(window, document) {
  'use strict';

  const translations = {
    en: {
      // Therapist Apply Page
      apply_title: 'Apply to be a Therapist',
      apply_step1: 'Check Qualifications',
      apply_step1_desc: 'You must be a licensed clinical psychologist and agree to Mind Fitness verification',
      apply_step2: 'Submit Application',
      apply_step2_desc: 'Fill out the form and attach required documents',
      apply_step3: 'Review Process',
      apply_step3_desc: 'Wait for verification (5-7 business days)',
      apply_step4: 'Start Working',
      apply_step4_desc: 'After approval, set up your profile and start helping clients',
      submit: 'Submit Application',
      required: 'Required',
      processing: 'Processing...',
      success: 'Application submitted successfully!',
      error: 'An error occurred. Please try again.'
    },
    th: {
      // Therapist Apply Page
      apply_title: 'สมัครเป็นผู้ให้คำปรึกษา',
      apply_step1: 'ตรวจสอบคุณสมบัติ',
      apply_step1_desc: 'คุณต้องเป็นนักจิตวิทยาที่มีใบอนุญาต และยินยอมให้ทาง Mind Fitness ตรวจสอบประวัติ',
      apply_step2: 'ส่งใบสมัครและเอกสาร',
      apply_step2_desc: 'กรอกแบบฟอร์มและแนบเอกสารที่จำเป็น',
      apply_step3: 'รอการพิจารณา',
      apply_step3_desc: 'กระบวนการพิจารณาใช้เวลา 5-7 วันทำการ',
      apply_step4: 'เริ่มทำงาน',
      apply_step4_desc: 'หลังได้รับการอนุมัติ ตั้งค่าโปรไฟล์และเริ่มช่วยเหลือผู้รับบริการ',
      submit: 'ส่งใบสมัคร',
      required: 'จำเป็น',
      processing: 'กำลังดำเนินการ...',
      success: 'ส่งใบสมัครสำเร็จ!',
      error: 'เกิดข้อผิดพลาด กรุณาลองใหม่'
    }
  };

  // Get current language
  function getCurrentLang() {
    return localStorage.getItem('lang') || 'th';
  }

  // Translate a key
  function t(key) {
    const lang = getCurrentLang();
    return translations[lang]?.[key] || translations['th'][key] || key;
  }

  // Apply translations to elements with data-i18n attribute
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = t(key);
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.placeholder = t(key);
      }
    });
  }

  // Switch language
  function switchLang(lang) {
    localStorage.setItem('lang', lang);
    applyTranslations();
  }

  // Initialize
  function init() {
    applyTranslations();
  }

  // Auto init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export
  window.AutoTranslate = {
    t: t,
    switchLang: switchLang,
    getCurrentLang: getCurrentLang,
    applyTranslations: applyTranslations
  };

})(window, document);
