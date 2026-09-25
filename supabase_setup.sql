-- =============================================================================
-- NG Global Manpower Services - Supabase Database Schema & Migration Script
-- Run this complete script in your Supabase SQL Editor:
-- (Supabase Dashboard -> SQL Editor -> New Query -> Paste & Run)
-- =============================================================================

-- 1. USERS TABLE (Strict Admin & Staff)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';

-- 2. AGENTS TABLE (Registered Partner Agencies)
CREATE TABLE IF NOT EXISTS agents (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    agency_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    license_no VARCHAR(150),
    status VARCHAR(50) DEFAULT 'active',
    password_hash VARCHAR(255) NOT NULL,
    commission_notes TEXT,
    candidates_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. JOBS TABLE (Active Overseas Openings & Quotas)
CREATE TABLE IF NOT EXISTS jobs (
    id BIGINT PRIMARY KEY,
    job_code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    country VARCHAR(150) NOT NULL,
    flag VARCHAR(20) DEFAULT '🌐',
    salary_inr VARCHAR(100) NOT NULL,
    salary_foreign VARCHAR(100),
    perks JSONB DEFAULT '[]'::jsonb,
    employer_funded INT DEFAULT 0,
    badge_text VARCHAR(100),
    image VARCHAR(255),
    description TEXT,
    requirements JSONB DEFAULT '[]'::jsonb,
    age_limit VARCHAR(100),
    working_hours VARCHAR(150),
    eligibility_notes TEXT,
    active INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all new job fields exist even if table was created with older schema
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS image VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '[]'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS age_limit VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS working_hours VARCHAR(150);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS eligibility_notes TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS perks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS badge_text VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS employer_funded INT DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS active INT DEFAULT 1;

-- 4. LEADS & CANDIDATES TABLE
CREATE TABLE IF NOT EXISTS leads (
    id BIGINT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    whatsapp VARCHAR(50),
    email VARCHAR(255),
    trade VARCHAR(255) NOT NULL,
    destination VARCHAR(150),
    experience VARCHAR(100),
    city VARCHAR(100),
    state VARCHAR(100),
    nationality VARCHAR(100) DEFAULT 'Indian',
    passport_no VARCHAR(50),
    passport_expiry VARCHAR(50),
    dob VARCHAR(50),
    gamca_status VARCHAR(50),
    source VARCHAR(100) DEFAULT 'web',
    lead_type VARCHAR(50) DEFAULT 'inquiry',
    agent_id BIGINT,
    agent_username VARCHAR(100),
    documents JSONB DEFAULT '[]'::jsonb,
    merged_dossier_pdf VARCHAR(255),
    job_code VARCHAR(100),
    status VARCHAR(50) DEFAULT 'New',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all candidate fields exist even if table was created with older schema
ALTER TABLE leads ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS trade VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS destination VARCHAR(150);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) DEFAULT 'Indian';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS passport_no VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS passport_expiry VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS dob VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gamca_status VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT 'web';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type VARCHAR(50) DEFAULT 'inquiry';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS agent_id BIGINT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS agent_username VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS merged_dossier_pdf VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS job_code VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'New';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    lead_id BIGINT,
    agent_id BIGINT,
    agent_name VARCHAR(255),
    priority VARCHAR(50) DEFAULT 'normal',
    read INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SETTINGS TABLE (Key-Value)
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial System Settings
INSERT INTO settings (key, value) VALUES
('whatsapp_number', '"918080025670"'::jsonb),
('helpline_phone', '"+91 80800 25670"'::jsonb),
('support_email', '"hr@ngglobalmp.in"'::jsonb),
('anti_fraud_notice', '"Official visa & medical fees are paid directly to embassies. NG Global maintains transparent regulated service fees, with select 100% employer-funded positions."'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
