/**
 * Mind Fitness - School Assessment
 * Assessment functionality for school portal
 */

(function(window, document) {
  'use strict';

  // School assessment state
  let schoolCode = '';
  let studentId = '';
  let assessmentData = {};

  /**
   * Validate school code
   */
  function validateSchoolCode(code) {
    // School codes are 6 characters
    return code && code.length === 6 && /^[A-Z0-9]+$/.test(code.toUpperCase());
  }

  /**
   * Validate student ID
   */
  function validateStudentId(id) {
    // Student IDs are numeric, at least 4 digits
    return id && id.length >= 4 && /^\d+$/.test(id);
  }

  /**
   * Login student
   */
  async function loginStudent(code, id) {
    if (!validateSchoolCode(code)) {
      return { success: false, message: 'รหัสโรงเรียนไม่ถูกต้อง' };
    }

    if (!validateStudentId(id)) {
      return { success: false, message: 'รหัสนักเรียนไม่ถูกต้อง' };
    }

    // In production, this would verify against backend
    schoolCode = code.toUpperCase();
    studentId = id;

    // Save to session
    sessionStorage.setItem('mf_school_session', JSON.stringify({
      schoolCode,
      studentId,
      loginTime: Date.now()
    }));

    return { success: true, message: 'เข้าสู่ระบบสำเร็จ' };
  }

  /**
   * Check if logged in
   */
  function isLoggedIn() {
    try {
      const session = sessionStorage.getItem('mf_school_session');
      if (!session) return false;

      const data = JSON.parse(session);
      // Session expires after 2 hours
      if (Date.now() - data.loginTime > 2 * 60 * 60 * 1000) {
        sessionStorage.removeItem('mf_school_session');
        return false;
      }

      schoolCode = data.schoolCode;
      studentId = data.studentId;
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Logout
   */
  function logout() {
    sessionStorage.removeItem('mf_school_session');
    schoolCode = '';
    studentId = '';
  }

  /**
   * Submit school assessment
   */
  async function submitAssessment(type, results) {
    if (!isLoggedIn()) {
      return { success: false, message: 'กรุณาเข้าสู่ระบบก่อน' };
    }

    const submission = {
      schoolCode,
      studentId,
      type,
      results,
      timestamp: Date.now()
    };

    // Save locally (in production, send to backend)
    try {
      const submissions = JSON.parse(localStorage.getItem('mf_school_submissions') || '[]');
      submissions.push(submission);
      localStorage.setItem('mf_school_submissions', JSON.stringify(submissions));

      return { success: true, message: 'บันทึกผลการประเมินเรียบร้อยแล้ว' };
    } catch (e) {
      return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึก' };
    }
  }

  /**
   * Get student history
   */
  function getStudentHistory() {
    if (!isLoggedIn()) return [];

    try {
      const submissions = JSON.parse(localStorage.getItem('mf_school_submissions') || '[]');
      return submissions.filter(s => s.schoolCode === schoolCode && s.studentId === studentId);
    } catch (e) {
      return [];
    }
  }

  // Initialize login form if present
  function initLoginForm() {
    const form = document.getElementById('school-login-form');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
      e.preventDefault();

      const codeInput = document.getElementById('school-code');
      const idInput = document.getElementById('student-id');
      const errorDiv = document.getElementById('login-error');

      const result = await loginStudent(codeInput.value, idInput.value);

      if (result.success) {
        // Redirect to assessment
        window.location.href = 'school-assessment.html';
      } else {
        if (errorDiv) {
          errorDiv.textContent = result.message;
          errorDiv.style.display = 'block';
        }
      }
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoginForm);
  } else {
    initLoginForm();
  }

  // Export
  window.SchoolAssessment = {
    loginStudent,
    isLoggedIn,
    logout,
    submitAssessment,
    getStudentHistory,
    getSchoolCode: () => schoolCode,
    getStudentId: () => studentId
  };

})(window, document);
