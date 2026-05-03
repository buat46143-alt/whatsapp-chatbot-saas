import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import axios from 'axios';
import pino from 'pino';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Endpoint Cloudflare Worker Anda (Contoh: https://api.namadomain.workers.dev/webhook)
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
// Nomor WhatsApp UMKM (Sesuai dengan yang didaftarkan di dashboard)
const CLIENT_WA_NUMBER = process.env.CLIENT_WA_NUMBER || '';

async function connectToWhatsApp() {
    // Menyimpan sesi login agar tidak perlu scan QR setiap kali restart
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    // Inisialisasi koneksi WhatsApp
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }) // Matikan log bawaan yang terlalu ramai
    });

    // Event listener untuk menyimpan kredensial login
    sock.ev.on('creds.update', saveCreds);

    // Event listener untuk status koneksi (QR Code, Disconnect, Reconnect)
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n[!] Silakan scan QR Code di atas menggunakan aplikasi WhatsApp Bisnis UMKM.\n');
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus karena:', lastDisconnect?.error, ', mencoba reconnect:', shouldReconnect);
            
            // Reconnect secara otomatis jika bukan karena di-logout manual
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✅ Berhasil terhubung ke WhatsApp!');
        }
    });

    // Event listener untuk pesan masuk
    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            
            // Abaikan jika pesan dikirim oleh bot itu sendiri (mencegah loop)
            // Abaikan juga pesan dari group (broadcast/status)
            if (!msg.message || msg.key.fromMe || msg.key.remoteJid?.includes('@g.us') || msg.key.remoteJid === 'status@broadcast') {
                return;
            }

            // Ekstrak nomor pengirim dan isi teks
            const customerNumber = msg.key.remoteJid?.split('@')[0] || '';
            const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text;

            if (!messageContent) return; // Abaikan pesan non-teks (gambar/video) sementara

            console.log(`\n[📥 PESAN MASUK] Dari: ${customerNumber} | Isi: ${messageContent}`);

            // 1. Kirim data ke Cloudflare Worker Webhook
            const payload = {
                client_wa_number: CLIENT_WA_NUMBER,
                customer_wa_number: customerNumber,
                message_content: messageContent
            };

            const response = await axios.post(WEBHOOK_URL, payload, {
                headers: { 'Content-Type': 'application/json' }
            });

            // 2. Tangani balasan berdasarkan status dari Webhook
            const { reply, status, error } = response.data;

            if (error) {
                console.error('[❌ ERROR DARI SERVERLESS]:', error);
                return;
            }

            if (status === 'human_takeover') {
                console.log('[👨‍💻 HUMAN TAKEOVER] Mode manual aktif. AI tidak membalas otomatis.');
                return;
            }

            if (status === 'inactive') {
                console.log('[⚠️ INACTIVE] Langganan UMKM nonaktif. Pesan diabaikan.');
                return;
            }

            // 3. Jika ada balasan dari AI, kirim kembali via WhatsApp
            if (reply && msg.key.remoteJid) {
                console.log(`[🤖 BALASAN AI] Ke: ${customerNumber} | Isi: ${reply}`);
                
                // Jeda simulasi mengetik (opsional, untuk UX lebih natural)
                await sock.presenceSubscribe(msg.key.remoteJid);
                await sock.sendPresenceUpdate('composing', msg.key.remoteJid);
                await new Promise(resolve => setTimeout(resolve, 1500));
                await sock.sendPresenceUpdate('paused', msg.key.remoteJid);

                // Kirim pesan balasan
                await sock.sendMessage(msg.key.remoteJid, { text: reply }, { quoted: msg });
            }

        } catch (error) {
            console.error('[❌ ERROR SYSTEM]:', error);
        }
    });
}

// Mulai aplikasi
connectToWhatsApp();
