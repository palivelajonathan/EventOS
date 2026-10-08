import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EventOS — The Operating System for Modern Events",
    template: "%s | EventOS",
  },
  description:
    "From registration data to the final certificate, EventOS gives organizers one intelligent platform to run the entire event with surgical precision.",
  keywords: [
    "event management",
    "college fest",
    "hackathon",
    "conference",
    "QR check-in",
    "attendee management",
    "certificate generation",
  ],
  authors: [{ name: "EventOS" }],
  openGraph: {
    title: "EventOS — The Operating System for Modern Events",
    description:
      "One intelligent platform to run the entire event with surgical precision.",
    type: "website",
  },
};

import { AuthProvider } from "@/lib/auth/authContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Google Material Symbols Outlined — used throughout Stitch UI */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geist.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}
        style={{
          fontFamily: "var(--font-geist), sans-serif",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-on-surface)",
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
