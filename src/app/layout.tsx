import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AlumniVerse Pro - Next-Generation Alumni Platform",
  description: "Revolutionary alumni networking platform featuring AI-powered matching, blockchain achievements, VR networking, and real-time analytics for modern educational institutions.",
  keywords: ["alumni", "networking", "AI", "blockchain", "VR", "education", "mentorship", "career"],
  authors: [{name: "AlumniVerse Team"}],
  creator: "AlumniVerse Pro",
  publisher: "AlumniVerse",
  robots: "index, follow",
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'AlumniVerse Pro',
    title: 'AlumniVerse Pro - Next-Generation Alumni Platform',
    description: 'Revolutionary alumni networking platform featuring AI-powered matching, blockchain achievements, VR networking, and real-time analytics.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'AlumniVerse Pro Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AlumniVerse Pro - Next-Generation Alumni Platform',
    description: 'Revolutionary alumni networking platform with AI, blockchain, and VR features.',
    images: ['/og-image.jpg'],
    creator: '@AlumniVersePro',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  category: 'education',
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
        {children}
      </body>
    </html>
  );
}
