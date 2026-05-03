import { createClient } from '@supabase/supabase-js';

// Menginisialisasi koneksi Supabase untuk frontend
// Menggunakan anon key karena RLS (Row Level Security) akan melindungi data
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
