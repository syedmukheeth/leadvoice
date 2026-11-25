import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono, Noto_Sans_Devanagari, Noto_Sans_Telugu, Onest } from "next/font/google";
import "./globals.css";

const onest = Onest({ variable: "--font-onest", subsets: ["latin"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });
const telugu = Noto_Sans_Telugu({ variable: "--font-telugu", subsets: ["telugu"] });
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"] });

export const metadata: Metadata = {
  title: { default: "LeadVoice", template: "%s · LeadVoice" },
  description: "AI telecallers that speak Telugu, Hindi and English — and get work done on every call.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${onest.variable} ${instrument.variable} ${jetbrains.variable} ${telugu.variable} ${devanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
