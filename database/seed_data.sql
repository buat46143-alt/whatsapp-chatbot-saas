-- Insert Admin awal (Ganti email dengan email Supabase Auth Anda nanti)
-- Lakukan ini SETELAH Anda membuat user di Supabase Authentication
INSERT INTO admins (id, email) 
VALUES (
    'b4d45c1a-8c3b-4f9e-a1b2-c3d4e5f6g7h8', -- Ganti dengan UUID dari Supabase Auth
    'admin@saas-chatbot.id'
);

-- Insert Default Global Settings
INSERT INTO settings (key, value)
VALUES 
    ('system_maintenance', '{"is_active": false}'),
    ('default_fallback_message', '{"message": "Maaf, sistem sedang sibuk. Mohon tunggu sebentar."}');
