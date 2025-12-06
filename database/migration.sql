-- =====================================================
-- MindFitness Database Migration Script
-- Database: u786472860_mindfitness_pa
--
-- Run this script on your Hostinger MySQL database
-- to create all required tables
-- =====================================================

-- Set character set
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- VENT WALL TABLES
-- =====================================================

-- Vent Posts Table
CREATE TABLE IF NOT EXISTS `vent_posts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `content` TEXT NOT NULL,
  `emotion` VARCHAR(50) DEFAULT 'neutral',
  `ai_response` TEXT,
  `likes_count` INT UNSIGNED DEFAULT 0,
  `avatar_url` VARCHAR(255),
  `display_name` VARCHAR(100),
  `session_id` VARCHAR(100),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vent Likes Table
CREATE TABLE IF NOT EXISTS `vent_likes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `post_id` INT UNSIGNED NOT NULL,
  `session_id` VARCHAR(100),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_post_id` (`post_id`),
  INDEX `idx_session_id` (`session_id`),
  UNIQUE KEY `unique_like` (`post_id`, `session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vent Replies Table
CREATE TABLE IF NOT EXISTS `vent_replies` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `post_id` INT UNSIGNED NOT NULL,
  `content` TEXT NOT NULL,
  `avatar_url` VARCHAR(255),
  `display_name` VARCHAR(100),
  `ai_encouragement` TEXT,
  `session_id` VARCHAR(100),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_post_id` (`post_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PRIVATE CHAT TABLES
-- =====================================================

