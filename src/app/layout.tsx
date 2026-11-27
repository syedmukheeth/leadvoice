import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari, Noto_Sans_Telugu } from "next/font/google";
import "./globals.css";
import { CLIENT } from "@/lib/client";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const telugu = Noto_Sans_Telugu({ variable: "--font-telugu", subsets: ["telugu"] });
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"] });

export const metadata: Metadata = {
  title: { default: `${CLIENT.name} | ${CLIENT.portal}`, template: `%s | ${CLIENT.name}` },
  description: `${CLIENT.name} AI calling desk: Telugu, Hindi and English AI agents that call leads and book site visits.`,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${telugu.variable} ${devanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
