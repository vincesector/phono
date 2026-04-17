import type { Metadata } from "next";
import { JetBrains_Mono, VT323 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const display = VT323({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Phono TTS",
  description:
    "Free, open-source text-to-speech that runs entirely in your browser. No signup. No upload. No bullshit.",
  openGraph: {
    title: "Phono TTS",
    description: "BROWSER-NATIVE TEXT TO SPEECH. ZERO COST.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@0xEvinho",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${mono.variable} ${display.variable}`}>
      <body className="min-h-screen bg-paper text-ink font-mono antialiased selection:bg-ink selection:text-paper">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
