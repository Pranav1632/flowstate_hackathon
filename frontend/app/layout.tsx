import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecallGuard — AI Product Recall & Supply Chain Safety Agent",
  description: "Detect product recalls, halt affected shipments, and enforce ArmorIQ cryptographic policy boundaries.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-indigo-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
