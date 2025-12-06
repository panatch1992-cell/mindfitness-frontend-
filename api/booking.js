/**
 * Psychologist Booking API
 * MindFitness - ระบบจองนัดพบจิตแพทย์/นักจิตวิทยา
 *
 * Features:
 * - Therapist listing with profiles
 * - Available time slots
 * - Booking creation and management
 * - Video call room generation
 * - Booking confirmation/cancellation
 */

// In-memory storage (use database in production)
const therapists = {
  'therapist_001': {
    id: 'therapist_001',
    name: 'ดร.สมหญิง รักษาใจ',
    nameEn: 'Dr. Somying Raksajai',
    title: 'นักจิตวิทยาคลินิก',
    titleEn: 'Clinical Psychologist',
    avatar: '../images/mind-mascot/avatar-1.svg',
    specializations: ['วิตกกังวล', 'ซึมเศร้า', 'ความเครียด'],
    specializationsEn: ['Anxiety', 'Depression', 'Stress'],
    experience: 8,
    rating: 4.9,
    reviewCount: 127,
    price: 1500,
    bio: 'ประสบการณ์ให้คำปรึกษามากกว่า 8 ปี เชี่ยวชาญด้านการบำบัดความวิตกกังวลและภาวะซึมเศร้า',
    bioEn: 'Over 8 years of counseling experience, specializing in anxiety and depression therapy',
    availability: {
      monday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      tuesday: ['09:00', '10:00', '14:00', '15:00'],
      wednesday: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      thursday: ['10:00', '11:00', '14:00', '15:00'],
      friday: ['09:00', '10:00', '11:00', '14:00'],
      saturday: ['10:00', '11:00'],
      sunday: []
    },
    isVerified: true,
    isActive: true
  },
  'therapist_002': {
    id: 'therapist_002',
    name: 'อ.ธนพล ใจดี',
    nameEn: 'Thanapol Jaidee',
    title: 'นักจิตวิทยาการปรึกษา',
    titleEn: 'Counseling Psychologist',
    avatar: '../images/mind-mascot/avatar-2.svg',
    specializations: ['ความสัมพันธ์', 'การทำงาน', 'การพัฒนาตนเอง'],
    specializationsEn: ['Relationships', 'Work Issues', 'Self-development'],
    experience: 5,
    rating: 4.7,
    reviewCount: 89,
    price: 1200,
    bio: 'ผู้เชี่ยวชาญด้านปัญหาความสัมพันธ์และการพัฒนาศักยภาพบุคคล',
    bioEn: 'Expert in relationship issues and personal development',
    availability: {
      monday: ['10:00', '11:00', '15:00', '16:00', '17:00'],
      tuesday: ['09:00', '10:00', '11:00', '15:00', '16:00'],
      wednesday: ['15:00', '16:00', '17:00'],
      thursday: ['09:00', '10:00', '11:00', '15:00', '16:00', '17:00'],
      friday: ['10:00', '11:00', '15:00', '16:00'],
      saturday: ['09:00', '10:00', '11:00'],
      sunday: []
    },
    isVerified: true,
    isActive: true
  },
  'therapist_003': {
    id: 'therapist_003',
    name: 'ดร.พิมพ์ชนก สุขใจ',
    nameEn: 'Dr. Pimchanok Sukjai',
    title: 'จิตแพทย์',
    titleEn: 'Psychiatrist',
    avatar: '../images/mind-mascot/avatar-3.svg',
    specializations: ['โรคซึมเศร้า', 'โรควิตกกังวล', 'นอนไม่หลับ'],
    specializationsEn: ['Depression Disorder', 'Anxiety Disorder', 'Insomnia'],
    experience: 12,
    rating: 4.95,
    reviewCount: 203,
    price: 2000,
    bio: 'จิตแพทย์ผู้เชี่ยวชาญด้านโรคทางจิตเวช มีประสบการณ์มากกว่า 12 ปี',
    bioEn: 'Psychiatrist specializing in mental health disorders with over 12 years of experience',
    availability: {
      monday: ['09:00', '10:00', '11:00'],
      tuesday: ['09:00', '10:00', '11:00', '14:00'],
      wednesday: ['14:00', '15:00', '16:00'],
      thursday: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      friday: ['09:00', '10:00'],
      saturday: [],
      sunday: []
    },
    isVerified: true,
    isActive: true
  }
};

// Bookings storage
const bookings = {};
const userBookings = {};

