# 🚀 Deployment Guide: Serverless WhatsApp Chatbot SaaS

Panduan lengkap untuk melakukan deployment sistem Chatbot SaaS (UMKM) ke infrastruktur production.

## 1. Setup Supabase (Database & Auth)
Sistem ini menggunakan Supabase Free Tier sebagai backend data utama.

1. Buat akun dan project baru di [Supabase](https://supabase.com/).
2. Pergi ke menu **SQL Editor**, salin isi dari file `database/schema.sql` dan jalankan (Run).
3. Jalankan juga `database/seed_data.sql` setelah memastikan Anda mendaftarkan satu email admin melalui menu **Authentication > Users** di dashboard Supabase.
4. Pergi ke **Project Settings > API**. Catat tiga nilai ini:
   - `Project URL`
   - `anon_public_key` (Untuk frontend)
   - `service_role_key` (Untuk Cloudflare Worker - JANGAN DIPUBLIKASIKAN)

## 2. Deploy Backend (Cloudflare Workers)
Logika utama dan koneksi Gemini AI berjalan di Cloudflare Workers.

1. Buka terminal, masuk ke folder `backend`.
2. Login ke Cloudflare menggunakan Wrangler:
   ```bash
   npx wrangler login
   ```
3. Tambahkan environment secrets ke Cloudflare (Jangan tulis key asli di wrangler.toml):
```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put DEFAULT_GEMINI_API_KEY
```
4. Deploy ke production:
```bash
npm run deploy
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```
5. Setelah sukses, Cloudflare akan memberikan URL Worker (misal: https://whatsapp-chatbot-saas...workers.dev). Catat URL ini, tambahkan /webhook di akhirnya.

## 3. Deploy Frontend Dashboard (Vercel atau Cloudflare Pages)
Aplikasi Next.js untuk Admin panel dan Client panel.

1. Masuk ke folder frontend.
2. Buat file .env.local dan masukkan:
```code snippet
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```
3. Push code ini ke GitHub.
4. Buka Vercel (atau Cloudflare Pages), import repository GitHub Anda.
5. Masukkan variabel environment yang sama di setting Vercel.
6. Klik Deploy.

## 4. Deploy WhatsApp Bridge (NodeLight VPS)
Skrip Baileys yang menjembatani serverless webhook dengan WhatsApp Device UMKM.

1. Pesan NodeLight VPS (atau VPS Ubuntu murah seperti DigitalOcean Droplet $4/bulan).
2. SSH ke VPS Anda.
3. Install Node.js dan PM2 (Process Manager):
```bash
curl -fsSL [https://deb.nodesource.com/setup_20.x](https://deb.nodesource.com/setup_20.x) | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2 typescript ts-node
```
4. Upload/Clone folder vps-bridge ke VPS.
5. Masuk ke folder tersebut dan install dependency:
```bash
npm install
```
6. Buat file .env di dalam folder tersebut:
```Code snippet
WEBHOOK_URL=https://<URL_CLOUDFLARE_WORKER_ANDA>/webhook
CLIENT_WA_NUMBER=62812xxxx (Nomor WA UMKM)
```
7. Jalankan script pertama kali untuk Scan QR Code:
```bash
npm run start
```
8. Minta client (UMKM) membuka WhatsApp > Linked Devices > Scan QR yang muncul di terminal.
9. Setelah ✅ Berhasil terhubung, matikan proses (Ctrl+C).
10. Jalankan dengan PM2 agar jalan 24/7 di background walau terminal ditutup:
```bash
npm run build
pm2 start dist/index.js --name "wa-bridge-client1"
pm2 save
```
# Menambahkan Client Baru (Multi-tenant scaling)
Karena kita menggunakan Baileys, setiap nomor WA client harus diproses di instance Node.js terpisah (atau disatukan dalam satu script master multi-session).
Untuk versi simpel di VPS ini:
- Copy folder vps-bridge
- ubah .env (ganti nomor WA-nya)
- jalankan npm install
- scan QR untuk nomor ke-2
- lalu jalankan instance baru pm2 start dist/index.js --name "wa-bridge-client2".

**Sistem sekarang sepenuhnya berjalan.
Pesan masuk ke HP UMKM -> ditangkap Baileys di VPS -> dikirim ke Cloudflare Worker -> diproses Gemini -> direkam ke Supabase -> dikirim balik ke HP pelanggan UMKM.**

---

### Project Finalization Summary

You now possess the entire architecture and code for an enterprise-ready WhatsApp Chatbot SaaS:

1.  **Supabase PostgreSQL (Database):** Engineered for multi-tenancy with strict Row Level Security to protect individual client analytics.
2.  **Cloudflare Workers (Backend API):** A purely stateless, highly scalable, zero-maintenance API layer operating Google Gemini-2.5-flash-lite prompt engineering seamlessly.
3.  **Next.js (Frontend Dashboard):** An aesthetically clean, modern responsive App Router dashboard integrating robust authentication, state toggles, and Recharts.
4.  **NodeLight VPS Baileys (Bridge):** A resilient WhatsApp Web protocol connection holding state, processing event loops without requiring official Meta Developer API verification.

The system meets every specific constraint, utilizes best-practice typed validation, and avoids any placeholder code.
You can initialize this by following the steps provided in `docs/DEPLOYMENT.md`.
