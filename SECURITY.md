# Security Policy

## Overview

Mind Fitness เป็นแพลตฟอร์มด้านสุขภาพจิตที่ให้ความสำคัญสูงสุดกับความปลอดภัยและความเป็นส่วนตัวของข้อมูลผู้ใช้ เอกสารนี้อธิบายนโยบายและแนวปฏิบัติด้านความปลอดภัยของเรา

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.1.x   | :white_check_mark: |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Measures

### 1. Content Security Policy (CSP)

ทุกหน้าใช้ CSP headers เพื่อป้องกัน XSS และ code injection:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://mindfitness-ai-backend.vercel.app;
">
```

### 2. Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | ป้องกัน MIME type sniffing |
| X-Frame-Options | SAMEORIGIN | ป้องกัน clickjacking |
| Referrer-Policy | strict-origin-when-cross-origin | ควบคุม referrer information |

### 3. Input Sanitization

ทุก user input ถูก sanitize ก่อนแสดงผลเพื่อป้องกัน XSS:

```javascript
function sanitize(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

### 4. Secure Storage

localStorage data ถูกเข้ารหัสผ่าน `MFSecurity.SecureStorage`:

```javascript
// Encrypted storage
MFSecurity.SecureStorage.set('key', sensitiveData);
const data = MFSecurity.SecureStorage.get('key');
```

### 5. HTTPS/TLS

- Production environment ใช้ HTTPS เท่านั้น
- All API calls use TLS 1.2+
- HSTS enabled on production

## Data Protection

### Sensitive Data Categories

| Data Type | Classification | Protection |
|-----------|----------------|------------|
| Mental health assessments | Highly Sensitive | Encrypted, time-limited |
| Chat conversations | Sensitive | Not stored permanently |
| Vent Wall posts | Semi-sensitive | Anonymous, auto-delete 90 days |
| User preferences | Low | localStorage encrypted |

### Data Retention

| Data | Retention Period |
|------|------------------|
| Assessment results | 1 year or upon request |
| Vent Wall posts | 90 days |
| Security logs | 30 days |
| Payment records | 7 years (legal requirement) |

## Reporting a Vulnerability

### How to Report

หากคุณพบช่องโหว่ด้านความปลอดภัย กรุณาแจ้งเราทันที:

1. **Email**: security@mindfitness.co
2. **Subject**: [SECURITY] Brief description

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

| Stage | Timeline |
|-------|----------|
| Initial acknowledgment | 24 hours |
| Preliminary assessment | 72 hours |
| Resolution (critical) | 7 days |
| Resolution (high) | 14 days |
| Resolution (medium/low) | 30 days |

### What We Ask

- Give us reasonable time to fix before public disclosure
- Do not access or modify other users' data
- Do not perform actions that could harm the service

### Recognition

Security researchers who responsibly disclose vulnerabilities will be:
- Acknowledged in our security hall of fame
- Eligible for rewards based on severity

## Compliance

### PDPA (Thailand)

Mind Fitness ปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562:

- ✅ Privacy Policy ครบถ้วน
- ✅ Data Subject Rights (7 สิทธิ)
- ✅ Data Protection Officer (DPO) designated
- ✅ Consent management
- ✅ Data retention policies

### ISO/IEC 27001

การควบคุมตามมาตรฐาน ISO/IEC 27001:

| Control | Status | Notes |
|---------|--------|-------|
| A.5 Information Security Policies | ✅ Implemented | |
| A.6 Organization of Information Security | ✅ Implemented | |
| A.8 Asset Management | ⚠️ Partial | In progress |
| A.9 Access Control | ⚠️ Partial | Backend only |
| A.10 Cryptography | ✅ Implemented | |
| A.12 Operations Security | ⚠️ Partial | Logging in progress |
| A.14 System Acquisition, Development | ✅ Implemented | |

### ISO/IEC 29110

Software lifecycle compliance:

| Process | Status |
|---------|--------|
| Project Management | ⚠️ In Progress |
| Software Implementation | ✅ Implemented |
| Documentation | ✅ Implemented |
| Testing | ⚠️ Planned |

## Security Checklist for Development

### Before Commit

- [ ] No hardcoded secrets or API keys
- [ ] Input validation on all user inputs
- [ ] Output encoding to prevent XSS
- [ ] CSP headers on new pages
- [ ] Security.js included where needed

### Before Deploy

- [ ] HTTPS verified
- [ ] Security headers present
- [ ] No debug mode enabled
- [ ] Dependencies updated
- [ ] Security scan passed

## Incident Response

### Crisis Detection

Mind Fitness มีระบบตรวจจับภาวะวิกฤต (Crisis Detection) ใน AI Chatbot:

- Keywords indicating self-harm
- Automatic crisis banner display
- Direct link to mental health hotline 1323

### Security Incident Procedure

1. **Detect**: Identify the incident
2. **Contain**: Limit the impact
3. **Eradicate**: Remove the threat
4. **Recover**: Restore normal operations
5. **Learn**: Document and improve

## Contact

- **Security Team**: security@mindfitness.co
- **DPO (Data Protection Officer)**: admin@mindfitness.co
- **Emergency**: 1323 (Mental Health Hotline)

---

Last updated: December 6, 2025
Version: 1.1.0
