/**
 * Psychologist Booking API - MySQL Database Integration
 * MindFitness - ระบบจองนัดพบจิตแพทย์/นักจิตวิทยา
 *
 * Features:
 * - Therapist listing with profiles
 * - Available time slots
 * - Booking creation and management
 * - Video call room generation
 * - Booking confirmation/cancellation
 */

const db = require('../utils/db');

// Video call rooms (in-memory for real-time sessions)
const videoRooms = {};

// Helper: Generate unique ID
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Get day name from date
function getDayName(date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date(date).getDay()];
}

// Helper: Check if slot is available
async function isSlotAvailable(therapistId, date, time) {
  try {
    const therapist = await db.queryOne(
      'SELECT * FROM psychologists WHERE id = ? AND status = "active"',
      [therapistId]
    );
    if (!therapist) return false;

    const dayName = getDayName(date);
    const availability = JSON.parse(therapist.availability || '{}');
    const availableSlots = availability[dayName] || [];

    if (!availableSlots.includes(time)) return false;

    // Check if already booked
    const existing = await db.queryOne(
      `SELECT id FROM psy_appointments
       WHERE psychologist_id = ? AND scheduled_date = ? AND scheduled_time = ?
       AND status NOT IN ('cancelled', 'no_show')`,
      [therapistId, date, time]
    );

    return !existing;
  } catch (error) {
    console.error('Check availability error:', error);
    return false;
  }
}

// Helper: Get available slots for a date
async function getAvailableSlots(therapistId, date) {
  try {
    const therapist = await db.queryOne(
      'SELECT * FROM psychologists WHERE id = ? AND status = "active"',
      [therapistId]
    );
    if (!therapist) return [];

    const dayName = getDayName(date);
    const availability = JSON.parse(therapist.availability || '{}');
    const allSlots = availability[dayName] || [];

    // Get booked slots
    const bookedSlots = await db.query(
      `SELECT scheduled_time FROM psy_appointments
       WHERE psychologist_id = ? AND scheduled_date = ?
       AND status NOT IN ('cancelled', 'no_show')`,
      [therapistId, date]
    );

    const bookedTimes = bookedSlots.map(b => b.scheduled_time);

    return allSlots.filter(time => !bookedTimes.includes(time));
  } catch (error) {
    console.error('Get slots error:', error);
    return [];
  }
}

// Helper: Generate video room
function generateVideoRoom(bookingId) {
  const roomId = generateId('room');
  const roomToken = Math.random().toString(36).substr(2, 16);

  videoRooms[roomId] = {
    id: roomId,
    bookingId: bookingId,
    token: roomToken,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    participants: [],
    status: 'waiting'
  };

  return {
    roomId,
    roomToken,
    joinUrl: `/video-call.html?room=${roomId}&token=${roomToken}`
  };
}

// Handler: List therapists
async function handleListTherapists(res, filters = {}) {
  try {
    let sql = 'SELECT * FROM psychologists WHERE status = "active"';
    const params = [];

    if (filters.specialization) {
      sql += ' AND (specialties LIKE ? OR specialties_en LIKE ?)';
      params.push(`%${filters.specialization}%`, `%${filters.specialization}%`);
    }

    if (filters.maxPrice) {
      sql += ' AND rate_per_session <= ?';
      params.push(parseInt(filters.maxPrice));
    }

    sql += ' ORDER BY rating DESC';

    const therapists = await db.query(sql, params);

    const formattedTherapists = therapists.map(t => ({
      id: t.id,
      name: t.fullname_th,
      nameEn: t.fullname_en,
      title: t.title_th,
      titleEn: t.title_en,
      avatar: t.avatar_url || `../images/mind-mascot/avatar-${(t.id % 6) + 1}.svg`,
      specializations: JSON.parse(t.specialties || '[]'),
      specializationsEn: JSON.parse(t.specialties_en || '[]'),
      experience: t.experience_years,
      rating: parseFloat(t.rating) || 4.5,
      reviewCount: t.review_count || 0,
      price: t.rate_per_session,
      bio: t.bio_th,
      bioEn: t.bio_en
    }));

    return res.status(200).json({
      success: true,
      therapists: formattedTherapists
    });
  } catch (error) {
    console.error('List therapists error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load therapists' });
  }
}

// Handler: Get therapist details
async function handleGetTherapist(res, therapistId) {
  try {
    const therapist = await db.queryOne(
      'SELECT * FROM psychologists WHERE id = ?',
      [therapistId]
    );

    if (!therapist) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบข้อมูลนักจิตวิทยา'
      });
    }

    return res.status(200).json({
      success: true,
      therapist: {
        id: therapist.id,
        name: therapist.fullname_th,
        nameEn: therapist.fullname_en,
        title: therapist.title_th,
        titleEn: therapist.title_en,
        avatar: therapist.avatar_url || `../images/mind-mascot/avatar-${(therapist.id % 6) + 1}.svg`,
        specializations: JSON.parse(therapist.specialties || '[]'),
        specializationsEn: JSON.parse(therapist.specialties_en || '[]'),
        experience: therapist.experience_years,
        rating: parseFloat(therapist.rating) || 4.5,
        reviewCount: therapist.review_count || 0,
        price: therapist.rate_per_session,
        bio: therapist.bio_th,
        bioEn: therapist.bio_en
      }
    });
  } catch (error) {
    console.error('Get therapist error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load therapist' });
  }
}

