"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, CheckCircle, XCircle, LogOut } from 'lucide-react';
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
  const router = useRouter();

  // Mengambil daftar client dari database (Hanya admin yang punya RLS access ke semua row)
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

  // Fungsi untuk mengaktifkan/menonaktifkan subscription UMKM
  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await supabase
      .from('clients')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    fetchClients();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-blue-600" /> Admin Panel
        </h1>
        <button onClick={handleLogout} className="flex items-center gap-2 text-red-600 hover:text-red-800">
          <LogOut size={18} /> Keluar
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-6 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Manajemen Klien UMKM</h2>
            <p className="text-sm text-gray-500">Daftar pelanggan dan status berlangganan</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm">
                  <th className="p-4 font-medium">Nama Bisnis</th>
                  <th className="p-4 font-medium">No. WhatsApp</th>
                  <th className="p-4 font-medium">Status AI</th>
                  <th className="p-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="border-t border-gray-50">
                    <td className="p-4 font-medium text-gray-800">{client.business_name}</td>
                    <td className="p-4 text-gray-600">{client.whatsapp_number}</td>
                    <td className="p-4">
                      {client.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={14} /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <XCircle size={14} /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(client.id, client.is_active)}
                        className={`text-sm px-3 py-1.5 rounded-md font-medium transition ${
                          client.is_active 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {client.is_active ? 'Matikan AI' : 'Aktifkan AI'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
