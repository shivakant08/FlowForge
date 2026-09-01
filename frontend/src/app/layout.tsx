import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "sonner";
import React from "react";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });



// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'FlowForge | Double-Entry Accounting Platform',
  description: 'Enterprise ledger and automated bank reconciliation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={inter.variable}
    >
      <body className="font-sans antialiased bg-slate-950 text-slate-100">
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster theme="dark" position="top-right" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
