import type { Metadata } from 'next';
import {
  Inter,
  Noto_Sans_Devanagari,
  Tiro_Devanagari_Hindi,
  Fraunces,
} from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari', 'latin'],
  variable: '--font-devanagari',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const tiroDevanagari = Tiro_Devanagari_Hindi({
  subsets: ['devanagari', 'latin'],
  variable: '--font-tiro',
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['SOFT', 'opsz'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'आवाज़ • Awaaz — Voice-First Government Scheme Navigator',
  description:
    'अपनी बात बताइए, हम आपकी मदद करेंगे — Speak your situation in Hindi, and discover Indian government welfare schemes you qualify for.',
  metadataBase: new URL('https://awaaz.vercel.app'),
  openGraph: {
    title: 'आवाज़ • Awaaz',
    description: 'Voice-first government scheme navigator for rural Indian women',
    locale: 'hi_IN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="hi"
      className={`${inter.variable} ${devanagari.variable} ${tiroDevanagari.variable} ${fraunces.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
