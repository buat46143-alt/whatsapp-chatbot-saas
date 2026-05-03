import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaaS WhatsApp Chatbot",
  description: "Dashboard panel untuk manajemen Chatbot UMKM",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
