# 🔌 API Documentation

This document outlines the internal communication interfaces between the NodeLight VPS Bridge and the Cloudflare Worker Backend.

## 1. Webhook Endpoint (VPS to Cloudflare Worker)

This is the primary route where the WhatsApp Bridge sends incoming messages from customers to the AI brain.

* **URL:** `https://<YOUR_CLOUDFLARE_WORKER_URL>/webhook`
* **Method:** `POST`
* **Headers:**
    * `Content-Type: application/json`

### Request Payload
```json
{
  "client_wa_number": "6281234567890", 
  "customer_wa_number": "6289876543210",
  "message_content": "Halo min, apakah produk ini masih tersedia?"
}
```
*Note: Numbers must not contain the + prefix or spaces.*

# Success Response (AI Handled)
- Code: 200 OK
- Body:
```json
{
  "reply": "Halo Kak! Ya, produk tersebut saat ini masih tersedia. Ada yang bisa saya bantu untuk proses pemesanannya?",
  "status": "success"
}
```
# Success Response (Human Takeover Active)
-Code: 200 OK
- Body:
```json
{
  "reply": null,
  "status": "human_takeover"
}
```
*Note: The VPS bridge will silently acknowledge this and will not send any reply to the customer, allowing the UMKM owner to reply manually.*

# Success Response (Subscription Inactive)
- Code: 200 OK
- Body:
```json
{
  "reply": null,
  "status": "inactive"
}
```

# Error Responses
- Code: 400 Bad Request (Missing payload fields)
- Code: 404 Not Found (Client WhatsApp number not registered in Database)
- Code: 500 Internal Server Error (Gemini API timeout or Supabase connection failure)

## 2. Supabase Realtime Channels (Frontend)
The frontend Next.js application subscribes to Supabase Realtime channels to instantly update the UI without needing to refresh the page.

- Channel: public:messages
- Events Listened: INSERT
- Purpose: To update the "Total Messages" count on the Client Dashboard instantly when the Webhook successfully logs a new message to the database.

## 3. Gemini Prompt Injection Format
The system dynamically constructs the AI prompt using the system_prompt field from the clients table.
The Cloudflare worker injects it into the Gemini API request as follows:
```Typescript
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash-lite",
    systemInstruction: client.system_prompt 
});
```
*Constraints Enforced: The system instruction inherently instructs the AI to adhere to maximum 3 paragraphs, 1-2 emojis, and polite formal-casual Bahasa Indonesia.*
