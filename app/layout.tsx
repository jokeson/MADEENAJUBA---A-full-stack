import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import NavbarWrapper from "@/components/NavbarWrapper";
import ErrorSuppressor from "@/components/ErrorSuppressor";
import ToastProvider from "@/components/ToastProvider";

/**
 * Geist Sans Font Configuration
 * 
 * Configured with preload: false to prevent preload warnings when fonts
 * are not used immediately. The fonts are still loaded when needed.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false, // Disable preload to prevent warnings when font is not used immediately
  display: "swap", // Use swap to prevent invisible text during font load
});

/**
 * Geist Mono Font Configuration
 * 
 * Configured with preload: false to prevent preload warnings when fonts
 * are not used immediately. The fonts are still loaded when needed.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false, // Disable preload to prevent warnings when font is not used immediately
  display: "swap", // Use swap to prevent invisible text during font load
});

export const metadata: Metadata = {
  title: "MADEENAJUBA - City Portal",
  description: "MADEENAJUBA is a comprehensive city portal that seamlessly integrates multiple services into a single authenticated web application.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  other: {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorSuppressor />
        <ToastProvider />
        <AuthProvider>
          <NavbarWrapper />
          <main>
          {children}
          </main>
        
        </AuthProvider>
      </body>
    </html>
  );
}

