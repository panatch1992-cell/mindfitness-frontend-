/**
 * Therapist Admin API
 * MindFitness - ระบบจัดการนักจิตวิทยา/จิตแพทย์
 *
 * Features:
 * - Therapist registration and application
 * - Admin approval workflow
 * - Profile management
 * - Schedule management
 * - Booking management for therapists
 * - Analytics dashboard
 */

// In-memory storage (use database in production)
const therapistApplications = {};
const therapistProfiles = {};
const adminUsers = {
  'admin_001': {
    id: 'admin_001',
    email: 'admin@mindfitness.app',
    role: 'super_admin',
    name: 'Admin MindFitness'
  }
};

// Session storage for therapist login
const therapistSessions = {};

// Helper: Generate unique ID
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper: Simple hash for demo (use bcrypt in production)
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Helper: Validate therapist session
function validateTherapistSession(sessionToken) {
  const session = therapistSessions[sessionToken];
  if (!session) return null;
  if (new Date() > new Date(session.expiresAt)) {
    delete therapistSessions[sessionToken];
    return null;
  }
  return session;
}

// Handler: Submit therapist application
function handleSubmitApplication(res, applicationData) {
  const {
    fullName,
    email,
    phone,
    licenseNumber,
    licenseType,
    specializations,
    experience,
    education,
    bio,
    documents
  } = applicationData;

  // Validate required fields
  if (!fullName || !email || !licenseNumber || !licenseType) {
    return res.status(400).json({
      success: false,
      error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน'
    });
  }

  // Check for duplicate email
  const existingApp = Object.values(therapistApplications).find(a => a.email === email);
  if (existingApp) {
    return res.status(400).json({
      success: false,
      error: 'อีเมลนี้ถูกใช้ในการสมัครแล้ว'
    });
  }

  const applicationId = generateId('app');
  const application = {
    id: applicationId,
    fullName,
    email,
    phone: phone || '',
    licenseNumber,
    licenseType, // 'psychologist', 'psychiatrist', 'counselor'
    specializations: specializations || [],
    experience: experience || 0,
    education: education || '',
    bio: bio || '',
    documents: documents || [],
    status: 'pending', // pending, under_review, approved, rejected
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
    reviewNotes: '',
    rejectionReason: ''
  };

  therapistApplications[applicationId] = application;

  return res.status(200).json({
    success: true,
    message: 'ส่งใบสมัครสำเร็จ! เราจะตรวจสอบและติดต่อกลับภายใน 3-5 วันทำการ',
    applicationId: applicationId,
    status: 'pending'
  });
}

// Handler: Get application status
function handleGetApplicationStatus(res, email) {
  const application = Object.values(therapistApplications).find(a => a.email === email);

  if (!application) {
    return res.status(404).json({
      success: false,
      error: 'ไม่พบใบสมัครที่ตรงกับอีเมลนี้'
    });
  }

  return res.status(200).json({
    success: true,
    application: {
      id: application.id,
      fullName: application.fullName,
      status: application.status,
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      rejectionReason: application.status === 'rejected' ? application.rejectionReason : undefined
    }
  });
}

// Handler: Admin - List applications
function handleAdminListApplications(res, adminId, filters = {}) {
  // Verify admin
  if (!adminUsers[adminId]) {
    return res.status(403).json({
      success: false,
      error: 'ไม่มีสิทธิ์เข้าถึง'
    });
  }

  let applications = Object.values(therapistApplications);

  // Filter by status
  if (filters.status) {
    applications = applications.filter(a => a.status === filters.status);
  }

  // Sort by submission date (newest first)
  applications.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  return res.status(200).json({
    success: true,
    applications: applications.map(a => ({
      id: a.id,
      fullName: a.fullName,
      email: a.email,
      licenseType: a.licenseType,
      licenseNumber: a.licenseNumber,
      experience: a.experience,
      status: a.status,
      submittedAt: a.submittedAt
    })),
    total: applications.length,
    byStatus: {
      pending: Object.values(therapistApplications).filter(a => a.status === 'pending').length,
      under_review: Object.values(therapistApplications).filter(a => a.status === 'under_review').length,
      approved: Object.values(therapistApplications).filter(a => a.status === 'approved').length,
      rejected: Object.values(therapistApplications).filter(a => a.status === 'rejected').length
    }
  });
}

