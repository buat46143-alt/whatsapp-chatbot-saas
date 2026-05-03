"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Cek apakah user terdaftar sebagai Admin di tabel database
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (adminData) {
        router.push('/admin');
      } else {
        router.push('/client');
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' 
        ? 'Email atau password salah. Silakan cek kembali.' 
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-4 font-sans">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl mb-4 shadow-xl border border-white/20">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">BotSaaS <span className="text-blue-300">AI</span></h1>
          <p className="text-blue-100 mt-2">Panel Manajemen Chatbot UMKM Indonesia</p>
        </div>

        {/* Card Login */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Selamat Datang Kembali</h2>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 text-sm flex items-center gap-3">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="email" 
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@bisnisanda.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="password" 
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {loading ? 'Menghubungkan...' : 'Masuk ke Dashboard'}
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          </div>

          <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Butuh bantuan akses? <a href="#" className="text-blue-600 font-semibold hover:underline">Hubungi IT Support</a>
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-center text-blue-200/50 text-xs mt-8 uppercase tracking-widest font-medium">
          Powered by Google Gemini-2.5-Flash
        </p>
      </div>
    </div>
  );
}
