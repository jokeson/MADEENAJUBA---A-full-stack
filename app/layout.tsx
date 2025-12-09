import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import NavbarWrapper from "@/components/NavbarWrapper";
import ErrorSuppressor from "@/components/ErrorSuppressor";
import ServerActionErrorHandler from "@/components/ServerActionErrorHandler";
import ToastProvider from "@/components/ToastProvider";

/**
 * Geist Sans Font Configuration
 * 
 * Preload enabled for better performance and reduced layout shift.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: true, // Enable preload for faster font loading
  display: "swap", // Use swap to prevent invisible text during font load
});

/**
 * Geist Mono Font Configuration
 * 
 * Preload enabled for better performance and reduced layout shift.
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: true, // Enable preload for faster font loading
  display: "swap", // Use swap to prevent invisible text during font load
});

export const metadata: Metadata = {
  title: {
    default: "MADEENAJUBA - City Portal",
    template: "%s | MADEENAJUBA",
  },
  description: "MADEENAJUBA is a comprehensive city portal that seamlessly integrates multiple services into a single authenticated web application.",
  keywords: ["city portal", "e-wallet", "Kilimanjaro", "MADEENAJUBA", "community", "events", "news"],
  authors: [{ name: "MADEENAJUBA" }],
  creator: "MADEENAJUBA",
  publisher: "MADEENAJUBA",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://madeenajuba.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "MADEENAJUBA - City Portal",
    description: "MADEENAJUBA is a comprehensive city portal that seamlessly integrates multiple services into a single authenticated web application.",
    siteName: "MADEENAJUBA",
  },
  twitter: {
    card: "summary_large_image",
    title: "MADEENAJUBA - City Portal",
    description: "MADEENAJUBA is a comprehensive city portal that seamlessly integrates multiple services into a single authenticated web application.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
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
        <ServerActionErrorHandler />
        <ToastProvider />
        <AuthProvider>
          <NavbarWrapper />
          <main className="w-full overflow-x-hidden">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

