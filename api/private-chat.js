/**
 * Private Chat API - Vercel Serverless Function
 * Real-time matching and anonymous chat system with AI Fallback
 *
 * Actions:
 * - join_queue: Join matching queue
 * - leave_queue: Leave matching queue
 * - check_match: Check if matched with partner
 * - request_ai: Request AI partner when no match (NEW)
 * - send_message: Send message to partner
 * - get_messages: Get new messages (polling)
 * - end_chat: End current chat session
 * - report: Report inappropriate behavior
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Mascot avatar images
const AVATARS = [
  '../images/mind-mascot/avatar-1.svg',
  '../images/mind-mascot/avatar-2.svg',
  '../images/mind-mascot/avatar-3.svg',
  '../images/mind-mascot/avatar-4.svg',
  '../images/mind-mascot/avatar-5.svg',
  '../images/mind-mascot/avatar-6.svg'
];
const NAMES = ['เพื่อนร่วมทาง', 'คนแปลกหน้า', 'ผู้ฟังที่ดี', 'เพื่อนใหม่', 'ใครบางคน', 'ผู้เดินทาง'];

// AI Partner profile
const AI_PARTNER = {
  id: 'ai_mind',
  avatar: '../images/mind-mascot/mind-support.svg',
  name: 'น้องมายด์ AI',
  isAI: true
};

// In-memory store
let matchingQueue = [];
let activeSessions = {};
let messages = {};
let conversationHistory = {}; // Store AI conversation context

// Helper functions
function generateId() {
  return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getRandomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

function getRandomName() {
  return NAMES[Math.floor(Math.random() * NAMES.length)];
}

// Call Claude API for AI response
async function getAIResponse(chatId, userMessage) {
  if (!ANTHROPIC_API_KEY) {
    // Fallback responses when no API key
    const fallbacks = [
      'ขอบคุณที่เล่าให้ฟังนะคะ เล่าต่อได้เลยค่ะ',
      'เข้าใจค่ะ บางทีการพูดออกมาก็ช่วยได้นะคะ',
      'คุณรู้สึกอย่างไรบ้างคะตอนนี้?',
      'ฟังดูไม่ง่ายเลยนะคะ ขอบคุณที่ไว้วางใจเล่าให้ฟังค่ะ',
      'คุณเก่งมากที่ผ่านมาได้นะคะ'
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // Build conversation history
  if (!conversationHistory[chatId]) {
    conversationHistory[chatId] = [];
  }

  conversationHistory[chatId].push({ role: 'user', content: userMessage });

  // Keep only last 10 messages for context
  if (conversationHistory[chatId].length > 10) {
    conversationHistory[chatId] = conversationHistory[chatId].slice(-10);
  }

  const systemPrompt = `คุณคือ "น้องมายด์" ผู้ฟังที่ดีและเพื่อนคุยแบบ anonymous
คุณเป็นผู้ฟังที่:
- รับฟังอย่างเข้าใจ ไม่ตัดสิน
- ให้กำลังใจอย่างอ่อนโยน
- ถามคำถามเพื่อให้เขาได้ระบาย ไม่ใช่เพื่อวิเคราะห์
- ไม่ให้คำแนะนำเว้นแต่ถูกถาม
- ตอบสั้นๆ 1-3 ประโยค เหมือนแชทกับเพื่อน
- ใช้ภาษาไทยที่เป็นกันเอง ไม่เป็นทางการ
- ถ้าเป็นเรื่องวิกฤต/อยากทำร้ายตัวเอง แนะนำสายด่วน 1323

ตัวอย่างการตอบ:
- "เข้าใจเลยค่ะ บางทีก็รู้สึกแบบนั้นเหมือนกัน"
- "ฟังดูหนักเลยนะ อยากเล่าเพิ่มไหมคะ?"
- "ขอบคุณที่เล่าให้ฟังนะ ❤️"`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        temperature: 0.8,
        system: systemPrompt,
        messages: conversationHistory[chatId]
      })
    });

    if (!response.ok) {
      throw new Error('API call failed');
    }

    const data = await response.json();
    const aiMessage = data.content?.[0]?.text || 'ขอบคุณที่เล่าให้ฟังนะคะ';

    // Add AI response to history
    conversationHistory[chatId].push({ role: 'assistant', content: aiMessage });

    return aiMessage;
  } catch (e) {
    console.error('AI Response Error:', e);
    return 'ขอบคุณที่เล่าให้ฟังนะคะ เล่าต่อได้เลยค่ะ';
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).end();
  }

  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, userId, chatId, message, reason } = req.body;

    switch (action) {
      case 'join_queue':
        return handleJoinQueue(res, userId);

      case 'leave_queue':
        return handleLeaveQueue(res, userId);

      case 'check_match':
        return handleCheckMatch(res, userId);

      case 'request_ai':
        return handleRequestAI(res, userId);

      case 'send_message':
        return handleSendMessage(res, userId, chatId, message);

      case 'get_messages':
        return handleGetMessages(res, userId, chatId);

      case 'end_chat':
        return handleEndChat(res, userId, chatId);

      case 'report':
        return handleReport(res, userId, chatId, reason);

      case 'heartbeat':
        return handleHeartbeat(res, userId, chatId);

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Private Chat API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Join matching queue
function handleJoinQueue(res, existingUserId) {
  const userId = existingUserId || generateUserId();
  const userProfile = {
    id: userId,
    avatar: getRandomAvatar(),
    name: getRandomName(),
    joinedAt: Date.now()
  };

  // Check if already in queue
  const existingIndex = matchingQueue.findIndex(u => u.id === userId);
  if (existingIndex >= 0) {
    matchingQueue[existingIndex] = userProfile;
  } else {
    matchingQueue.push(userProfile);
  }

  // Clean up stale entries (older than 60 seconds)
  const now = Date.now();
  matchingQueue = matchingQueue.filter(u => now - u.joinedAt < 60000);

  // Try to match immediately
  if (matchingQueue.length >= 2) {
    const user1 = matchingQueue.shift();
    const user2 = matchingQueue.shift();

    const chatId = generateId();

    activeSessions[chatId] = {
      id: chatId,
      users: [user1, user2],
      isAIChat: false,
      createdAt: Date.now(),
      status: 'active'
    };

    messages[chatId] = [{
      id: 'sys_' + Date.now(),
      type: 'system',
      content: 'เริ่มการสนทนาแล้ว พูดคุยอย่างสุภาพนะคะ',
      timestamp: Date.now()
    }];

    return res.status(200).json({
      success: true,
      userId: userId,
      matched: true,
      isAIPartner: false,
      chatId: chatId,
      partner: userId === user1.id ? user2 : user1
    });
  }

  // Return with option to use AI
  return res.status(200).json({
    success: true,
    userId: userId,
    matched: false,
    queuePosition: matchingQueue.findIndex(u => u.id === userId) + 1,
    queueSize: matchingQueue.length,
    canRequestAI: true // Flag to show "Chat with AI" option
  });
}

// Request AI Partner (when no human match)
function handleRequestAI(res, userId) {
  // Remove from queue if present
  matchingQueue = matchingQueue.filter(u => u.id !== userId);

  const userProfile = {
    id: userId,
    avatar: getRandomAvatar(),
    name: getRandomName()
  };

  const chatId = generateId();

  // Create AI session
  activeSessions[chatId] = {
    id: chatId,
    users: [userProfile, AI_PARTNER],
    isAIChat: true,
    createdAt: Date.now(),
    status: 'active'
  };

  messages[chatId] = [
    {
      id: 'sys_' + Date.now(),
      type: 'system',
      content: 'คุณกำลังคุยกับน้องมายด์ AI ผู้ฟังที่พร้อมรับฟังคุณค่ะ',
      timestamp: Date.now()
    },
    {
      id: 'ai_welcome_' + Date.now(),
      senderId: AI_PARTNER.id,
      senderAvatar: AI_PARTNER.avatar,
      senderName: AI_PARTNER.name,
      content: 'สวัสดีค่ะ เราคือน้องมายด์ พร้อมรับฟังคุณนะคะ วันนี้เป็นอย่างไรบ้างคะ? 💚',
      timestamp: Date.now()
    }
  ];

  // Initialize conversation history
  conversationHistory[chatId] = [];

  return res.status(200).json({
    success: true,
    userId: userId,
    matched: true,
    isAIPartner: true,
    chatId: chatId,
    partner: AI_PARTNER
  });
}

// Leave matching queue
function handleLeaveQueue(res, userId) {
  matchingQueue = matchingQueue.filter(u => u.id !== userId);

  return res.status(200).json({
    success: true,
    message: 'Left queue'
  });
}

// Check if matched
function handleCheckMatch(res, userId) {
  // Check if still in queue
  const inQueue = matchingQueue.find(u => u.id === userId);
  if (inQueue) {
    // Calculate wait time
    const waitTime = Date.now() - inQueue.joinedAt;
    const suggestAI = waitTime > 15000; // Suggest AI after 15 seconds

    // Try to match again
    if (matchingQueue.length >= 2) {
      const user1 = matchingQueue.shift();
      const user2 = matchingQueue.shift();

      const chatId = generateId();

      activeSessions[chatId] = {
        id: chatId,
        users: [user1, user2],
        isAIChat: false,
        createdAt: Date.now(),
        status: 'active'
      };

      messages[chatId] = [{
        id: 'sys_' + Date.now(),
        type: 'system',
        content: 'เริ่มการสนทนาแล้ว พูดคุยอย่างสุภาพนะคะ',
        timestamp: Date.now()
      }];

      return res.status(200).json({
        success: true,
        matched: true,
        isAIPartner: false,
        chatId: chatId,
        partner: userId === user1.id ? user2 : user1
      });
    }

    return res.status(200).json({
      success: true,
      matched: false,
      queuePosition: matchingQueue.findIndex(u => u.id === userId) + 1,
      waitTime: waitTime,
      suggestAI: suggestAI // Suggest AI partner if waiting too long
    });
  }

  // Check if already in a session
  for (const [chatId, session] of Object.entries(activeSessions)) {
    const user = session.users.find(u => u.id === userId);
    if (user) {
      const partner = session.users.find(u => u.id !== userId);
      return res.status(200).json({
        success: true,
        matched: true,
        isAIPartner: session.isAIChat,
        chatId: chatId,
        partner: partner,
        sessionStatus: session.status
      });
    }
  }

  return res.status(200).json({
    success: true,
    matched: false,
    notInQueue: true
  });
}

// Send message (with AI response for AI chats)
async function handleSendMessage(res, userId, chatId, message) {
  if (!chatId || !message) {
    return res.status(400).json({ error: 'Missing chatId or message' });
  }

  const session = activeSessions[chatId];
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  if (session.status !== 'active') {
    return res.status(400).json({ error: 'Chat session ended' });
  }

  const user = session.users.find(u => u.id === userId);
  if (!user) {
    return res.status(403).json({ error: 'Not a participant' });
  }

  // Sanitize message
  const sanitizedMessage = message.trim().slice(0, 1000);

  if (!sanitizedMessage) {
    return res.status(400).json({ error: 'Empty message' });
  }

  // Add user message
  if (!messages[chatId]) {
    messages[chatId] = [];
  }

  const userMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    senderId: userId,
    senderAvatar: user.avatar,
    senderName: user.name,
    content: sanitizedMessage,
    timestamp: Date.now()
  };

  messages[chatId].push(userMessage);

  // If AI chat, generate AI response
  if (session.isAIChat) {
    const aiResponse = await getAIResponse(chatId, sanitizedMessage);

    const aiMessage = {
      id: 'ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      senderId: AI_PARTNER.id,
      senderAvatar: AI_PARTNER.avatar,
      senderName: AI_PARTNER.name,
      content: aiResponse,
      timestamp: Date.now() + 1000 // Slight delay to seem natural
    };

    messages[chatId].push(aiMessage);
  }

  // Keep only last 100 messages
  if (messages[chatId].length > 100) {
    messages[chatId] = messages[chatId].slice(-100);
  }

  return res.status(200).json({
    success: true,
    message: userMessage
  });
}

// Get messages
function handleGetMessages(res, userId, chatId) {
  if (!chatId) {
    return res.status(400).json({ error: 'Missing chatId' });
  }

  const session = activeSessions[chatId];
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found', ended: true });
  }

  const user = session.users.find(u => u.id === userId);
  if (!user) {
    return res.status(403).json({ error: 'Not a participant' });
  }

  const chatMessages = messages[chatId] || [];
  const partner = session.users.find(u => u.id !== userId);

  return res.status(200).json({
    success: true,
    messages: chatMessages,
    sessionStatus: session.status,
    isAIPartner: session.isAIChat,
    partner: partner
  });
}

// End chat
function handleEndChat(res, userId, chatId) {
  if (!chatId) {
    return res.status(400).json({ error: 'Missing chatId' });
  }

  const session = activeSessions[chatId];
  if (!session) {
    return res.status(200).json({ success: true, message: 'Session already ended' });
  }

  session.status = 'ended';
  session.endedBy = userId;
  session.endedAt = Date.now();

  if (!messages[chatId]) {
    messages[chatId] = [];
  }
  messages[chatId].push({
    id: 'sys_end_' + Date.now(),
    type: 'system',
    content: 'การสนทนาสิ้นสุดแล้ว ขอบคุณที่ใช้บริการค่ะ',
    timestamp: Date.now()
  });

  // Clean up conversation history
  delete conversationHistory[chatId];

  // Clean up after 5 minutes
  setTimeout(() => {
    delete activeSessions[chatId];
    delete messages[chatId];
  }, 5 * 60 * 1000);

  return res.status(200).json({
    success: true,
    message: 'Chat ended'
  });
}

// Report user
function handleReport(res, userId, chatId, reason) {
  console.log('Report:', { userId, chatId, reason, timestamp: new Date().toISOString() });

  return res.status(200).json({
    success: true,
    message: 'Report submitted. Thank you for helping keep our community safe.'
  });
}

// Heartbeat
function handleHeartbeat(res, userId, chatId) {
  if (chatId) {
    const session = activeSessions[chatId];
    if (session) {
      const user = session.users.find(u => u.id === userId);
      if (user) {
        user.lastSeen = Date.now();
      }

      return res.status(200).json({
        success: true,
        sessionStatus: session.status
      });
    }
  }

  const queueUser = matchingQueue.find(u => u.id === userId);
  if (queueUser) {
    queueUser.joinedAt = Date.now();
  }

  return res.status(200).json({
    success: true
  });
}
