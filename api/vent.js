/**
 * Vent Wall API - Enhanced with Reply System
 * Endpoints:
 * - create: Create new vent post
 * - list: Get all posts
 * - like: Like a post
 * - reply: Reply to a post (NEW)
 * - get_replies: Get replies for a post (NEW)
 */

// In-memory storage (use database in production)
let posts = [];
let replies = {};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

// Generate ID
function generateId() {
  return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Sanitize input
function sanitize(text) {
  if (typeof text !== 'string') return '';
  return text.trim().slice(0, 2000);
}

// Call Claude API for AI response
async function getAIResponse(content, mood, isReply = false) {
  if (!ANTHROPIC_API_KEY) {
    return null;
  }

  const systemPrompt = isReply
    ? `คุณคือ "น้องมายด์" ผู้ช่วย AI ที่ให้กำลังใจและสนับสนุนผู้ใช้ที่ระบายความรู้สึก
       คุณกำลังตอบกลับความคิดเห็นของผู้ใช้คนอื่น
       - ให้กำลังใจอย่างอ่อนโยน
       - ไม่ตัดสิน ไม่วิเคราะห์
       - ตอบสั้นๆ 1-2 ประโยค
       - ใช้ภาษาไทยที่เป็นกันเอง`
    : `คุณคือ "น้องมายด์" ผู้ช่วย AI ที่ให้กำลังใจและสนับสนุนผู้ใช้ที่ระบายความรู้สึก
       อารมณ์ของผู้ใช้: ${mood || 'ไม่ระบุ'}
       - รับฟังอย่างเข้าใจ ไม่ตัดสิน
       - ให้กำลังใจอย่างอ่อนโยน
       - ไม่ให้คำแนะนำเว้นแต่ถูกถาม
       - ถ้าเป็นเรื่องวิกฤต แนะนำสายด่วน 1323
       - ตอบสั้นๆ 2-3 ประโยค
       - ใช้ภาษาไทยที่เป็นกันเอง`;

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
        max_tokens: 200,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: content }]
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.content?.[0]?.text || null;
  } catch (e) {
    console.error('AI Response Error:', e);
    return null;
  }
}

// Main handler
export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).end();
  }

  Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, content, mood, postId, replyContent } = req.body;

    switch (action) {
      case 'create':
        return handleCreate(res, content, mood);
      case 'list':
        return handleList(res);
      case 'like':
        return handleLike(res, postId);
      case 'reply':
        return handleReply(res, postId, replyContent);
      case 'get_replies':
        return handleGetReplies(res, postId);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Vent API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Create new post
async function handleCreate(res, content, mood) {
  const sanitizedContent = sanitize(content);
  if (!sanitizedContent) {
    return res.status(400).json({ error: 'Content is required' });
  }

  // Get AI response
  const aiResponse = await getAIResponse(sanitizedContent, mood);

  const post = {
    id: generateId(),
    content: sanitizedContent,
    mood: mood || 'neutral',
    avatar: `../images/mind-mascot/avatar-${Math.floor(Math.random() * 6) + 1}.svg`,
    name: ['Anonymous', 'ใครบางคน', 'คนแปลกหน้า', 'เพื่อนร่วมทาง'][Math.floor(Math.random() * 4)],
    likes: 0,
    replyCount: 0,
    aiResponse: aiResponse,
    createdAt: new Date().toISOString()
  };

  posts.unshift(post);

  // Keep only last 100 posts
  if (posts.length > 100) {
    posts = posts.slice(0, 100);
  }

  return res.status(200).json({ success: true, post });
}

// List posts
function handleList(res) {
  return res.status(200).json({
    success: true,
    posts: posts.slice(0, 50)
  });
}

// Like post
function handleLike(res, postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  post.likes = (post.likes || 0) + 1;

  return res.status(200).json({ success: true, likes: post.likes });
}

// Reply to post
async function handleReply(res, postId, replyContent) {
  const post = posts.find(p => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const sanitizedContent = sanitize(replyContent);
  if (!sanitizedContent) {
    return res.status(400).json({ error: 'Reply content is required' });
  }

  // Initialize replies array for this post
  if (!replies[postId]) {
    replies[postId] = [];
  }

  // Get AI encouragement for the reply
  const aiEncouragement = await getAIResponse(sanitizedContent, null, true);

  const reply = {
    id: 'reply_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    postId: postId,
    content: sanitizedContent,
    avatar: `../images/mind-mascot/avatar-${Math.floor(Math.random() * 6) + 1}.svg`,
    name: ['เพื่อน', 'ผู้ฟัง', 'คนที่เข้าใจ', 'กำลังใจ'][Math.floor(Math.random() * 4)],
    aiEncouragement: aiEncouragement,
    createdAt: new Date().toISOString()
  };

  replies[postId].push(reply);
  post.replyCount = replies[postId].length;

  // Keep only last 50 replies per post
  if (replies[postId].length > 50) {
    replies[postId] = replies[postId].slice(-50);
  }

  return res.status(200).json({ success: true, reply });
}

// Get replies for a post
function handleGetReplies(res, postId) {
  const postReplies = replies[postId] || [];

  return res.status(200).json({
    success: true,
    replies: postReplies
  });
}
