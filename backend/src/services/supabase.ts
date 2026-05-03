import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Env, ClientData } from '../types';

export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(env: Env) {
    // Menggunakan Service Role Key agar backend memiliki akses penuh untuk logic internal
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }

  // Mengambil konfigurasi client berdasarkan nomor WhatsApp
  async getClientByWaNumber(waNumber: string): Promise<ClientData | null> {
    const { data, error } = await this.supabase
      .from('clients')
      .select('id, business_name, system_prompt, human_takeover, is_active, gemini_api_key')
      .eq('whatsapp_number', waNumber)
      .single();

    if (error || !data) {
      console.error('Error fetching client:', error?.message);
      return null;
    }
    return data as ClientData;
  }

  // Mengelola histori percakapan dan menyimpan pesan
  async logMessage(
    clientId: string,
    customerNumber: string,
    content: string,
    senderType: 'customer' | 'ai' | 'human',
    responseTimeMs: number = 0
  ) {
    // 1. Cari atau buat conversation ID
    let { data: convData } = await this.supabase
      .from('conversations')
      .select('id')
      .eq('client_id', clientId)
      .eq('customer_number', customerNumber)
      .single();

    let conversationId = convData?.id;

    if (!conversationId) {
      const { data: newConv } = await this.supabase
        .from('conversations')
        .insert([{ client_id: clientId, customer_number: customerNumber }])
        .select('id')
        .single();
      
      if (newConv) conversationId = newConv.id;
    }

    if (!conversationId) return; // Fail-safe

    // 2. Insert pesan ke tabel messages
    await this.supabase.from('messages').insert([{
      conversation_id: conversationId,
      sender_type: senderType,
      content: content,
      response_time_ms: responseTimeMs
    }]);

    // 3. Update last_message_at di conversation
    await this.supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);
  }
}
