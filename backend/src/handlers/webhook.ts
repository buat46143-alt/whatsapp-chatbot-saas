import { Env, WebhookPayload } from '../types';
import { SupabaseService } from '../services/supabase';
import { GeminiService } from '../services/gemini';

export async function handleWebhook(request: Request, env: Env): Promise<Response> {
  try {
    const payload: WebhookPayload = await request.json();

    // Validasi basic payload
    if (!payload.client_wa_number || !payload.customer_wa_number || !payload.message_content) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    const supabaseService = new SupabaseService(env);
    
    // 1. Dapatkan data client berdasarkan nomor WhatsApp bot
    const client = await supabaseService.getClientByWaNumber(payload.client_wa_number);

    if (!client) {
      return new Response(JSON.stringify({ error: "Client not found" }), { status: 404 });
    }

    // 2. Log pesan masuk dari customer ke database
    await supabaseService.logMessage(
      client.id, 
      payload.customer_wa_number, 
      payload.message_content, 
      'customer'
    );

    // 3. Cek status subscription & human takeover
    if (!client.is_active) {
      // Tidak di-reply, abaikan jika subscription mati
      return new Response(JSON.stringify({ reply: null, status: "inactive" }), { status: 200 });
    }

    if (client.human_takeover) {
      // Admin sedang mengambil alih, hentikan auto-reply AI secara instan
      return new Response(JSON.stringify({ reply: null, status: "human_takeover" }), { status: 200 });
    }

    // 4. Inisialisasi AI Service (Gunakan API Key client jika ada, jika tidak pakai default sistem)
    const apiKey = client.gemini_api_key || env.DEFAULT_GEMINI_API_KEY;
    const geminiService = new GeminiService(apiKey);

    // 5. Generate balasan AI
    const startTime = Date.now();
    const aiResponse = await geminiService.generateResponse(client.system_prompt, payload.message_content);
    const responseTimeMs = Date.now() - startTime;

    // 6. Log balasan AI ke database
    await supabaseService.logMessage(
      client.id, 
      payload.customer_wa_number, 
      aiResponse, 
      'ai',
      responseTimeMs
    );

    // 7. Kembalikan balasan ke VPS NodeLight untuk dikirim via Baileys
    return new Response(JSON.stringify({ reply: aiResponse }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}