// Handler: Admin - Review application
function handleAdminReviewApplication(res, adminId, applicationId, decision, notes = '') {
  // Verify admin
  if (!adminUsers[adminId]) {
    return res.status(403).json({
      success: false,
      error: 'ไม่มีสิทธิ์เข้าถึง'
    });
  }

  const application = therapistApplications[applicationId];
  if (!application) {
    return res.status(404).json({
      success: false,
      error: 'ไม่พบใบสมัคร'
    });
  }

  // Update status
  if (decision === 'approve') {
    application.status = 'approved';
    application.reviewedAt = new Date().toISOString();
    application.reviewedBy = adminId;
    application.reviewNotes = notes;

    // Create therapist profile
    const therapistId = generateId('therapist');
    const tempPassword = generateId('pass').substring(0, 8);

    therapistProfiles[therapistId] = {
      id: therapistId,
      applicationId: applicationId,
      email: application.email,
      password: simpleHash(tempPassword), // In production, send email to set password
      fullName: application.fullName,
      phone: application.phone,
      licenseNumber: application.licenseNumber,
      licenseType: application.licenseType,
      specializations: application.specializations,
      experience: application.experience,
      education: application.education,
      bio: application.bio,
      avatar: `../images/mind-mascot/avatar-${Math.floor(Math.random() * 6) + 1}.svg`,
      price: 1500, // Default price
      rating: 0,
      reviewCount: 0,
      availability: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      },
      isVerified: true,
      isActive: false, // Therapist needs to activate and set schedule
      createdAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'อนุมัติใบสมัครสำเร็จ',
      therapistId: therapistId,
      tempPassword: tempPassword // In production, send via email
    });
  } else if (decision === 'reject') {
    application.status = 'rejected';
    application.reviewedAt = new Date().toISOString();
    application.reviewedBy = adminId;
    application.rejectionReason = notes;

    return res.status(200).json({
      success: true,
      message: 'ปฏิเสธใบสมัครสำเร็จ'
    });
  } else if (decision === 'review') {
    application.status = 'under_review';
    application.reviewNotes = notes;

    return res.status(200).json({
      success: true,
      message: 'เปลี่ยนสถานะเป็น "กำลังตรวจสอบ"'
    });
  }

  return res.status(400).json({
    success: false,
    error: 'Invalid decision. Use: approve, reject, or review'
  });
}

// Handler: Therapist login
function handleTherapistLogin(res, email, password) {
  const therapist = Object.values(therapistProfiles).find(t => t.email === email);

  if (!therapist) {
    return res.status(401).json({
      success: false,
      error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
    });
  }

  if (therapist.password !== simpleHash(password)) {
    return res.status(401).json({
      success: false,
      error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
    });
  }

  // Create session
  const sessionToken = generateId('session');
  therapistSessions[sessionToken] = {
    therapistId: therapist.id,
    email: therapist.email,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  };

  return res.status(200).json({
    success: true,
    message: 'เข้าสู่ระบบสำเร็จ',
    sessionToken: sessionToken,
    therapist: {
      id: therapist.id,
      fullName: therapist.fullName,
      email: therapist.email,
      avatar: therapist.avatar,
      isActive: therapist.isActive
    }
  });
}

// Handler: Therapist update profile
function handleTherapistUpdateProfile(res, sessionToken, updates) {
  const session = validateTherapistSession(sessionToken);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'กรุณาเข้าสู่ระบบ'
    });
  }

  const therapist = therapistProfiles[session.therapistId];
  if (!therapist) {
    return res.status(404).json({
      success: false,
      error: 'ไม่พบข้อมูลนักจิตวิทยา'
    });
  }

  // Update allowed fields
  const allowedFields = ['bio', 'phone', 'specializations', 'price', 'avatar'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      therapist[field] = updates[field];
    }
  });

  return res.status(200).json({
    success: true,
    message: 'อัปเดตโปรไฟล์สำเร็จ',
    therapist: {
      id: therapist.id,
      fullName: therapist.fullName,
      email: therapist.email,
      bio: therapist.bio,
      phone: therapist.phone,
      specializations: therapist.specializations,
      price: therapist.price,
      avatar: therapist.avatar
    }
  });
}

// Handler: Therapist update schedule
function handleTherapistUpdateSchedule(res, sessionToken, availability) {
  const session = validateTherapistSession(sessionToken);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'กรุณาเข้าสู่ระบบ'
    });
  }

  const therapist = therapistProfiles[session.therapistId];
  if (!therapist) {
    return res.status(404).json({
      success: false,
      error: 'ไม่พบข้อมูลนักจิตวิทยา'
    });
  }

  // Validate availability format
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const validTimes = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  for (const day of validDays) {
    if (availability[day]) {
      // Validate each time slot
      availability[day] = availability[day].filter(time => validTimes.includes(time));
      therapist.availability[day] = availability[day];
    }
  }

  return res.status(200).json({
    success: true,
    message: 'อัปเดตตารางเวลาสำเร็จ',
    availability: therapist.availability
  });
}

