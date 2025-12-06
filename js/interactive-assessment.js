/**
 * Mind Fitness - Interactive Assessment UI
 * UI controller for MHL-35 assessment
 */

(function(window, document) {
  'use strict';

  let currentIndex = 0;
  let questions = [];
  let isComplete = false;

  function init() {
    // Check if MHLAssessment is loaded
    if (!window.MHLAssessment) {
      console.error('MHLAssessment not loaded');
      return;
    }

    questions = window.MHLAssessment.getAllQuestions();

    // Check for saved progress
    const progress = window.AssessmentHandler?.getProgress('mhl-35');
    if (progress && progress.answers) {
      Object.assign(window.MHLAssessment.answers, progress.answers);
      currentIndex = progress.currentIndex || 0;
    }

    renderQuestion();
    updateProgress();
    bindEvents();
  }

  function renderQuestion() {
    const container = document.getElementById('question-container');
    if (!container || currentIndex >= questions.length) {
      if (currentIndex >= questions.length) {
        showResults();
      }
      return;
    }

    const q = questions[currentIndex];
    const savedAnswer = window.MHLAssessment.getAnswer(q.id);

    container.innerHTML = `
      <div class="section-header">
        <h3>${q.domainName}</h3>
        <p>คำถามที่ ${currentIndex + 1} จาก ${questions.length}</p>
      </div>
      <div class="question-card">
        <div class="question-number">${currentIndex + 1}</div>
        <p class="question-text">${q.text}</p>
        <div class="answer-options">
          ${window.MHLAssessment.answerOptions.map(opt => `
            <label class="answer-option ${savedAnswer === opt.value ? 'selected' : ''}">
              <input type="radio" name="answer" value="${opt.value}" ${savedAnswer === opt.value ? 'checked' : ''}>
              <span class="answer-radio"></span>
              <span class="answer-text">${opt.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <div class="assessment-nav">
        <button class="btn-prev" ${currentIndex === 0 ? 'disabled' : ''}>ก่อนหน้า</button>
        <button class="btn-next" ${savedAnswer === undefined ? 'disabled' : ''}>
          ${currentIndex === questions.length - 1 ? 'ดูผลลัพธ์' : 'ถัดไป'}
        </button>
      </div>
    `;

    bindQuestionEvents();
  }

  function bindQuestionEvents() {
    // Answer selection
    document.querySelectorAll('.answer-option').forEach(option => {
      option.addEventListener('click', function() {
        const value = parseInt(this.querySelector('input').value);
        const q = questions[currentIndex];

        window.MHLAssessment.setAnswer(q.id, value);

        // Update UI
        document.querySelectorAll('.answer-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');

        // Enable next button
        document.querySelector('.btn-next').disabled = false;

        // Save progress
        saveCurrentProgress();
      });
    });

    // Previous button
    const prevBtn = document.querySelector('.btn-prev');
    if (prevBtn) {
      prevBtn.addEventListener('click', function() {
        if (currentIndex > 0) {
          currentIndex--;
          renderQuestion();
          updateProgress();
        }
      });
    }

    // Next button
    const nextBtn = document.querySelector('.btn-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', function() {
        if (currentIndex < questions.length - 1) {
          currentIndex++;
          renderQuestion();
          updateProgress();
        } else {
          showResults();
        }
      });
    }
  }

  function updateProgress() {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');

    if (progressFill) {
      const percent = ((currentIndex + 1) / questions.length) * 100;
      progressFill.style.width = `${percent}%`;
    }

    if (progressText) {
      progressText.textContent = `${currentIndex + 1} / ${questions.length}`;
    }
  }

  function saveCurrentProgress() {
    if (window.AssessmentHandler) {
      window.AssessmentHandler.saveProgress('mhl-35', {
        answers: window.MHLAssessment.answers,
        currentIndex: currentIndex
      });
    }
  }

  function showResults() {
    isComplete = true;
    const result = window.MHLAssessment.calculateScore();
    const level = window.MHLAssessment.getScoreLevel(result.totalScore);
    const actionPlan = window.AssessmentHandler?.getActionPlan(result.totalScore, level.level) || [];

    const container = document.getElementById('question-container') || document.getElementById('assessment-form');
    if (!container) return;

    container.innerHTML = `
      <div class="results-container">
        <h2>ผลการประเมิน MHL-35</h2>
        <div class="result-score" style="color: ${level.color}">${result.totalScore}</div>
        <div class="result-level">ระดับ: <strong>${level.level}</strong></div>
        <p class="result-description">${level.description}</p>

        <div class="category-scores">
          ${Object.keys(result.domainScores).map(key => {
            const domain = result.domainScores[key];
            const percent = Math.round((domain.score / domain.max) * 100);
            return `
              <div class="category-score-card">
                <h4>${domain.name}</h4>
                <div class="score">${percent}%</div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="action-plan">
          <h3>แผนปฏิบัติการส่วนบุคคล</h3>
          ${actionPlan.map(item => `
            <div class="action-item">
              <div class="action-icon">${item.icon}</div>
              <div class="action-content">
                <h4>${item.title}</h4>
                <p>${item.description}</p>
              </div>
            </div>
          `).join('')}
        </div>

        <div style="margin-top: 32px; display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
          <button class="btn-primary" onclick="window.location.reload()">ทำแบบประเมินใหม่</button>
          <a href="mindspace/index.html" class="btn-outline">ไปยัง MindSpace</a>
        </div>
      </div>
    `;

    // Clear progress after completion
    if (window.AssessmentHandler) {
      window.AssessmentHandler.clearProgress('mhl-35');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bindEvents() {
    // Start assessment button
    const startBtn = document.getElementById('start-assessment');
    if (startBtn) {
      startBtn.addEventListener('click', function() {
        document.getElementById('assessment-intro')?.classList.add('hidden');
        document.getElementById('assessment-form')?.classList.remove('hidden');
        renderQuestion();
      });
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export
  window.InteractiveAssessment = {
    init: init,
    showResults: showResults,
    reset: function() {
      currentIndex = 0;
      window.MHLAssessment?.reset();
      renderQuestion();
      updateProgress();
    }
  };

})(window, document);
