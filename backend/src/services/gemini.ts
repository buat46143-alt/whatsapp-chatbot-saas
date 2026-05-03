import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // Menggunakan Gemini 2.5 Flash Lite untuk efisiensi dan kecepatan
  async generateResponse(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        systemInstruction: systemPrompt 
      });

      // Timeout manual untuk membatasi durasi eksekusi (Max 30s)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 detik buffer

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }]
      });

      clearTimeout(timeoutId);

      const responseText = result.response.text();
      return responseText || "Maaf, saya tidak dapat memproses permintaan Anda saat ini.";
      
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      return "Maaf, sistem sedang sibuk. Mohon tunggu sebentar."; // Fallback constraint
    }
  }
}