// Handler: Get available slots
async function handleGetSlots(res, therapistId, date) {
  if (!therapistId || !date) {
    return res.status(400).json({
      success: false,
      error: 'กรุณาระบุ therapistId และ date'
    });
  }

  try {
    const therapist = await db.queryOne(
      'SELECT * FROM psychologists WHERE id = ?',
      [therapistId]
    );

    if (!therapist) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบข้อมูลนักจิตวิทยา'
      });
    }

    // Check if date is in the future
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res.status(400).json({
        success: false,
        error: 'ไม่สามารถจองวันที่ผ่านมาแล้ว'
      });
    }

    const availableSlots = await getAvailableSlots(therapistId, date);

    return res.status(200).json({
      success: true,
      date: date,
      therapistId: therapistId,
      slots: availableSlots.map(time => ({
        time: time,
        display: `${time} - ${parseInt(time.split(':')[0]) + 1}:00`,
        available: true
      }))
    });
  } catch (error) {
    console.error('Get slots error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load slots' });
  }
}

// Handler: Create booking
async function handleCreateBooking(res, userId, therapistId, date, time, notes = '') {
  if (!userId || !therapistId || !date || !time) {
    return res.status(400).json({
      success: false,
      error: 'กรุณากรอกข้อมูลให้ครบถ้วน'
    });
  }

  try {
    const therapist = await db.queryOne(
      'SELECT * FROM psychologists WHERE id = ?',
      [therapistId]
    );

    if (!therapist) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบข้อมูลนักจิตวิทยา'
      });
    }

    // Check availability
    const available = await isSlotAvailable(therapistId, date, time);
    if (!available) {
      return res.status(400).json({
        success: false,
        error: 'ช่วงเวลานี้ไม่ว่างแล้ว กรุณาเลือกช่วงเวลาอื่น'
      });
    }

    // Generate booking reference
    const bookingRef = 'MF' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();

    // Create booking
    const bookingId = await db.insert('psy_appointments', {
      booking_ref: bookingRef,
      psychologist_id: therapistId,
      client_id: userId,
      scheduled_date: date,
      scheduled_time: time,
      end_time: `${parseInt(time.split(':')[0]) + 1}:00`,
      notes: (notes || '').substring(0, 500),
      amount: therapist.rate_per_session,
      status: 'confirmed',
      created_at: new Date()
    });

    return res.status(200).json({
      success: true,
      message: 'จองนัดสำเร็จ!',
      booking: {
        id: bookingId,
        bookingRef: bookingRef,
        therapistName: therapist.fullname_th,
        therapistAvatar: therapist.avatar_url || `../images/mind-mascot/avatar-${(therapist.id % 6) + 1}.svg`,
        date: date,
        time: time,
        endTime: `${parseInt(time.split(':')[0]) + 1}:00`,
        price: therapist.rate_per_session,
        status: 'confirmed'
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    });
  }
}

// Handler: Get user's bookings
async function handleGetUserBookings(res, userId) {
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'กรุณาระบุ userId'
    });
  }

  try {
    const bookings = await db.query(
      `SELECT a.*, p.fullname_th as therapist_name, p.avatar_url as therapist_avatar
       FROM psy_appointments a
       LEFT JOIN psychologists p ON a.psychologist_id = p.id
       WHERE a.client_id = ?
       ORDER BY a.scheduled_date DESC, a.scheduled_time DESC`,
      [userId]
    );

    const formattedBookings = bookings.map(b => ({
      id: b.id,
      bookingRef: b.booking_ref,
      therapistId: b.psychologist_id,
      therapistName: b.therapist_name,
      therapistAvatar: b.therapist_avatar || `../images/mind-mascot/avatar-${(b.psychologist_id % 6) + 1}.svg`,
      date: b.scheduled_date,
      time: b.scheduled_time,
      endTime: b.end_time,
      price: b.amount,
      status: b.status,
      hasVideoRoom: !!b.video_room_id
    }));

    return res.status(200).json({
      success: true,
      bookings: formattedBookings
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load bookings' });
  }
}

// Handler: Cancel booking
async function handleCancelBooking(res, userId, bookingId) {
  try {
    const booking = await db.queryOne(
      'SELECT * FROM psy_appointments WHERE id = ? AND client_id = ?',
      [bookingId, userId]
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบการจองนี้'
      });
    }

    // Check if can cancel (at least 24 hours before)
    const bookingDateTime = new Date(`${booking.scheduled_date} ${booking.scheduled_time}`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

    if (hoursUntilBooking < 24) {
      return res.status(400).json({
        success: false,
        error: 'ไม่สามารถยกเลิกได้ เนื่องจากเหลือเวลาน้อยกว่า 24 ชั่วโมง'
      });
    }

    // Cancel booking
    await db.update('psy_appointments',
      { status: 'cancelled', cancelled_at: new Date() },
      'id = ?',
      [bookingId]
    );

    return res.status(200).json({
      success: true,
      message: 'ยกเลิกการจองสำเร็จ'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ success: false, error: 'Failed to cancel booking' });
  }
}

