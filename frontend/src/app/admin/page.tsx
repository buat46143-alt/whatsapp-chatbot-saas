"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, CheckCircle, XCircle, LogOut, LayoutDashboard, Search, Bot } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Client {
  id: string;
  business_name: string;
  whatsapp_number: string;
  is_active: boolean;
  subscription_expires_at: string;
}

export default function AdminDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setClients(data);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase.from('clients').update({ is_active: !currentStatus }).eq('id', id);
    fetchClients();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const filteredClients = clients.filter(c => 
    c.business_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.whatsapp_number.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar Premium */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <LayoutDashboard className="text-white w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">SuperAdmin <span className="text-blue-600">Portal</span></h1>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
              <LogOut size={18} /> Keluar
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manajemen Klien UMKM</h2>
            <p className="text-gray-500 mt-1">Kelola status berlangganan dan akses AI chatbot klien Anda.</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari nama bisnis atau nomor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full md:w-80 shadow-sm"
            />
          </div>
        </div>

        {/* Tabel Klien Modern */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Info Bisnis</th>
                  <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nomor WhatsApp</th>
                  <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status Layanan AI</th>
                  <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {client.business_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">{client.business_name}</span>
                      </div>
                    </td>
                    <td className="p-5 text-gray-600 font-medium">{client.whatsapp_number}</td>
                    <td className="p-5">
                      {client.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                          <CheckCircle className="w-3.5 h-3.5" /> Aktif / Running
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                          <XCircle className="w-3.5 h-3.5" /> Ditangguhkan
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        onClick={() => toggleStatus(client.id, client.is_active)}
                        className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-xl font-semibold transition-all shadow-sm ${
                          client.is_active 
                            ? 'bg-white border border-gray-300 text-red-600 hover:bg-red-50 hover:border-red-200' 
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                        }`}
                      >
                        <Bot className="w-4 h-4" />
                        {client.is_active ? 'Matikan AI' : 'Aktifkan AI'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      Belum ada data klien yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
