"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bot, User, Power, Activity, MessageSquare } from 'lucide-react';

export default function ClientDashboard() {
  const [clientData, setClientData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [takeover, setTakeover] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const { data: userResp } = await supabase.auth.getUser();
      if (!userResp.user) return;

      // Ambil data profil bisnis
      const { data: profile } = await supabase
        .from('clients')
        .select('*')
        .eq('id', userResp.user.id)
        .single();
      
      if (profile) {
        setClientData(profile);
        setTakeover(profile.human_takeover);
      }

      // Ambil data analitik 7 hari terakhir
      const { data: chartData } = await supabase
        .from('analytics_daily')
        .select('date, ai_handled, human_handled')
        .eq('client_id', userResp.user.id)
        .order('date', { ascending: true })
        .limit(7);

      if (chartData) {
        // Format data untuk Recharts
        const formatted = chartData.map(d => ({
          name: new Date(d.date).toLocaleDateString('id-ID', { weekday: 'short' }),
          AI: d.ai_handled,
          Manusia: d.human_handled
        }));
        setAnalytics(formatted);
      }
    };
    loadData();
  }, []);

  // Fungsi Krusial: Human Takeover Switch
  // Ini akan mematikan auto-reply Gemini seketika via Webhook layer
  const handleTakeoverToggle = async () => {
    const newState = !takeover;
    setTakeover(newState);
    
    await supabase
      .from('clients')
      .update({ human_takeover: newState })
      .eq('id', clientData.id);
  };

  if (!clientData) return <div className="p-8 text-center">Memuat dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-blue-600 text-white px-6 py-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare /> Dashboard {clientData.business_name}
        </h1>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8 space-y-8">
        
        {/* Human Takeover Card */}
        <div className={`p-6 rounded-2xl shadow-sm border ${takeover ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {takeover ? <User className="text-amber-600" /> : <Bot className="text-blue-600" />}
                Mode Balas Pesan: {takeover ? 'Manual (Manusia)' : 'Otomatis (AI)'}
              </h2>
              <p className="text-gray-600 mt-1 text-sm">
                {takeover 
                  ? 'AI saat ini DIMATIKAN. Anda harus membalas pesan pelanggan secara manual melalui WhatsApp.' 
                  : 'AI sedang AKTIF dan otomatis membalas pesan pelanggan 24/7.'}
              </p>
            </div>
            
            <button 
              onClick={handleTakeoverToggle}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                takeover ? 'bg-gray-800 hover:bg-gray-900' : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              <Power size={20} />
              {takeover ? 'Aktifkan AI Kembali' : 'Ambil Alih Manual'}
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Activity className="text-green-500" /> Statistik Pesan 7 Hari Terakhir
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="AI" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Manusia" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  );
}
