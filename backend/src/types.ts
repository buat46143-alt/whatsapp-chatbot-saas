// Interface untuk Environment Variables di Cloudflare Workers
export interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  DEFAULT_GEMINI_API_KEY: string; 
}

// Payload webhook yang dikirim oleh NodeLight VPS (Baileys)
export interface WebhookPayload {
  client_wa_number: string;   // Nomor WhatsApp UMKM (Client)
  customer_wa_number: string; // Nomor WhatsApp Customer
  message_content: string;    // Isi pesan dari customer
}

// Interface data Client dari database
export interface ClientData {
  id: string;
  business_name: string;
  system_prompt: string;
  human_takeover: boolean;
  is_active: boolean;
  gemini_api_key: string | null;
}