// Handler: Start video call
async function handleStartVideoCall(res, userId, bookingId) {
  try {
    const booking = await db.queryOne(
      `SELECT a.*, p.fullname_th as therapist_name
       FROM psy_appointments a
       LEFT JOIN psychologists p ON a.psychologist_id = p.id
       WHERE a.id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'ไม่พบการจองนี้'
      });
    }

    // Check if user is authorized
    const isAuthorized = booking.client_id === userId || booking.psychologist_id == userId;
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: 'คุณไม่มีสิทธิ์เข้าถึงการนัดหมายนี้'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: 'การจองนี้ถูกยกเลิกแล้ว'
      });
    }

    // Check if within valid time window
    const bookingDateTime = new Date(`${booking.scheduled_date} ${booking.scheduled_time}`);
    const now = new Date();
    const minutesUntilBooking = (bookingDateTime - now) / (1000 * 60);

    if (minutesUntilBooking > 30) {
      return res.status(400).json({
        success: false,
        error: `ยังไม่ถึงเวลานัดหมาย กรุณารอจนถึง ${booking.scheduled_time}`,
        minutesRemaining: Math.round(minutesUntilBooking - 30)
      });
    }

    if (minutesUntilBooking < -60) {
      return res.status(400).json({
        success: false,
        error: 'หมดเวลานัดหมายแล้ว'
      });
    }

    // Generate or get existing video room
    let videoRoom = videoRooms[booking.video_room_id];
    if (!videoRoom) {
      videoRoom = generateVideoRoom(bookingId);

      // Update booking with video room ID
      await db.update('psy_appointments',
        { video_room_id: videoRoom.roomId },
        'id = ?',
        [bookingId]
      );
    }

    return res.status(200).json({
      success: true,
      videoRoom: videoRoom,
      booking: {
        id: booking.id,
        therapistName: booking.therapist_name,
        date: booking.scheduled_date,
        time: booking.scheduled_time
      }
    });
  } catch (error) {
    console.error('Start video call error:', error);
    return res.status(500).json({ success: false, error: 'Failed to start video call' });
  }
}

// Handler: Join video room
function handleJoinVideoRoom(res, roomId, token, participantId, participantName) {
  const room = videoRooms[roomId];

  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'ไม่พบห้องวิดีโอ'
    });
  }

  if (room.token !== token) {
    return res.status(403).json({
      success: false,
      error: 'รหัสเข้าห้องไม่ถูกต้อง'
    });
  }

  if (new Date() > new Date(room.expiresAt)) {
    return res.status(400).json({
      success: false,
      error: 'ห้องวิดีโอหมดอายุแล้ว'
    });
  }

  if (!room.participants.find(p => p.id === participantId)) {
    room.participants.push({
      id: participantId,
      name: participantName,
      joinedAt: new Date().toISOString()
    });
  }

  room.status = room.participants.length >= 2 ? 'active' : 'waiting';

  return res.status(200).json({
    success: true,
    room: {
      id: room.id,
      status: room.status,
      participants: room.participants,
      signalingServer: '/api/signaling',
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    }
  });
}

// Main handler
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, ...params } = req.method === 'POST' ? req.body : req.query;

    switch (action) {
      case 'list_therapists':
        return handleListTherapists(res, {
          specialization: params.specialization,
          maxPrice: params.maxPrice
        });

      case 'get_therapist':
        return handleGetTherapist(res, params.therapistId);

      case 'get_slots':
        return handleGetSlots(res, params.therapistId, params.date);

      case 'create_booking':
        return handleCreateBooking(
          res,
          params.userId,
          params.therapistId,
          params.date,
          params.time,
          params.notes
        );

      case 'get_user_bookings':
        return handleGetUserBookings(res, params.userId);

      case 'cancel_booking':
        return handleCancelBooking(res, params.userId, params.bookingId);

      case 'start_video_call':
        return handleStartVideoCall(res, params.userId, params.bookingId);

      case 'join_video_room':
        return handleJoinVideoRoom(
          res,
          params.roomId,
          params.token,
          params.participantId,
          params.participantName
        );

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
          availableActions: [
            'list_therapists',
            'get_therapist',
            'get_slots',
            'create_booking',
            'get_user_bookings',
            'cancel_booking',
            'start_video_call',
            'join_video_room'
          ]
        });
    }
  } catch (error) {
    console.error('Booking API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    });
  }
};
