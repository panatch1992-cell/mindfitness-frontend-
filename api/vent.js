/**
 * Vent Wall API - MySQL Database Integration
 * Endpoints:
 * - create: Create new vent post
 * - list: Get all posts
 * - like: Like a post
 * - reply: Reply to a post
 * - get_replies: Get replies for a post
 */

const db = require('../utils/db');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

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
    const { action, content, mood, postId, replyContent, sessionId } = req.body;

    switch (action) {
      case 'create':
        return handleCreate(res, content, mood, sessionId);
      case 'list':
        return handleList(res);
      case 'like':
        return handleLike(res, postId, sessionId);
      case 'reply':
        return handleReply(res, postId, replyContent, sessionId);
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
async function handleCreate(res, content, mood, sessionId) {
  const sanitizedContent = sanitize(content);
  if (!sanitizedContent) {
    return res.status(400).json({ error: 'Content is required' });
  }

  // Get AI response
  const aiResponse = await getAIResponse(sanitizedContent, mood);

  const avatarNum = Math.floor(Math.random() * 6) + 1;
  const names = ['Anonymous', 'ใครบางคน', 'คนแปลกหน้า', 'เพื่อนร่วมทาง'];
  const displayName = names[Math.floor(Math.random() * names.length)];

  try {
    // Insert into database
    const postId = await db.insert('vent_posts', {
      content: sanitizedContent,
      emotion: mood || 'neutral',
      ai_response: aiResponse,
      likes_count: 0,
      avatar_url: `../images/mind-mascot/avatar-${avatarNum}.svg`,
      display_name: displayName,
      session_id: sessionId || null,
      created_at: new Date()
    });

    const post = await db.queryOne('SELECT * FROM vent_posts WHERE id = ?', [postId]);

    return res.status(200).json({
      success: true,
      post: {
        id: post.id,
        content: post.content,
        mood: post.emotion,
        avatar: post.avatar_url,
        name: post.display_name,
        likes: post.likes_count,
        replyCount: 0,
        aiResponse: post.ai_response,
        createdAt: post.created_at
      }
    });
  } catch (error) {
    console.error('Create post error:', error);
    return res.status(500).json({ error: 'Failed to create post' });
  }
}

// List posts
async function handleList(res) {
  try {
    const posts = await db.query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM vent_replies WHERE post_id = p.id) as reply_count
       FROM vent_posts p
       ORDER BY p.created_at DESC
       LIMIT 50`
    );

    const formattedPosts = posts.map(post => ({
      id: post.id,
      content: post.content,
      mood: post.emotion,
      avatar: post.avatar_url,
      name: post.display_name,
      likes: post.likes_count,
      replyCount: post.reply_count || 0,
      aiResponse: post.ai_response,
      createdAt: post.created_at
    }));

    return res.status(200).json({
      success: true,
      posts: formattedPosts
    });
  } catch (error) {
    console.error('List posts error:', error);
    return res.status(500).json({ error: 'Failed to load posts' });
  }
}

// Like post
async function handleLike(res, postId, sessionId) {
  if (!postId) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  try {
    // Check if post exists
    const post = await db.queryOne('SELECT * FROM vent_posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already liked (prevent duplicate likes from same session)
    if (sessionId) {
      const existingLike = await db.queryOne(
        'SELECT id FROM vent_likes WHERE post_id = ? AND session_id = ?',
        [postId, sessionId]
      );
      if (existingLike) {
        return res.status(400).json({ error: 'Already liked', likes: post.likes_count });
      }
    }

    // Add like record
    await db.insert('vent_likes', {
      post_id: postId,
      session_id: sessionId || null,
      created_at: new Date()
    });

    // Update likes count
    await db.update('vent_posts', { likes_count: post.likes_count + 1 }, 'id = ?', [postId]);

    return res.status(200).json({ success: true, likes: post.likes_count + 1 });
  } catch (error) {
    console.error('Like post error:', error);
    return res.status(500).json({ error: 'Failed to like post' });
  }
}

// Reply to post
async function handleReply(res, postId, replyContent, sessionId) {
  if (!postId) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  const sanitizedContent = sanitize(replyContent);
  if (!sanitizedContent) {
    return res.status(400).json({ error: 'Reply content is required' });
  }

  try {
    // Check if post exists
    const post = await db.queryOne('SELECT id FROM vent_posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get AI encouragement for the reply
    const aiEncouragement = await getAIResponse(sanitizedContent, null, true);

    const avatarNum = Math.floor(Math.random() * 6) + 1;
    const names = ['เพื่อน', 'ผู้ฟัง', 'คนที่เข้าใจ', 'กำลังใจ'];
    const displayName = names[Math.floor(Math.random() * names.length)];

    // Insert reply
    const replyId = await db.insert('vent_replies', {
      post_id: postId,
      content: sanitizedContent,
      avatar_url: `../images/mind-mascot/avatar-${avatarNum}.svg`,
      display_name: displayName,
      ai_encouragement: aiEncouragement,
      session_id: sessionId || null,
      created_at: new Date()
    });

    const reply = await db.queryOne('SELECT * FROM vent_replies WHERE id = ?', [replyId]);

    return res.status(200).json({
      success: true,
      reply: {
        id: reply.id,
        postId: reply.post_id,
        content: reply.content,
        avatar: reply.avatar_url,
        name: reply.display_name,
        aiEncouragement: reply.ai_encouragement,
        createdAt: reply.created_at
      }
    });
  } catch (error) {
    console.error('Reply to post error:', error);
    return res.status(500).json({ error: 'Failed to add reply' });
  }
}

// Get replies for a post
async function handleGetReplies(res, postId) {
  if (!postId) {
    return res.status(400).json({ error: 'Post ID is required' });
  }

  try {
    const replies = await db.query(
      'SELECT * FROM vent_replies WHERE post_id = ? ORDER BY created_at ASC LIMIT 50',
      [postId]
    );

    const formattedReplies = replies.map(reply => ({
      id: reply.id,
      postId: reply.post_id,
      content: reply.content,
      avatar: reply.avatar_url,
      name: reply.display_name,
      aiEncouragement: reply.ai_encouragement,
      createdAt: reply.created_at
    }));

    return res.status(200).json({
      success: true,
      replies: formattedReplies
    });
  } catch (error) {
    console.error('Get replies error:', error);
    return res.status(500).json({ error: 'Failed to load replies' });
  }
}