// Video call rooms
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
function isSlotAvailable(therapistId, date, time) {
  const therapist = therapists[therapistId];
  if (!therapist || !therapist.isActive) return false;

  const dayName = getDayName(date);
  const availableSlots = therapist.availability[dayName] || [];

  if (!availableSlots.includes(time)) return false;

  // Check if already booked
  const bookingKey = `${therapistId}_${date}_${time}`;
  return !bookings[bookingKey];
}

// Helper: Get available slots for a date
function getAvailableSlots(therapistId, date) {
  const therapist = therapists[therapistId];
  if (!therapist || !therapist.isActive) return [];

  const dayName = getDayName(date);
  const allSlots = therapist.availability[dayName] || [];

  // Filter out already booked slots
  return allSlots.filter(time => {
    const bookingKey = `${therapistId}_${date}_${time}`;
    return !bookings[bookingKey];
  });
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
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
    participants: [],
    status: 'waiting'
  };

  return {
    roomId,
    roomToken,
    // In production, integrate with Twilio/Daily.co/Jitsi
    joinUrl: `/video-call.html?room=${roomId}&token=${roomToken}`
  };
}

// Handler: List therapists
function handleListTherapists(res, filters = {}) {
  let therapistList = Object.values(therapists).filter(t => t.isActive && t.isVerified);

  // Filter by specialization
  if (filters.specialization) {
    therapistList = therapistList.filter(t =>
      t.specializations.includes(filters.specialization) ||
      t.specializationsEn.includes(filters.specialization)
    );
  }

  // Filter by max price
  if (filters.maxPrice) {
    therapistList = therapistList.filter(t => t.price <= parseInt(filters.maxPrice));
  }

  // Sort by rating
  therapistList.sort((a, b) => b.rating - a.rating);

  return res.status(200).json({
    success: true,
    therapists: therapistList.map(t => ({
      id: t.id,
      name: t.name,
      nameEn: t.nameEn,
      title: t.title,
      titleEn: t.titleEn,
      avatar: t.avatar,
      specializations: t.specializations,
      specializationsEn: t.specializationsEn,
      experience: t.experience,
      rating: t.rating,
      reviewCount: t.reviewCount,
      price: t.price,
      bio: t.bio,
      bioEn: t.bioEn
    }))
  });
}

// Handler: Get therapist details
function handleGetTherapist(res, therapistId) {
  const therapist = therapists[therapistId];

  if (!therapist) {
    return res.status(404).json({
      success: false,
      error: 'ไม่พบข้อมูลนักจิตวิทยา'
    });
  }

  return res.status(200).json({
    success: true,
    therapist: {
      ...therapist,
      // Remove sensitive data
      availability: undefined
    }
  });
}

// Handler: Get available slots
function handleGetSlots(res, therapistId, date) {
  if (!therapistId || !date) {
    return res.status(400).json({
      success: false,
      error: 'กรุณาระบุ therapistId และ date'
    });
  }

  const therapist = therapists[therapistId];
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

  const availableSlots = getAvailableSlots(therapistId, date);

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
}

// Handler: Create booking
function handleCreateBooking(res, userId, therapistId, date, time, notes = '') {
  if (!userId || !therapistId || !date || !time) {
    return res.status(400).json({
      success: false,
      error: 'กรุณากรอกข้อมูลให้ครบถ้วน'
    });
  }

  const therapist = therapists[therapistId];
  if (!therapist) {
    return res.status(404).json({
      success: false,
      error: 'ไม่พบข้อมูลนักจิตวิทยา'
    });
  }

  // Check availability
  if (!isSlotAvailable(therapistId, date, time)) {
    return res.status(400).json({
      success: false,
      error: 'ช่วงเวลานี้ไม่ว่างแล้ว กรุณาเลือกช่วงเวลาอื่น'
    });
  }

  // Create booking
  const bookingId = generateId('booking');
  const bookingKey = `${therapistId}_${date}_${time}`;

  const booking = {
    id: bookingId,
    userId: userId,
    therapistId: therapistId,
    therapistName: therapist.name,
    therapistAvatar: therapist.avatar,
    date: date,
    time: time,
    endTime: `${parseInt(time.split(':')[0]) + 1}:00`,
    notes: notes.substring(0, 500), // Limit notes length
    price: therapist.price,
    status: 'confirmed',
    videoRoom: null,
    createdAt: new Date().toISOString(),
    reminderSent: false
  };

  // Store booking
  bookings[bookingKey] = booking;

  // Add to user's bookings
  if (!userBookings[userId]) {
    userBookings[userId] = [];
  }
  userBookings[userId].push(bookingId);

  return res.status(200).json({
    success: true,
    message: 'จองนัดสำเร็จ!',
    booking: {
      id: booking.id,
      therapistName: booking.therapistName,
      therapistAvatar: booking.therapistAvatar,
      date: booking.date,
      time: booking.time,
      endTime: booking.endTime,
      price: booking.price,
      status: booking.status
    }
  });
}

