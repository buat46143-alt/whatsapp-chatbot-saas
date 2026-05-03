"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bot, User, Power, Activity, MessageSquare, ShieldAlert, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ClientDashboard() {
  const [clientData, setClientData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [takeover, setTakeover] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      const { data: userResp } = await supabase.auth.getUser();
      if (!userResp.user) return;

      const { data: profile } = await supabase.from('clients').select('*').eq('id', userResp.user.id).single();
      if (profile) {
        setClientData(profile);
        setTakeover(profile.human_takeover);
      }

      const { data: chartData } = await supabase
        .from('analytics_daily')
        .select('date, ai_handled, human_handled')
        .eq('client_id', userResp.user.id)
        .order('date', { ascending: true })
        .limit(7);

      if (chartData) {
        setAnalytics(chartData.map(d => ({
          name: new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' }),
          AI: d.ai_handled,
          Manusia: d.human_handled
        })));
      }
    };
    loadData();
  }, []);

  const handleTakeoverToggle = async () => {
    const newState = !takeover;
    setTakeover(newState);
    await supabase.from('clients').update({ human_takeover: newState }).eq('id', clientData.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!clientData) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Memuat ruang kerja Anda...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">{clientData.business_name}</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-blue-100 hover:text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors text-sm font-medium">
            <LogOut size={18} /> Keluar
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        
        {/* Human Takeover Card (Dengan Efek Kedip/Pulse jika aktif) */}
        <div className={`relative overflow-hidden p-8 rounded-3xl shadow-sm border transition-colors duration-500 ${
          takeover ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
        }`}>
          {/* Efek Latar */}
          {takeover && <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/40 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>}
          {!takeover && <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>}

          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                {takeover ? (
                  <div className="p-3 bg-amber-100 rounded-xl text-amber-600 animate-pulse">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                    <Bot className="w-6 h-6" />
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-900">
                  Mode Sistem: {takeover ? 'Ambil Alih Manual' : 'Auto-Pilot AI'}
                </h2>
              </div>
              <p className={`text-sm md:text-base max-w-xl leading-relaxed ${takeover ? 'text-amber-800' : 'text-gray-600'}`}>
                {takeover 
                  ? '⚠️ PERHATIAN: AI sedang dimatikan sementara. Saat ini Anda harus membalas seluruh pesan pelanggan secara manual dari aplikasi WhatsApp Anda.' 
                  : 'Sistem AI sedang aktif berjalan di latar belakang. Asisten virtual Anda otomatis melayani pelanggan 24/7 tanpa henti.'}
              </p>
            </div>
            
            <button 
              onClick={handleTakeoverToggle}
              className={`flex-shrink-0 flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white transition-all shadow-xl hover:-translate-y-1 ${
                takeover 
                  ? 'bg-gray-900 hover:bg-black shadow-gray-900/30' 
                  : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
              }`}
            >
              <Power className="w-5 h-5" />
              {takeover ? 'Nyalakan AI Kembali' : 'Ambil Alih Manual'}
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-green-100 rounded-lg text-green-600">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Statistik Layanan (7 Hari Terakhir)</h2>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                />
                <Line type="monotone" name="Dibalas AI" dataKey="AI" stroke="#3b82f6" strokeWidth={4} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 8 }} />
                <Line type="monotone" name="Dibalas Manual" dataKey="Manusia" stroke="#f59e0b" strokeWidth={4} dot={{ r: 5, strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
