import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ScrollToTop } from "@/components/ScrollToTop";
import { CampusFixAI } from "@/components/CampusFixAI";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";
import { ReadAloudButton } from "@/components/ReadAloudButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CampusFix | Smart Campus Issue & Maintenance Portal",
  description: "Centralized campus issue reporting, community upvoting, and maintenance workflow platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
        {children}
        <CampusFixAI />
        <AccessibilityPanel />
        <ReadAloudButton />
        <ScrollToTop />
      </body>
    </html>
  );
}
