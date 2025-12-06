/**
 * Mind Fitness - AI Chatbot Core
 * Handles communication with AI backend
 */

(function(window) {
  'use strict';

  const MINDBOT_CONFIG = {
    apiEndpoint: 'https://mindfitness-ai-backend.vercel.app/api/chat',
    maxMessages: 50,
    typingDelay: 1000,
    greetingMessage: 'สวัสดีครับ! ผมชื่อน้องมายด์ เป็น AI ที่พร้อมรับฟังและให้กำลังใจคุณ มีอะไรอยากเล่าให้ฟังไหมครับ? 💚'
  };

  // Chat history storage
  let chatHistory = [];

  /**
   * Send message to AI backend
   */
  async function sendMessage(message) {
    // Add user message to history
    chatHistory.push({
      role: 'user',
      content: message,
      timestamp: Date.now()
    });

    // Limit history size
    if (chatHistory.length > MINDBOT_CONFIG.maxMessages) {
      chatHistory = chatHistory.slice(-MINDBOT_CONFIG.maxMessages);
    }

    try {
      const response = await fetch(MINDBOT_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          history: chatHistory.slice(-10) // Send last 10 messages for context
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();

      // Add bot response to history
      const botMessage = data.response || data.message || 'ขอโทษครับ มีปัญหาในการตอบกลับ กรุณาลองใหม่อีกครั้ง';

      chatHistory.push({
        role: 'assistant',
        content: botMessage,
        timestamp: Date.now()
      });

      return {
        success: true,
        message: botMessage,
        crisis: data.crisis || false
      };

    } catch (error) {
      console.error('MindBot Error:', error);

      // Fallback response
      const fallbackMessage = 'ขอโทษครับ ตอนนี้ระบบมีปัญหาชั่วคราว กรุณาลองใหม่อีกครั้ง หรือถ้าต้องการความช่วยเหลือเร่งด่วน สามารถโทรสายด่วนสุขภาพจิต 1323 ได้ตลอด 24 ชั่วโมงครับ 💚';

      return {
        success: false,
        message: fallbackMessage,
        crisis: false
      };
    }
  }

  /**
   * Get greeting message
   */
  function getGreeting() {
    return MINDBOT_CONFIG.greetingMessage;
  }

  /**
   * Clear chat history
   */
  function clearHistory() {
    chatHistory = [];
  }

  /**
   * Get chat history
   */
  function getHistory() {
    return [...chatHistory];
  }

  /**
   * Check for crisis keywords
   */
  function checkCrisis(message) {
    const crisisKeywords = [
      'ฆ่าตัวตาย', 'อยากตาย', 'ไม่อยากมีชีวิต', 'จบชีวิต',
      'ทำร้ายตัวเอง', 'กรีดข้อมือ', 'suicide', 'kill myself'
    ];

    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  /**
   * Get crisis response
   */
  function getCrisisResponse() {
    return `ผมเข้าใจว่าคุณกำลังผ่านช่วงเวลาที่ยากลำบากมาก ความรู้สึกเหล่านี้หนักหนามาก แต่คุณไม่ได้อยู่คนเดียวนะครับ

🆘 กรุณาติดต่อสายด่วนสุขภาพจิต 1323 (24 ชั่วโมง)
พวกเขาพร้อมรับฟังและช่วยเหลือคุณครับ

ผมอยู่ตรงนี้รับฟังคุณเสมอนะครับ 💚`;
  }

  // Export to global scope
  window.MindBot = {
    sendMessage: sendMessage,
    getGreeting: getGreeting,
    clearHistory: clearHistory,
    getHistory: getHistory,
    checkCrisis: checkCrisis,
    getCrisisResponse: getCrisisResponse
  };

})(window);
