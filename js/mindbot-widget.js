/**
 * Mind Fitness - Chatbot Widget UI
 * Floating chat interface
 */

(function(window, document) {
  'use strict';

  // Create widget HTML
  function createWidget() {
    const widget = document.createElement('div');
    widget.className = 'mindbot-widget';
    widget.id = 'mindbot-widget';

    widget.innerHTML = `
      <div class="mindbot-chat">
        <div class="mindbot-header">
          <img src="images/mind-mascot/mind-support.svg" alt="น้องมายด์">
          <div class="mindbot-header-info">
            <h3>น้องมายด์ AI</h3>
            <p>พร้อมรับฟังคุณ 24 ชม.</p>
          </div>
        </div>
        <div class="mindbot-messages" id="mindbot-messages"></div>
        <div class="mindbot-disclaimer">
          น้องมายด์เป็น AI ไม่ใช่นักจิตวิทยา หากต้องการความช่วยเหลือเร่งด่วน โทร 1323
        </div>
        <div class="mindbot-input">
          <input type="text" id="mindbot-input" placeholder="พิมพ์ข้อความ..." autocomplete="off">
          <button id="mindbot-send" aria-label="ส่งข้อความ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"/>
            </svg>
          </button>
        </div>
      </div>
      <button class="mindbot-toggle" id="mindbot-toggle" aria-label="เปิดแชท">
        <img src="images/mind-mascot/mind-support.svg" alt="น้องมายด์">
        <span class="close-icon">&times;</span>
      </button>
    `;

    document.body.appendChild(widget);
    return widget;
  }

  // Add message to chat
  function addMessage(content, isBot = false) {
    const messagesContainer = document.getElementById('mindbot-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `mindbot-message ${isBot ? 'bot' : 'user'}`;
    messageDiv.textContent = content;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show typing indicator
  function showTyping() {
    const messagesContainer = document.getElementById('mindbot-messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'mindbot-message bot typing';
    typingDiv.id = 'mindbot-typing';
    typingDiv.innerHTML = `
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    `;

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Hide typing indicator
  function hideTyping() {
    const typingDiv = document.getElementById('mindbot-typing');
    if (typingDiv) {
      typingDiv.remove();
    }
  }

  // Handle send message
  async function handleSend() {
    const input = document.getElementById('mindbot-input');
    const sendBtn = document.getElementById('mindbot-send');

    if (!input || !sendBtn) return;

    const message = input.value.trim();
    if (!message) return;

    // Disable input while processing
    input.disabled = true;
    sendBtn.disabled = true;
    input.value = '';

    // Add user message
    addMessage(message, false);

    // Check for crisis
    if (window.MindBot && window.MindBot.checkCrisis(message)) {
      showTyping();
      setTimeout(() => {
        hideTyping();
        addMessage(window.MindBot.getCrisisResponse(), true);
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
      }, 1000);
      return;
    }

    // Show typing indicator
    showTyping();

    try {
      // Send to AI
      if (window.MindBot) {
        const response = await window.MindBot.sendMessage(message);
        hideTyping();
        addMessage(response.message, true);
      } else {
        // Fallback if MindBot not loaded
        hideTyping();
        addMessage('สวัสดีครับ! ผมชื่อน้องมายด์ ยินดีรับฟังคุณครับ 💚', true);
      }
    } catch (error) {
      hideTyping();
      addMessage('ขอโทษครับ มีปัญหาในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง', true);
    }

    // Re-enable input
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }

  // Initialize widget
  function init() {
    const widget = createWidget();

    const toggle = document.getElementById('mindbot-toggle');
    const input = document.getElementById('mindbot-input');
    const sendBtn = document.getElementById('mindbot-send');

    // Toggle chat
    toggle.addEventListener('click', function() {
      widget.classList.toggle('open');

      if (widget.classList.contains('open')) {
        // Show greeting on first open
        const messages = document.getElementById('mindbot-messages');
        if (messages && messages.children.length === 0) {
          const greeting = window.MindBot ? window.MindBot.getGreeting() : 'สวัสดีครับ! ผมชื่อน้องมายด์ พร้อมรับฟังคุณครับ 💚';
          addMessage(greeting, true);
        }
        input.focus();
      }
    });

    // Send on button click
    sendBtn.addEventListener('click', handleSend);

    // Send on Enter key
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleSend();
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
