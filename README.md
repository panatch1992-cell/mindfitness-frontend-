# Mind Fitness - Mental Health Ecosystem

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/panatch1992-cell/mindfitness-frontend-)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![PDPA](https://img.shields.io/badge/PDPA-Compliant-success.svg)](privacy-policy.html)

> ระบบนิเวศสุขภาพจิตครบวงจรสำหรับคนไทย

## Overview

Mind Fitness เป็นแพลตฟอร์มด้านสุขภาพจิตที่ออกแบบมาเพื่อคนไทย ประกอบด้วยเครื่องมือหลากหลายสำหรับการดูแลสุขภาพจิตทั้งสำหรับบุคคลทั่วไปและโรงเรียน

## Features

### MindSpace Ecosystem

| Feature | Description | Status |
|---------|-------------|--------|
| **น้องมายด์ AI** | AI Chatbot ที่พร้อมรับฟัง 24 ชม. พร้อม Crisis Detection | Active |
| **Vent Wall** | พื้นที่ระบายความรู้สึกแบบ Anonymous | Active |
| **Private Chat** | พูดคุยส่วนตัวกับคนแปลกหน้า | Beta |
| **MHL-35 Assessment** | แบบประเมินความรอบรู้ด้านสุขภาพจิต | Active |
| **Psychoeducation Comics** | การ์ตูนให้ความรู้ด้านสุขภาพจิต 6 ตอน | Active |
| **Dashboard** | ติดตามกิจกรรมและสุขภาพจิตส่วนตัว | Active |

### สำหรับโรงเรียน

- ระบบประเมิน MHL-35 สำหรับนักเรียน
- School Mental Health Quality Assessment (SMHQA)
- Dashboard สำหรับครูและผู้บริหาร
- Crisis Alert และการส่งต่อผู้เชี่ยวชาญ

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Vercel Serverless Functions
- **AI**: Claude/Anthropic API
- **Hosting**: Vercel

## Project Structure

```
mindfitness-frontend-/
├── index.html              # หน้าแรก
├── about.html              # เกี่ยวกับเรา
├── school.html             # สำหรับโรงเรียน
├── mhl-assessment.html     # แบบประเมิน MHL-35
├── mhl-landing.html        # แนะนำ MHL-35
├── privacy-policy.html     # นโยบายความเป็นส่วนตัว
├── terms.html              # ข้อกำหนดการใช้งาน
├── mindspace/
│   ├── index.html          # MindSpace Hub
│   ├── mindbot.html        # AI Chatbot
│   ├── vent-wall.html      # Anonymous Feed
│   ├── private-chat.html   # Random Matching Chat
│   ├── dashboard.html      # User Dashboard
│   ├── comics.html         # Comics Viewer
│   ├── payment-comic.html  # Comics Access
│   ├── psychologist.html   # Book Psychologist
│   └── listeners.html      # Listener Recruitment
├── js/
│   └── security.js         # Security Utilities
├── css/
│   └── style.css           # Main Stylesheet
└── images/
    └── mind-mascot/        # น้องมายด์ mascot images
```

## Security

Mind Fitness ใช้มาตรการรักษาความปลอดภัยตามมาตรฐาน ISO/IEC 27001:

- Content Security Policy (CSP)
- XSS Prevention via Input Sanitization
- Secure localStorage Encryption
- HTTPS/TLS Encryption
- PDPA Compliance

ดูรายละเอียดเพิ่มเติมที่ [SECURITY.md](SECURITY.md)

## API Integration

Backend API: `https://mindfitness-ai-backend.vercel.app`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | AI Chatbot conversation |
| `/api/vent` | POST | Vent Wall posts (create, list, like) |
| `/api/psychoeducation` | POST | Comics content access |

## Development

### Prerequisites

- Web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional for development)

### Local Development

```bash
# Clone the repository
git clone https://github.com/panatch1992-cell/mindfitness-frontend-.git

# Navigate to project directory
cd mindfitness-frontend-

# Start local server (Python 3)
python -m http.server 8000

# Or using Node.js
npx serve
```

### Deployment

The project is deployed automatically via Vercel when pushed to the main branch.

## Compliance

| Standard | Status |
|----------|--------|
| PDPA (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล) | Compliant |
| ISO/IEC 27001 (Information Security) | Partial |
| ISO/IEC 29110 (Software Lifecycle) | In Progress |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

- Email: admin@mindfitness.co
- Website: https://www.mindfitness.co
- Mental Health Hotline: 1323 (24 hours)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Anthropic Claude AI
- Thai Mental Health Hotline 1323
- Mind Fitness Community

---

Made with love for Thai mental health by Mind Fitness Team
