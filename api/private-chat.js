/**
 * Private Chat API - MySQL Database Integration
 * Real-time matching and anonymous chat system with AI Fallback
 *
 * Actions:
 * - join_queue: Join matching queue
 * - leave_queue: Leave matching queue
 * - check_match: Check if matched with partner
 * - request_ai: Request AI partner when no match
 * - send_message: Send message to partner
 * - get_messages: Get new messages (polling)
 * - end_chat: End current chat session
 * - report: Report inappropriate behavior
 */

const db = require('../utils/db');

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

// In-memory queue for real-time matching (transient data)
let matchingQueue = [];
// In-memory conversation history for AI context
let conversationHistory = {};

// Helper functions
function generateId(prefix = 'chat') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
- ถ้าเป็นเรื่องวิกฤต/อยากทำร้ายตัวเอง แนะนำสายด่วน 1323`;

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
async function handleJoinQueue(res, existingUserId) {
  const userId = existingUserId || generateId('user');
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

  // Clean up stale entries
  const now = Date.now();
  matchingQueue = matchingQueue.filter(u => now - u.joinedAt < 60000);

  // Try to match
  if (matchingQueue.length >= 2) {
    const user1 = matchingQueue.shift();
    const user2 = matchingQueue.shift();

    const roomId = generateId('room');

    try {
      // Create chat room in database
      await db.insert('private_chat_rooms', {
        room_id: roomId,
        user1_session: user1.id,
        user1_avatar: user1.avatar,
        user1_name: user1.name,
        user2_session: user2.id,
        user2_avatar: user2.avatar,
        user2_name: user2.name,
        is_ai_chat: false,
        status: 'active',
        created_at: new Date()
      });

      // Add system message
      await db.insert('private_chat_messages', {
        room_id: roomId,
        sender_session: 'system',
        content: 'เริ่มการสนทนาแล้ว พูดคุยอย่างสุภาพนะคะ',
        is_system: true,
        created_at: new Date()
      });

      const partner = userId === user1.id ? user2 : user1;

      return res.status(200).json({
        success: true,
        userId: userId,
        matched: true,
        isAIPartner: false,
        chatId: roomId,
        partner: partner
      });
    } catch (error) {
      console.error('Create room error:', error);
      matchingQueue.unshift(user1, user2);
      return res.status(500).json({ error: 'Failed to create chat room' });
    }
  }

  return res.status(200).json({
    success: true,
    userId: userId,
    matched: false,
    queuePosition: matchingQueue.findIndex(u => u.id === userId) + 1,
    queueSize: matchingQueue.length,
    canRequestAI: true
  });
}

// Request AI Partner
async function handleRequestAI(res, userId) {
  matchingQueue = matchingQueue.filter(u => u.id !== userId);

  const userProfile = {
    id: userId,
    avatar: getRandomAvatar(),
    name: getRandomName()
  };

  const roomId = generateId('room');

  try {
    // Create AI chat room in database
    await db.insert('private_chat_rooms', {
      room_id: roomId,
      user1_session: userId,
      user1_avatar: userProfile.avatar,
      user1_name: userProfile.name,
      user2_session: AI_PARTNER.id,
      user2_avatar: AI_PARTNER.avatar,
      user2_name: AI_PARTNER.name,
      is_ai_chat: true,
      status: 'active',
      created_at: new Date()
    });

    // Add system message
    await db.insert('private_chat_messages', {
      room_id: roomId,
      sender_session: 'system',
      content: 'คุณกำลังคุยกับน้องมายด์ AI ผู้ฟังที่พร้อมรับฟังคุณค่ะ',
      is_system: true,
      created_at: new Date()
    });

    // Add AI welcome message
    await db.insert('private_chat_messages', {
      room_id: roomId,
      sender_session: AI_PARTNER.id,
      sender_avatar: AI_PARTNER.avatar,
      sender_name: AI_PARTNER.name,
      content: 'สวัสดีค่ะ เราคือน้องมายด์ พร้อมรับฟังคุณนะคะ วันนี้เป็นอย่างไรบ้างคะ?',
      is_ai: true,
      created_at: new Date()
    });

    // Initialize conversation history
    conversationHistory[roomId] = [];

    return res.status(200).json({
      success: true,
      userId: userId,
      matched: true,
      isAIPartner: true,
      chatId: roomId,
      partner: AI_PARTNER
    });
  } catch (error) {
    console.error('Create AI room error:', error);
    return res.status(500).json({ error: 'Failed to create AI chat room' });
  }
}

// Leave matching queue
function handleLeaveQueue(res, userId) {
  matchingQueue = matchingQueue.filter(u => u.id !== userId);
  return res.status(200).json({ success: true, message: 'Left queue' });
}

// Check if matched
async function handleCheckMatch(res, userId) {
  const inQueue = matchingQueue.find(u => u.id === userId);
  if (inQueue) {
    const waitTime = Date.now() - inQueue.joinedAt;
    const suggestAI = waitTime > 15000;

    // Try to match again
    if (matchingQueue.length >= 2) {
      const user1 = matchingQueue.shift();
      const user2 = matchingQueue.shift();

      const roomId = generateId('room');

      try {
        await db.insert('private_chat_rooms', {
          room_id: roomId,
          user1_session: user1.id,
          user1_avatar: user1.avatar,
          user1_name: user1.name,
          user2_session: user2.id,
          user2_avatar: user2.avatar,
          user2_name: user2.name,
          is_ai_chat: false,
          status: 'active',
          created_at: new Date()
        });

        await db.insert('private_chat_messages', {
          room_id: roomId,
          sender_session: 'system',
          content: 'เริ่มการสนทนาแล้ว พูดคุยอย่างสุภาพนะคะ',
          is_system: true,
          created_at: new Date()
        });

        const partner = userId === user1.id ? user2 : user1;

        return res.status(200).json({
          success: true,
          matched: true,
          isAIPartner: false,
          chatId: roomId,
          partner: partner
        });
      } catch (error) {
        console.error('Match error:', error);
        matchingQueue.unshift(user1, user2);
      }
    }

    return res.status(200).json({
      success: true,
      matched: false,
      queuePosition: matchingQueue.findIndex(u => u.id === userId) + 1,
      waitTime: waitTime,
      suggestAI: suggestAI
    });
  }

  // Check if in active session
  try {
    const room = await db.queryOne(
      `SELECT * FROM private_chat_rooms
       WHERE (user1_session = ? OR user2_session = ?) AND status = 'active'`,
      [userId, userId]
    );

    if (room) {
      const isUser1 = room.user1_session === userId;
      const partner = {
        id: isUser1 ? room.user2_session : room.user1_session,
        avatar: isUser1 ? room.user2_avatar : room.user1_avatar,
        name: isUser1 ? room.user2_name : room.user1_name,
        isAI: room.is_ai_chat && !isUser1
      };

      return res.status(200).json({
        success: true,
        matched: true,
        isAIPartner: room.is_ai_chat,
        chatId: room.room_id,
        partner: partner,
        sessionStatus: room.status
      });
    }
  } catch (error) {
    console.error('Check match error:', error);
  }

  return res.status(200).json({
    success: true,
    matched: false,
    notInQueue: true
  });
}

// Send message
async function handleSendMessage(res, userId, chatId, message) {
  if (!chatId || !message) {
    return res.status(400).json({ error: 'Missing chatId or message' });
  }

  try {
    const room = await db.queryOne(
      'SELECT * FROM private_chat_rooms WHERE room_id = ?',
      [chatId]
    );

    if (!room) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    if (room.status !== 'active') {
      return res.status(400).json({ error: 'Chat session ended' });
    }

    const isUser1 = room.user1_session === userId;
    const isParticipant = isUser1 || room.user2_session === userId;

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const sanitizedMessage = message.trim().slice(0, 1000);
    if (!sanitizedMessage) {
      return res.status(400).json({ error: 'Empty message' });
    }

    const userAvatar = isUser1 ? room.user1_avatar : room.user2_avatar;
    const userName = isUser1 ? room.user1_name : room.user2_name;

    // Insert user message
    await db.insert('private_chat_messages', {
      room_id: chatId,
      sender_session: userId,
      sender_avatar: userAvatar,
      sender_name: userName,
      content: sanitizedMessage,
      is_ai: false,
      is_system: false,
      created_at: new Date()
    });

    // If AI chat, generate response
    if (room.is_ai_chat) {
      const aiResponse = await getAIResponse(chatId, sanitizedMessage);

      await db.insert('private_chat_messages', {
        room_id: chatId,
        sender_session: AI_PARTNER.id,
        sender_avatar: AI_PARTNER.avatar,
        sender_name: AI_PARTNER.name,
        content: aiResponse,
        is_ai: true,
        is_system: false,
        created_at: new Date()
      });
    }

    return res.status(200).json({
      success: true,
      message: {
        senderId: userId,
        senderAvatar: userAvatar,
        senderName: userName,
        content: sanitizedMessage,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}

// Get messages
async function handleGetMessages(res, userId, chatId) {
  if (!chatId) {
    return res.status(400).json({ error: 'Missing chatId' });
  }

  try {
    const room = await db.queryOne(
      'SELECT * FROM private_chat_rooms WHERE room_id = ?',
      [chatId]
    );

    if (!room) {
      return res.status(404).json({ error: 'Chat session not found', ended: true });
    }

    const isUser1 = room.user1_session === userId;
    const isParticipant = isUser1 || room.user2_session === userId;

    if (!isParticipant) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    const messages = await db.query(
      'SELECT * FROM private_chat_messages WHERE room_id = ? ORDER BY created_at ASC LIMIT 100',
      [chatId]
    );

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      type: msg.is_system ? 'system' : undefined,
      senderId: msg.sender_session,
      senderAvatar: msg.sender_avatar,
      senderName: msg.sender_name,
      content: msg.content,
      timestamp: new Date(msg.created_at).getTime()
    }));

    const partner = {
      id: isUser1 ? room.user2_session : room.user1_session,
      avatar: isUser1 ? room.user2_avatar : room.user1_avatar,
      name: isUser1 ? room.user2_name : room.user1_name,
      isAI: room.is_ai_chat && !isUser1
    };

    return res.status(200).json({
      success: true,
      messages: formattedMessages,
      sessionStatus: room.status,
      isAIPartner: room.is_ai_chat,
      partner: partner
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ error: 'Failed to load messages' });
  }
}

// End chat
async function handleEndChat(res, userId, chatId) {
  if (!chatId) {
    return res.status(400).json({ error: 'Missing chatId' });
  }

  try {
    const room = await db.queryOne(
      'SELECT * FROM private_chat_rooms WHERE room_id = ?',
      [chatId]
    );

    if (!room) {
      return res.status(200).json({ success: true, message: 'Session already ended' });
    }

    // Update room status
    await db.update('private_chat_rooms',
      { status: 'ended', ended_by: userId, ended_at: new Date() },
      'room_id = ?',
      [chatId]
    );

    // Add end message
    await db.insert('private_chat_messages', {
      room_id: chatId,
      sender_session: 'system',
      content: 'การสนทนาสิ้นสุดแล้ว ขอบคุณที่ใช้บริการค่ะ',
      is_system: true,
      created_at: new Date()
    });

    // Clean up conversation history
    delete conversationHistory[chatId];

    return res.status(200).json({
      success: true,
      message: 'Chat ended'
    });
  } catch (error) {
    console.error('End chat error:', error);
    return res.status(500).json({ error: 'Failed to end chat' });
  }
}

// Report user
async function handleReport(res, userId, chatId, reason) {
  try {
    await db.insert('chat_reports', {
      room_id: chatId,
      reporter_session: userId,
      reason: reason || 'inappropriate behavior',
      created_at: new Date()
    });

    console.log('Report:', { userId, chatId, reason, timestamp: new Date().toISOString() });

    return res.status(200).json({
      success: true,
      message: 'Report submitted. Thank you for helping keep our community safe.'
    });
  } catch (error) {
    console.error('Report error:', error);
    return res.status(200).json({
      success: true,
      message: 'Report submitted.'
    });
  }
}

// Heartbeat
async function handleHeartbeat(res, userId, chatId) {
  if (chatId) {
    try {
      const room = await db.queryOne(
        'SELECT status FROM private_chat_rooms WHERE room_id = ?',
        [chatId]
      );

      if (room) {
        return res.status(200).json({
          success: true,
          sessionStatus: room.status
        });
      }
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }

  const queueUser = matchingQueue.find(u => u.id === userId);
  if (queueUser) {
    queueUser.joinedAt = Date.now();
  }

  return res.status(200).json({ success: true });
}
