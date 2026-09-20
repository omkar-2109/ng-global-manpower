# NG Global Manpower Services

> Enterprise-grade Node.js overseas recruitment & candidate management platform connecting skilled trade specialists with verified infrastructure, industrial, and engineering employers across the Gulf, Europe, USA, and New Zealand.

---

## 🚀 Features

- **High-Converting Landing Page**: Premium Glassmorphism UI, 3D WebGL Globe, dynamic market ticker, and geographically accurate interactive World Map.
- **5-Step Candidate Application Wizard**: Structured lead capture collecting trade qualifications, GCC/European experience, and passport readiness with automatic WhatsApp recruiter routing.
- **Recruiter Admin CRM Portal**: Staff dashboard (`/admin/dashboard`) with real-time candidate lead tracking, status pipeline (New, In Review, Document Verification, Embassy Processing), and job posting management.
- **SEO & Performance Optimized**: Full Schema.org JSON-LD structured data, dynamic OpenGraph meta tags, and high Lighthouse score SSR.
- **Supabase / PostgreSQL Ready**: Integrated schema support for Supabase database.

---

## 🛠️ Tech Stack

- **Runtime & Server**: Node.js, Express.js
- **Templating Engine**: EJS (Server-Side Rendered)
- **Styling**: Vanilla CSS3 (Custom Design System with Gold & Sapphire Theme)
- **Interactive UI**: Three.js (3D Interactive Globe), SVG Geospatial Map
- **Security**: Helmet, Express Rate Limit, JWT Authentication, Cookie-Parser, BCrypt

---

## 📋 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/omkar-2109/ng-global.git
cd ng-global
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```

Required environment variables:
```env
PORT=3000
NODE_ENV=development
APP_NAME="NG Global Manpower Services"
APP_URL=http://localhost:3000

JWT_SECRET=your_jwt_secret_key
COOKIE_SECRET=your_cookie_secret_key

WHATSAPP_NUMBER=918080025670
HELPLINE_PHONE="+91 80800 25670"
SUPPORT_EMAIL=hr@ngglobalmp.in

# Supabase Credentials
SUPABASE_URL=https://xlluysszizykztwpnuig.supabase.co
SUPABASE_ANON_KEY=your_publishable_key
```

### 4. Run the Application
```bash
# Start server
npm start

# Development mode with auto-reload
npm run dev
```

Visit: `http://localhost:3000`  
Staff Portal: `http://localhost:3000/admin/login`

---

## 🗄️ Supabase Database Schema

Run the following DDL in your Supabase SQL Editor:

```sql
-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'recruiter',
    active INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    job_code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    flag VARCHAR(20) DEFAULT '🌐',
    salary_inr VARCHAR(100) NOT NULL,
    salary_foreign VARCHAR(100),
    perks JSONB DEFAULT '[]'::jsonb,
    employer_funded INT DEFAULT 0,
    badge_text VARCHAR(100),
    active INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    target_trade VARCHAR(255) NOT NULL,
    target_country VARCHAR(100),
    experience VARCHAR(100),
    passport_status VARCHAR(100),
    job_code VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED SETTINGS
INSERT INTO settings (key, value) VALUES
('whatsapp_number', '918080025670'),
('helpline_phone', '+91 80800 25670'),
('support_email', 'hr@ngglobalmp.in'),
('anti_fraud_notice', 'Official visa & medical fees are paid directly to embassies. NG Global maintains transparent regulated service fees, with select 100% employer-funded positions.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

---

## 🚢 Deploy to Production (Render / Railway)

1. Connect your GitHub repository to **Render** or **Railway**.
2. Set Environment Runtime to **Node**.
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add your `.env` variables in the provider dashboard.
6. Attach your custom domain (e.g., `ngglobalmp.in`).

---

## 📄 License

Proprietary © 2026 NG Global Manpower Services. All rights reserved.
