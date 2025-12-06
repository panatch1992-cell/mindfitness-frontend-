/**
 * Mind Fitness - Assessment Handler
 * Manages assessment state and submissions
 */

(function(window, document) {
  'use strict';

  // Storage key
  const STORAGE_KEY = 'mf_assessment_progress';

  /**
   * Save assessment progress
   */
  function saveProgress(assessmentType, data) {
    try {
      const progress = getProgress() || {};
      progress[assessmentType] = {
        ...data,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      return true;
    } catch (e) {
      console.error('Failed to save progress:', e);
      return false;
    }
  }

  /**
   * Get assessment progress
   */
  function getProgress(assessmentType) {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return assessmentType ? null : {};

      const progress = JSON.parse(data);
      return assessmentType ? progress[assessmentType] : progress;
    } catch (e) {
      console.error('Failed to get progress:', e);
      return assessmentType ? null : {};
    }
  }

  /**
   * Clear assessment progress
   */
  function clearProgress(assessmentType) {
    try {
      if (assessmentType) {
        const progress = getProgress() || {};
        delete progress[assessmentType];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      return true;
    } catch (e) {
      console.error('Failed to clear progress:', e);
      return false;
    }
  }

  /**
   * Submit assessment results
   */
  async function submitResults(assessmentType, results) {
    try {
      // For now, just save to local storage
      // In production, this would send to a backend API
      const submissions = JSON.parse(localStorage.getItem('mf_submissions') || '[]');
      submissions.push({
        type: assessmentType,
        results: results,
        timestamp: Date.now()
      });
      localStorage.setItem('mf_submissions', JSON.stringify(submissions));

      // Clear progress after successful submission
      clearProgress(assessmentType);

      return { success: true, message: 'บันทึกผลการประเมินเรียบร้อยแล้ว' };
    } catch (e) {
      console.error('Failed to submit results:', e);
      return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกผล' };
    }
  }

  /**
   * Generate PDF report (stub)
   */
  function generateReport(results) {
    // In production, this would generate a PDF
    console.log('Generating report:', results);
    return {
      success: true,
      message: 'ระบบกำลังสร้างรายงาน กรุณารอสักครู่'
    };
  }

  /**
   * Get action plan based on results
   */
  function getActionPlan(score, level) {
    const plans = {
      'ต่ำ': [
        {
          icon: '📚',
          title: 'เรียนรู้เพิ่มเติม',
          description: 'ศึกษาข้อมูลเกี่ยวกับสุขภาพจิตจากแหล่งที่เชื่อถือได้'
        },
        {
          icon: '💬',
          title: 'พูดคุยกับผู้เชี่ยวชาญ',
          description: 'ปรึกษานักจิตวิทยาหรือจิตแพทย์เพื่อรับคำแนะนำ'
        },
        {
          icon: '📞',
          title: 'สายด่วนสุขภาพจิต',
          description: 'โทร 1323 ได้ตลอด 24 ชั่วโมงหากต้องการความช่วยเหลือ'
        }
      ],
      'ปานกลาง': [
        {
          icon: '🧘',
          title: 'ฝึกการดูแลตนเอง',
          description: 'ฝึกเทคนิคการผ่อนคลายและจัดการความเครียด'
        },
        {
          icon: '📖',
          title: 'อ่าน Psychoeducation Comics',
          description: 'เรียนรู้เรื่องสุขภาพจิตผ่านการ์ตูนที่เข้าใจง่าย'
        },
        {
          icon: '🤝',
          title: 'สร้างเครือข่ายสนับสนุน',
          description: 'พูดคุยแลกเปลี่ยนกับคนที่ไว้ใจ'
        }
      ],
      'สูง': [
        {
          icon: '⭐',
          title: 'รักษาความรู้ที่มี',
          description: 'ยินดีด้วย! คุณมีความรอบรู้ด้านสุขภาพจิตที่ดี'
        },
        {
          icon: '💪',
          title: 'ช่วยเหลือคนรอบข้าง',
          description: 'แบ่งปันความรู้และสนับสนุนผู้อื่นที่ต้องการ'
        },
        {
          icon: '📈',
          title: 'พัฒนาต่อเนื่อง',
          description: 'ติดตามข้อมูลใหม่ๆ เกี่ยวกับสุขภาพจิต'
        }
      ]
    };

    return plans[level] || plans['ปานกลาง'];
  }

  // Export
  window.AssessmentHandler = {
    saveProgress: saveProgress,
    getProgress: getProgress,
    clearProgress: clearProgress,
    submitResults: submitResults,
    generateReport: generateReport,
    getActionPlan: getActionPlan
  };

})(window, document);