// Handler: Therapist activate/deactivate
function handleTherapistSetActive(res, sessionToken, isActive) {
  const session = validateTherapistSession(sessionToken);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'กรุณาเข้าสู่ระบบ'
    });
  }

  const therapist = therapistProfiles[session.therapistId];
  if (!therapist) {
    return res.status(404).json({
      success: false,
      error: 'ไม่พบข้อมูลนักจิตวิทยา'
    });
  }

  // Check if has schedule before activating
  if (isActive) {
    const hasSchedule = Object.values(therapist.availability).some(slots => slots.length > 0);
    if (!hasSchedule) {
      return res.status(400).json({
        success: false,
        error: 'กรุณาตั้งค่าตารางเวลาก่อนเปิดให้จอง'
      });
    }
  }

  therapist.isActive = isActive;

  return res.status(200).json({
    success: true,
    message: isActive ? 'เปิดรับนัดสำเร็จ' : 'ปิดรับนัดสำเร็จ',
    isActive: therapist.isActive
  });
}

// Handler: Therapist get bookings
function handleTherapistGetBookings(res, sessionToken, dateRange = {}) {
  const session = validateTherapistSession(sessionToken);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'กรุณาเข้าสู่ระบบ'
    });
  }

  // Note: In production, this would query the booking database
  // For demo, return sample data structure
  return res.status(200).json({
    success: true,
    bookings: [],
    message: 'ยังไม่มีการจองในขณะนี้'
  });
}

// Handler: Therapist dashboard stats
function handleTherapistDashboard(res, sessionToken) {
  const session = validateTherapistSession(sessionToken);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'กรุณาเข้าสู่ระบบ'
    });
  }

  const therapist = therapistProfiles[session.therapistId];
  if (!therapist) {
    return res.status(404).json({
      success: false,
      error: 'ไม่พบข้อมูลนักจิตวิทยา'
    });
  }

  // In production, calculate from actual booking data
  return res.status(200).json({
    success: true,
    dashboard: {
      profile: {
        id: therapist.id,
        fullName: therapist.fullName,
        avatar: therapist.avatar,
        rating: therapist.rating,
        reviewCount: therapist.reviewCount,
        isActive: therapist.isActive
      },
      stats: {
        totalBookings: 0,
        completedSessions: 0,
        upcomingBookings: 0,
        totalEarnings: 0,
        thisMonthEarnings: 0
      },
      recentBookings: [],
      schedule: therapist.availability
    }
  });
}

// Handler: Admin dashboard
function handleAdminDashboard(res, adminId) {
  // Verify admin
  if (!adminUsers[adminId]) {
    return res.status(403).json({
      success: false,
      error: 'ไม่มีสิทธิ์เข้าถึง'
    });
  }

  const applications = Object.values(therapistApplications);
  const therapists = Object.values(therapistProfiles);

  return res.status(200).json({
    success: true,
    dashboard: {
      applications: {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        underReview: applications.filter(a => a.status === 'under_review').length,
        approved: applications.filter(a => a.status === 'approved').length,
        rejected: applications.filter(a => a.status === 'rejected').length
      },
      therapists: {
        total: therapists.length,
        active: therapists.filter(t => t.isActive).length,
        inactive: therapists.filter(t => !t.isActive).length
      },
      recentApplications: applications
        .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
        .slice(0, 5)
        .map(a => ({
          id: a.id,
          fullName: a.fullName,
          licenseType: a.licenseType,
          status: a.status,
          submittedAt: a.submittedAt
        }))
    }
  });
}

// Main handler
module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, ...params } = req.method === 'POST' ? req.body : req.query;

    switch (action) {
      // Public endpoints
      case 'submit_application':
        return handleSubmitApplication(res, params);

      case 'get_application_status':
        return handleGetApplicationStatus(res, params.email);

      // Therapist endpoints
      case 'therapist_login':
        return handleTherapistLogin(res, params.email, params.password);

      case 'therapist_update_profile':
        return handleTherapistUpdateProfile(res, params.sessionToken, params.updates || {});

      case 'therapist_update_schedule':
        return handleTherapistUpdateSchedule(res, params.sessionToken, params.availability || {});

      case 'therapist_set_active':
        return handleTherapistSetActive(res, params.sessionToken, params.isActive);

      case 'therapist_get_bookings':
        return handleTherapistGetBookings(res, params.sessionToken, params.dateRange);

      case 'therapist_dashboard':
        return handleTherapistDashboard(res, params.sessionToken);

      // Admin endpoints
      case 'admin_list_applications':
        return handleAdminListApplications(res, params.adminId, {
          status: params.status
        });

      case 'admin_review_application':
        return handleAdminReviewApplication(
          res,
          params.adminId,
          params.applicationId,
          params.decision,
          params.notes
        );

      case 'admin_dashboard':
        return handleAdminDashboard(res, params.adminId);

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
          availableActions: {
            public: ['submit_application', 'get_application_status'],
            therapist: [
              'therapist_login',
              'therapist_update_profile',
              'therapist_update_schedule',
              'therapist_set_active',
              'therapist_get_bookings',
              'therapist_dashboard'
            ],
            admin: [
              'admin_list_applications',
              'admin_review_application',
              'admin_dashboard'
            ]
          }
        });
    }
  } catch (error) {
    console.error('Therapist Admin API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    });
  }
};