// Handler: Get user's bookings
function handleGetUserBookings(res, userId) {
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'กรุณาระบุ userId'
    });
  }

  const userBookingIds = userBookings[userId] || [];
  const userBookingList = [];

  // Find all user's bookings
  Object.values(bookings).forEach(booking => {
    if (booking.userId === userId) {
      userBookingList.push({
        id: booking.id,
        therapistId: booking.therapistId,
        therapistName: booking.therapistName,
        therapistAvatar: booking.therapistAvatar,
        date: booking.date,
        time: booking.time,
        endTime: booking.endTime,
        price: booking.price,
        status: booking.status,
        hasVideoRoom: !!booking.videoRoom
      });
    }
  });

  // Sort by date (newest first)
  userBookingList.sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateB - dateA;
  });

  return res.status(200).json({
    success: true,
    bookings: userBookingList
  });
}

// Handler: Cancel booking
function handleCancelBooking(res, userId, bookingId) {
  // Find booking
  let targetBooking = null;
  let bookingKey = null;

  Object.entries(bookings).forEach(([key, booking]) => {
    if (booking.id === bookingId && booking.userId === userId) {
      targetBooking = booking;
      bookingKey = key;
    }
  });

  if (!targetBooking) {
    return res.status(404).json({
      success: false,
      error: 'ไม่พบการจองนี้'
    });
  }

  // Check if can cancel (at least 24 hours before)
  const bookingDateTime = new Date(`${targetBooking.date} ${targetBooking.time}`);
  const now = new Date();
  const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

  if (hoursUntilBooking < 24) {
    return res.status(400).json({
      success: false,
      error: 'ไม่สามารถยกเลิกได้ เนื่องจากเหลือเวลาน้อยกว่า 24 ชั่วโมง'
    });
  }

  // Cancel booking
  targetBooking.status = 'cancelled';
  delete bookings[bookingKey];

  return res.status(200).json({
    success: true,
    message: 'ยกเลิกการจองสำเร็จ'
  });
}

// Handler: Start video call
function handleStartVideoCall(res, userId, bookingId) {
  // Find booking
  let targetBooking = null;
  let bookingKey = null;

  Object.entries(bookings).forEach(([key, booking]) => {
    if (booking.id === bookingId) {
      targetBooking = booking;
      bookingKey = key;
    }
  });

  if (!targetBooking) {
    return res.status(404).json({
      success: false,
      error: 'ไม่พบการจองนี้'
    });
  }

  // Check if user is authorized (either user or therapist)
  const isAuthorized = targetBooking.userId === userId || targetBooking.therapistId === userId;
  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      error: 'คุณไม่มีสิทธิ์เข้าถึงการนัดหมายนี้'
    });
  }

  // Check booking status
  if (targetBooking.status !== 'confirmed') {
    return res.status(400).json({
      success: false,
      error: 'การจองนี้ถูกยกเลิกแล้ว'
    });
  }

  // Check if within valid time window (30 min before to 1 hour after)
  const bookingDateTime = new Date(`${targetBooking.date} ${targetBooking.time}`);
  const now = new Date();
  const minutesUntilBooking = (bookingDateTime - now) / (1000 * 60);

  if (minutesUntilBooking > 30) {
    return res.status(400).json({
      success: false,
      error: `ยังไม่ถึงเวลานัดหมาย กรุณารอจนถึง ${targetBooking.time}`,
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
  if (!targetBooking.videoRoom) {
    targetBooking.videoRoom = generateVideoRoom(bookingId);
  }

  return res.status(200).json({
    success: true,
    videoRoom: targetBooking.videoRoom,
    booking: {
      id: targetBooking.id,
      therapistName: targetBooking.therapistName,
      date: targetBooking.date,
      time: targetBooking.time
    }
  });
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

  // Check if room expired
  if (new Date() > new Date(room.expiresAt)) {
    return res.status(400).json({
      success: false,
      error: 'ห้องวิดีโอหมดอายุแล้ว'
    });
  }

  // Add participant
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
      // WebRTC signaling info would go here in production
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
