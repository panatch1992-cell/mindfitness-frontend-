/**
 * Mind Fitness - MHL-35 Assessment
 * Mental Health Literacy Assessment based on Thai DMH standards
 */

(function(window, document) {
  'use strict';

  // MHL-35 Questions (35 items across 4 domains)
  const MHL_QUESTIONS = {
    domain1: {
      name: 'ความรู้เกี่ยวกับปัญหาสุขภาพจิต',
      nameEn: 'Knowledge of Mental Health Problems',
      questions: [
        'ภาวะซึมเศร้าเป็นอาการเศร้าตามปกติที่ทุกคนมี',
        'โรควิตกกังวลสามารถรักษาให้หายได้',
        'ความเครียดที่มากเกินไปอาจทำให้เกิดปัญหาทางร่างกายได้',
        'อาการนอนไม่หลับเรื้อรังอาจเป็นสัญญาณของปัญหาสุขภาพจิต',
        'การใช้สารเสพติดสามารถนำไปสู่ปัญหาสุขภาพจิตได้',
        'โรคจิตเภทเกิดจากพ่อแม่เลี้ยงดูไม่ดี',
        'คนที่มีปัญหาสุขภาพจิตมักมีความรุนแรง',
        'การพูดถึงเรื่องฆ่าตัวตายอาจทำให้คนคิดฆ่าตัวตายมากขึ้น'
      ]
    },
    domain2: {
      name: 'การจัดการดูแลสุขภาพจิตตนเอง',
      nameEn: 'Self-Care for Mental Health',
      questions: [
        'การออกกำลังกายช่วยลดความเครียดได้',
        'การนอนหลับพักผ่อนอย่างเพียงพอช่วยให้สุขภาพจิตดี',
        'การพูดคุยระบายความรู้สึกช่วยลดความเครียดได้',
        'การทำกิจกรรมที่ชอบช่วยให้รู้สึกดีขึ้นได้',
        'การหายใจลึกๆ ช่วยลดความเครียดเฉียบพลันได้',
        'การหลีกเลี่ยงแอลกอฮอล์ช่วยให้สุขภาพจิตดีขึ้น',
        'การมีความสัมพันธ์ที่ดีกับคนรอบข้างช่วยให้สุขภาพจิตดี',
        'การจัดการเวลาอย่างเหมาะสมช่วยลดความเครียดได้',
        'การฝึกสมาธิหรือการผ่อนคลายช่วยให้จิตใจสงบ'
      ]
    },
    domain3: {
      name: 'การรู้จักแสวงหาความช่วยเหลือ',
      nameEn: 'Help-Seeking Knowledge',
      questions: [
        'หากมีปัญหาสุขภาพจิต ควรปรึกษาจิตแพทย์หรือนักจิตวิทยา',
        'การขอความช่วยเหลือเป็นสัญญาณของความอ่อนแอ',
        'ผู้ที่มีปัญหาสุขภาพจิตสามารถโทรสายด่วนสุขภาพจิต 1323 ได้',
        'นักจิตวิทยาคลินิกสามารถให้การบำบัดทางจิตได้',
        'การรักษาด้วยยาจิตเวชมีประโยชน์ในการรักษาปัญหาสุขภาพจิต',
        'โรงพยาบาลส่งเสริมสุขภาพตำบลสามารถให้บริการสุขภาพจิตเบื้องต้นได้',
        'แอปพลิเคชันสุขภาพจิตสามารถช่วยในการดูแลตนเองเบื้องต้นได้',
        'กลุ่มสนับสนุน (Support Group) ช่วยให้ผู้มีปัญหาสุขภาพจิตรู้สึกดีขึ้น',
        'การปรึกษาปัญหาสุขภาพจิตควรทำโดยเร็วก่อนที่อาการจะรุนแรง'
      ]
    },
    domain4: {
      name: 'ความสามารถในการเข้าถึงแหล่งบริการ',
      nameEn: 'Access to Mental Health Services',
      questions: [
        'ฉันรู้ว่าจะไปรับบริการสุขภาพจิตได้ที่ไหน',
        'ฉันสามารถจ่ายค่าบริการสุขภาพจิตได้',
        'สถานที่ให้บริการสุขภาพจิตอยู่ใกล้บ้านฉัน',
        'ฉันมีเวลาไปรับบริการสุขภาพจิต',
        'ฉันรู้สึกสะดวกใจที่จะไปพบจิตแพทย์หรือนักจิตวิทยา',
        'คนรอบข้างสนับสนุนให้ฉันไปรับบริการสุขภาพจิตหากจำเป็น',
        'ฉันรู้จักช่องทางการปรึกษาสุขภาพจิตออนไลน์',
        'ฉันมั่นใจว่าข้อมูลส่วนตัวจะถูกเก็บเป็นความลับ',
        'การไปพบจิตแพทย์ไม่ทำให้ฉันถูกตีตรา'
      ]
    }
  };

  // Answer options
  const ANSWER_OPTIONS = [
    { value: 4, label: 'เห็นด้วยอย่างยิ่ง' },
    { value: 3, label: 'เห็นด้วย' },
    { value: 2, label: 'ไม่แน่ใจ' },
    { value: 1, label: 'ไม่เห็นด้วย' },
    { value: 0, label: 'ไม่เห็นด้วยอย่างยิ่ง' }
  ];

  // Reverse scored items (0-indexed question numbers within domains)
  const REVERSE_ITEMS = {
    domain1: [0, 5, 6, 7], // Questions about misconceptions
    domain3: [1] // "Seeking help is weakness"
  };

  // Score interpretation
  const SCORE_LEVELS = [
    { min: 0, max: 70, level: 'ต่ำ', color: '#ef4444', description: 'ควรเพิ่มความรู้และทักษะด้านสุขภาพจิต' },
    { min: 71, max: 105, level: 'ปานกลาง', color: '#f59e0b', description: 'มีความรู้พื้นฐาน แต่ยังสามารถพัฒนาได้' },
    { min: 106, max: 140, level: 'สูง', color: '#22c55e', description: 'มีความรอบรู้ด้านสุขภาพจิตที่ดี' }
  ];

  // State
  let currentDomain = 0;
  let currentQuestion = 0;
  let answers = {};

  // Get all questions flattened
  function getAllQuestions() {
    const questions = [];
    Object.keys(MHL_QUESTIONS).forEach(domainKey => {
      const domain = MHL_QUESTIONS[domainKey];
      domain.questions.forEach((q, idx) => {
        questions.push({
          id: `${domainKey}_${idx}`,
          text: q,
          domain: domainKey,
          domainName: domain.name,
          isReverse: REVERSE_ITEMS[domainKey]?.includes(idx) || false
        });
      });
    });
    return questions;
  }

  // Calculate score
  function calculateScore() {
    const questions = getAllQuestions();
    let totalScore = 0;
    const domainScores = {};

    questions.forEach(q => {
      const answer = answers[q.id];
      if (answer !== undefined) {
        let score = answer;
        if (q.isReverse) {
          score = 4 - answer; // Reverse score
        }
        totalScore += score;

        if (!domainScores[q.domain]) {
          domainScores[q.domain] = { score: 0, max: 0, name: q.domainName };
        }
        domainScores[q.domain].score += score;
        domainScores[q.domain].max += 4;
      }
    });

    return { totalScore, domainScores };
  }

  // Get score level
  function getScoreLevel(score) {
    return SCORE_LEVELS.find(l => score >= l.min && score <= l.max) || SCORE_LEVELS[0];
  }

  // Export for use by other modules
  window.MHLAssessment = {
    questions: MHL_QUESTIONS,
    answerOptions: ANSWER_OPTIONS,
    getAllQuestions: getAllQuestions,
    calculateScore: calculateScore,
    getScoreLevel: getScoreLevel,
    answers: answers,
    setAnswer: function(questionId, value) {
      answers[questionId] = value;
    },
    getAnswer: function(questionId) {
      return answers[questionId];
    },
    reset: function() {
      answers = {};
    }
  };

})(window, document);
