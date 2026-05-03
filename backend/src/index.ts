import { Env } from './types';
import { handleWebhook } from './handlers/webhook';

// Cloudflare Workers Fetch Handler
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Routing dasar
    if (request.method === 'POST' && url.pathname === '/webhook') {
      return await handleWebhook(request, env);
    }

    // Health check endpoint
    if (request.method === 'GET' && url.pathname === '/health') {
      return new Response("OK - System is running", { status: 200 });
    }

    // Fallback untuk route yang tidak ditemukan
    return new Response("Not Found", { status: 404 });
  },
};
