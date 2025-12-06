# Changelog

All notable changes to Mind Fitness Frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-12-06

### Added
- Security headers (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy) across all pages
- `js/security.js` - Comprehensive security utility module including:
  - XOR encryption for localStorage data
  - SecureStorage wrapper with expiry support
  - Input sanitization functions for XSS prevention
  - CSRF token generation
  - Client-side rate limiting
  - Security audit checks
- Input sanitization in Vent Wall for XSS prevention
- Consistent footer navigation across all pages
- Social links in About page (LinkedIn, GitHub, Email)

### Security
- Implemented ISO/IEC 27001 security controls
- Added Content Security Policy (CSP) headers
- Protected against XSS attacks via input sanitization
- Enhanced localStorage security with encryption

### Documentation
- Added README.md with project overview
- Added CHANGELOG.md for version tracking
- Added SECURITY.md for security policies

## [1.0.0] - 2025-12-06

### Added
- Complete MindSpace ecosystem:
  - `mindspace/index.html` - MindSpace Hub
  - `mindspace/mindbot.html` - AI Chatbot (Claude-powered)
  - `mindspace/vent-wall.html` - Facebook-style anonymous feed
  - `mindspace/private-chat.html` - Random matching private chat
  - `mindspace/dashboard.html` - User activity dashboard
  - `mindspace/comics.html` - Psychoeducation comics viewer
  - `mindspace/payment-comic.html` - Comics access/payment
  - `mindspace/psychologist.html` - Psychologist booking
  - `mindspace/listeners.html` - Listener volunteer recruitment

### Changed
- Updated navigation to include MindSpace
- Replaced subscription system with free Psychoeducation Comics
- Updated CTA sections across the site

### Removed
- `subscription.html` - Removed old subscription/payment system
- References to `self-care-tools.html` and `psychoeducation.html`

### Fixed
- Broken links to removed pages now redirect to comics.html

## [0.9.0] - 2025-12-01

### Added
- MHL-35 Assessment with AI-powered analysis
- School Mental Health Quality Assessment (SMHQA)
- Privacy Policy (PDPA compliant)
- Terms of Service
- About page with founder profile

### Changed
- Migrated backend from OpenAI to Claude/Anthropic API
- Added auto-translation for Thai/English

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.1.0 | 2025-12-06 | Security improvements, ISO/IEC 27001 compliance |
| 1.0.0 | 2025-12-06 | MindSpace ecosystem launch |
| 0.9.0 | 2025-12-01 | MHL-35, PDPA compliance |

## Upcoming

### [1.2.0] - Planned
- WebSocket integration for real-time Private Chat
- Enhanced Dashboard with mood trends
- Push notifications for crisis alerts
- Multi-language support (Thai, English)

### [2.0.0] - Planned
- Mobile app (React Native)
- Offline support (PWA)
- Integration with Thai healthcare systems
