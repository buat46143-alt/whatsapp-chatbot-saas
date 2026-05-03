-- ==========================================
-- SAAS WHATSAPP CHATBOT - SUPABASE SCHEMA
-- ==========================================
-- Catatan: Eksekusi script ini di SQL Editor Supabase Anda.

-- 1. Mengaktifkan ekstensi yang dibutuhkan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Membuat Tabel Utama

-- Tabel Admin (Hanya 1 entri untuk pemilik sistem)
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- Tabel Clients (UMKM yang berlangganan)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    whatsapp_number TEXT UNIQUE NOT NULL,
    gemini_api_key TEXT, -- Opsional, jika UMKM pakai API key sendiri
    system_prompt TEXT DEFAULT 'Kamu adalah customer service AI yang ramah. Jawab dengan Bahasa Indonesia.',
    human_takeover BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT FALSE, -- Harus diaktifkan admin setelah bayar
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- Tabel Conversations (Mengelompokkan pesan per nomor customer)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    customer_number TEXT NOT NULL,
    last_message_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    UNIQUE(client_id, customer_number)
);

-- Tabel Messages (Histori pesan masuk dan keluar)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type TEXT CHECK (sender_type IN ('customer', 'ai', 'human')),
    content TEXT NOT NULL,
    response_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- Tabel Daily Analytics (Agregasi untuk Dashboard)
CREATE TABLE analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    date DATE DEFAULT (CURRENT_DATE AT TIME ZONE 'Asia/Jakarta'),
    total_messages INTEGER DEFAULT 0,
    ai_handled INTEGER DEFAULT 0,
    human_handled INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    UNIQUE(client_id, date)
);

-- Tabel API Usage (Tracking token Gemini)
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    date DATE DEFAULT (CURRENT_DATE AT TIME ZONE 'Asia/Jakarta'),
    tokens_used INTEGER DEFAULT 0,
    UNIQUE(client_id, date)
);

-- Tabel Settings (Konfigurasi Global Sistem)
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ==========================================
-- 3. Fungsi & Triggers (Otomatisasi Database)
-- ==========================================

-- Fungsi untuk update kolom updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'Asia/Jakarta';
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk tabel clients
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 4. Row Level Security (RLS) Policies
-- ==========================================
-- Catatan: Mengamankan data agar client hanya bisa melihat datanya sendiri.

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Policy Admin: Admin bisa melihat dan mengubah semua data
CREATE POLICY "Admin full access clients" ON clients FOR ALL USING (auth.uid() IN (SELECT id FROM admins));
CREATE POLICY "Admin full access conversations" ON conversations FOR ALL USING (auth.uid() IN (SELECT id FROM admins));
CREATE POLICY "Admin full access messages" ON messages FOR ALL USING (auth.uid() IN (SELECT id FROM admins));

-- Policy Client: Client hanya bisa melihat data mereka sendiri
CREATE POLICY "Clients view own profile" ON clients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Clients update own profile" ON clients FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Clients view own conversations" ON conversations FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Clients view own messages" ON messages FOR SELECT USING (
    conversation_id IN (SELECT id FROM conversations WHERE client_id = auth.uid())
);
CREATE POLICY "Clients insert manual messages" ON messages FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM conversations WHERE client_id = auth.uid())
);

CREATE POLICY "Clients view own analytics" ON analytics_daily FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Clients view own api usage" ON api_usage FOR SELECT USING (client_id = auth.uid());
