/**
 * Private Chat API - Vercel Serverless Function
 * Real-time matching and anonymous chat system
 *
 * Actions:
 * - join_queue: Join matching queue
 * - leave_queue: Leave matching queue
 * - check_match: Check if matched with partner
 * - send_message: Send message to partner
 * - get_messages: Get new messages (polling)
 * - end_chat: End current chat session
 * - report: Report inappropriate behavior
 */

// In-memory storage (for demo - use Redis/DB in production)
// Note: Vercel serverless functions are stateless, so we use KV or external DB
// For this demo, we'll use a simple approach with Vercel KV or fallback

const AVATARS = ['🌸', '🌈', '🌙', '⭐', '🦋', '🌻', '🍀', '🎈', '🐱', '🐰', '🦊', '🐻'];
const NAMES = ['เพื่อนร่วมทาง', 'คนแปลกหน้า', 'ผู้ฟังที่ดี', 'เพื่อนใหม่', 'ใครบางคน', 'ผู้เดินทาง'];

// Simple in-memory store (resets on cold start - use Redis for production)
let matchingQueue = [];
let activeSessions = {};
let messages = {};

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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

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

    // Create session
    activeSessions[chatId] = {
      id: chatId,
      users: [user1, user2],
      createdAt: Date.now(),
      status: 'active'
    };

    // Initialize messages
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
      chatId: chatId,
      partner: userId === user1.id ? user2 : user1
    });
  }

  return res.status(200).json({
    success: true,
    userId: userId,
    matched: false,
    queuePosition: matchingQueue.findIndex(u => u.id === userId) + 1,
    queueSize: matchingQueue.length
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
    // Try to match again
    if (matchingQueue.length >= 2) {
      const user1 = matchingQueue.shift();
      const user2 = matchingQueue.shift();

      const chatId = generateId();

      activeSessions[chatId] = {
        id: chatId,
        users: [user1, user2],
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
        chatId: chatId,
        partner: userId === user1.id ? user2 : user1
      });
    }

    return res.status(200).json({
      success: true,
      matched: false,
      queuePosition: matchingQueue.findIndex(u => u.id === userId) + 1
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

// Send message
function handleSendMessage(res, userId, chatId, message) {
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

  // Add message
  if (!messages[chatId]) {
    messages[chatId] = [];
  }

  const newMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    senderId: userId,
    senderAvatar: user.avatar,
    senderName: user.name,
    content: sanitizedMessage,
    timestamp: Date.now()
  };

  messages[chatId].push(newMessage);

  // Keep only last 100 messages
  if (messages[chatId].length > 100) {
    messages[chatId] = messages[chatId].slice(-100);
  }

  return res.status(200).json({
    success: true,
    message: newMessage
  });
}

// Get messages (polling)
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

  // Mark session as ended
  session.status = 'ended';
  session.endedBy = userId;
  session.endedAt = Date.now();

  // Add system message
  if (!messages[chatId]) {
    messages[chatId] = [];
  }
  messages[chatId].push({
    id: 'sys_end_' + Date.now(),
    type: 'system',
    content: 'การสนทนาสิ้นสุดแล้ว ขอบคุณที่ใช้บริการค่ะ',
    timestamp: Date.now()
  });

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
  // In production: Store report in database
  console.log('Report:', { userId, chatId, reason, timestamp: new Date().toISOString() });

  return res.status(200).json({
    success: true,
    message: 'Report submitted. Thank you for helping keep our community safe.'
  });
}

// Heartbeat - keep connection alive
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

  // Update queue timestamp
  const queueUser = matchingQueue.find(u => u.id === userId);
  if (queueUser) {
    queueUser.joinedAt = Date.now();
  }

  return res.status(200).json({
    success: true
  });
}
