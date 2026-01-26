import type { Metadata } from "next";
import { Poppins, Space_Grotesk, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import "./mobile.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Header from '@/components/Header';

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Beautify.AI - Преврати фото в 3D",
  description: "AI-powered photo transformation to 3D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${poppins.variable} ${spaceGrotesk.variable} ${playfair.variable} ${inter.variable}`} style={{ fontFamily: "var(--font-inter)", background: 'linear-gradient(135deg, #FFE5E5 0%, #FFD4E5 25%, #FFF0F5 50%, #E8D5F2 75%, #E0E8FF 100%)', paddingTop: '20px' }}>
        <LanguageProvider>
          <Header />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