-- Private Chat Rooms Table
CREATE TABLE IF NOT EXISTS `private_chat_rooms` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `room_id` VARCHAR(100) UNIQUE NOT NULL,
  `user1_session` VARCHAR(100),
  `user1_avatar` VARCHAR(255),
  `user1_name` VARCHAR(100),
  `user2_session` VARCHAR(100),
  `user2_avatar` VARCHAR(255),
  `user2_name` VARCHAR(100),
  `is_ai_chat` BOOLEAN DEFAULT FALSE,
  `status` ENUM('active', 'ended') DEFAULT 'active',
  `ended_by` VARCHAR(100),
  `ended_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_room_id` (`room_id`),
  INDEX `idx_user1_session` (`user1_session`),
  INDEX `idx_user2_session` (`user2_session`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Private Chat Messages Table
CREATE TABLE IF NOT EXISTS `private_chat_messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `room_id` VARCHAR(100) NOT NULL,
  `sender_session` VARCHAR(100),
  `sender_avatar` VARCHAR(255),
  `sender_name` VARCHAR(100),
  `content` TEXT NOT NULL,
  `is_ai` BOOLEAN DEFAULT FALSE,
  `is_system` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_room_id` (`room_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat Reports Table
CREATE TABLE IF NOT EXISTS `chat_reports` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `room_id` VARCHAR(100),
  `reporter_session` VARCHAR(100),
  `reason` TEXT,
  `status` ENUM('pending', 'reviewed', 'resolved') DEFAULT 'pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_room_id` (`room_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- PSYCHOLOGIST BOOKING TABLES
-- =====================================================

-- Psychologists Table
CREATE TABLE IF NOT EXISTS `psychologists` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `fullname_th` VARCHAR(200) NOT NULL,
  `fullname_en` VARCHAR(200),
  `title_th` VARCHAR(100),
  `title_en` VARCHAR(100),
  `email` VARCHAR(255),
  `phone` VARCHAR(20),
  `avatar_url` VARCHAR(255),
  `specialties` JSON,
  `specialties_en` JSON,
  `experience_years` INT UNSIGNED DEFAULT 0,
  `rating` DECIMAL(3,2) DEFAULT 4.50,
  `review_count` INT UNSIGNED DEFAULT 0,
  `rate_per_session` INT UNSIGNED DEFAULT 1500,
  `bio_th` TEXT,
  `bio_en` TEXT,
  `availability` JSON,
  `status` ENUM('active', 'inactive', 'pending') DEFAULT 'active',
  `is_verified` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appointments Table
CREATE TABLE IF NOT EXISTS `psy_appointments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `booking_ref` VARCHAR(50) UNIQUE NOT NULL,
  `psychologist_id` INT UNSIGNED NOT NULL,
  `client_id` VARCHAR(100) NOT NULL,
  `scheduled_date` DATE NOT NULL,
  `scheduled_time` VARCHAR(10) NOT NULL,
  `end_time` VARCHAR(10),
  `notes` TEXT,
  `amount` INT UNSIGNED DEFAULT 0,
  `payment_status` ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  `status` ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
  `video_room_id` VARCHAR(100),
  `cancelled_at` DATETIME,
  `completed_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_psychologist_id` (`psychologist_id`),
  INDEX `idx_client_id` (`client_id`),
  INDEX `idx_scheduled_date` (`scheduled_date`),
  INDEX `idx_status` (`status`),
  INDEX `idx_booking_ref` (`booking_ref`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA - Psychologists
-- =====================================================

INSERT INTO `psychologists` (`fullname_th`, `fullname_en`, `title_th`, `title_en`, `specialties`, `specialties_en`, `experience_years`, `rating`, `review_count`, `rate_per_session`, `bio_th`, `bio_en`, `availability`, `status`, `is_verified`) VALUES
('ดร.สมหญิง รักษาใจ', 'Dr. Somying Raksajai', 'นักจิตวิทยาคลินิก', 'Clinical Psychologist', '["วิตกกังวล", "ซึมเศร้า", "ความเครียด"]', '["Anxiety", "Depression", "Stress"]', 8, 4.90, 127, 1500, 'ประสบการณ์ให้คำปรึกษามากกว่า 8 ปี เชี่ยวชาญด้านการบำบัดความวิตกกังวลและภาวะซึมเศร้า', 'Over 8 years of counseling experience, specializing in anxiety and depression therapy', '{"monday":["09:00","10:00","11:00","14:00","15:00","16:00"],"tuesday":["09:00","10:00","14:00","15:00"],"wednesday":["09:00","10:00","11:00","14:00","15:00","16:00"],"thursday":["10:00","11:00","14:00","15:00"],"friday":["09:00","10:00","11:00","14:00"],"saturday":["10:00","11:00"],"sunday":[]}', 'active', TRUE),

('อ.ธนพล ใจดี', 'Thanapol Jaidee', 'นักจิตวิทยาการปรึกษา', 'Counseling Psychologist', '["ความสัมพันธ์", "การทำงาน", "การพัฒนาตนเอง"]', '["Relationships", "Work Issues", "Self-development"]', 5, 4.70, 89, 1200, 'ผู้เชี่ยวชาญด้านปัญหาความสัมพันธ์และการพัฒนาศักยภาพบุคคล', 'Expert in relationship issues and personal development', '{"monday":["10:00","11:00","15:00","16:00","17:00"],"tuesday":["09:00","10:00","11:00","15:00","16:00"],"wednesday":["15:00","16:00","17:00"],"thursday":["09:00","10:00","11:00","15:00","16:00","17:00"],"friday":["10:00","11:00","15:00","16:00"],"saturday":["09:00","10:00","11:00"],"sunday":[]}', 'active', TRUE),

('ดร.พิมพ์ชนก สุขใจ', 'Dr. Pimchanok Sukjai', 'จิตแพทย์', 'Psychiatrist', '["โรคซึมเศร้า", "โรควิตกกังวล", "นอนไม่หลับ"]', '["Depression Disorder", "Anxiety Disorder", "Insomnia"]', 12, 4.95, 203, 2000, 'จิตแพทย์ผู้เชี่ยวชาญด้านโรคทางจิตเวช มีประสบการณ์มากกว่า 12 ปี', 'Psychiatrist specializing in mental health disorders with over 12 years of experience', '{"monday":["09:00","10:00","11:00"],"tuesday":["09:00","10:00","11:00","14:00"],"wednesday":["14:00","15:00","16:00"],"thursday":["09:00","10:00","11:00","14:00","15:00"],"friday":["09:00","10:00"],"saturday":[],"sunday":[]}', 'active', TRUE);

-- =====================================================
-- END OF MIGRATION
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

-- Display success message
SELECT 'Migration completed successfully!' AS Status;
SELECT COUNT(*) AS PsychologistsCount FROM psychologists;
