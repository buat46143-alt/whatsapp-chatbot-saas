# 🤖 WhatsApp Chatbot SaaS for UMKM

A complete, multi-tenant Serverless WhatsApp Chatbot platform designed specifically for Indonesian UMKM (Small and Medium Enterprises). Powered by Google Gemini AI and Supabase.

## 🌟 Key Features
- **Multi-Tenant Architecture**: Manage multiple UMKM clients from a single admin dashboard.
- **AI Customer Service**: Automated, intelligent 24/7 replies in formal/casual Bahasa Indonesia using Google Gemini-2.5-flash-lite.
- **Instant Human Takeover**: Clients can instantly halt AI responses to manually handle complex customer queries.
- **Serverless Webhook Hub**: Built on Cloudflare Workers for zero-maintenance scaling and sub-millisecond routing.
- **Device-Independent Bridge**: Utilizes a lightweight NodeLight VPS running `@whiskeysockets/baileys` so the client's phone does not need to stay online continuously.
- **Real-time Analytics**: Next.js and Recharts dashboard tracking AI vs. Human handling metrics.

## 🏗️ System Architecture
1. **Frontend (`/frontend`)**: Next.js 14 App Router, TailwindCSS, Supabase Auth.
2. **Backend (`/backend`)**: Cloudflare Workers (TypeScript) handling Webhooks & AI routing.
3. **VPS Bridge (`/vps-bridge`)**: Node.js instance keeping persistent connection to WhatsApp Web.
4. **Database (`/database`)**: PostgreSQL via Supabase with strict Row Level Security (RLS).

## 🚀 Quick Start
Please refer to `DEPLOYMENT.md` for the step-by-step guide to deploying this system to production.

## 🔒 Security Posture
- **No Hardcoded Secrets**: All API keys and database tokens are stored securely in Cloudflare Secrets and `.env` files.
- **Data Isolation**: Supabase RLS guarantees that UMKM Client A cannot read the chat history or analytics of UMKM Client B.
- **Webhook Integrity**: Data transferred between the VPS Bridge and the Cloudflare Worker requires strict payload validation.

---
*Built for the Indonesian UMKM ecosystem.*
