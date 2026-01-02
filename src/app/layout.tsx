import type { Metadata } from 'next';
import { Fuzzy_Bubbles } from 'next/font/google';
import './globals.css';

const fuzzyBubbles = Fuzzy_Bubbles({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Silly Tetris - Free Online Tetris Game | Play Now in Your Browser',
  description: 'Play Silly Tetris for free! Classic block-stacking puzzle game with modern controls. No download required - play instantly in your browser with arrow keys or WASD.',
  keywords: [
    'tetris',
    'tetris game',
    'online tetris',
    'free tetris',
    'browser tetris',
    'play tetris',
    'tetris online free',
    'block puzzle',
    'puzzle game',
    'silly tetris',
    'tetris browser game',
    'tetris no download'
  ],
  authors: [{ name: 'SillyDev', url: 'https://sillydev.co.uk' }],
  creator: 'SillyDev',
  publisher: 'SillyDev',
  applicationName: 'Silly Tetris',
  category: 'games',
  openGraph: {
    title: 'Silly Tetris - Free Online Tetris Game',
    description: 'Play classic Tetris for free in your browser! Stack blocks, clear lines, and beat your high score. No download needed.',
    images: [
      {
        url: 'https://sillydev.co.uk/assets/images/logo-sillydev-circle.png',
        width: 512,
        height: 512,
        alt: 'Silly Tetris Game',
      },
    ],
    url: 'https://tetris.sillydev.co.uk',
    type: 'website',
    siteName: 'Silly Tetris',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Silly Tetris - Free Online Tetris Game',
    description: 'Play classic Tetris for free in your browser! Stack blocks, clear lines, and beat your high score.',
    images: ['https://sillydev.co.uk/assets/images/logo-sillydev-circle.png'],
  },
  icons: {
    shortcut: '/icon.png',
    icon: '/icon.png',
    apple: '/icon.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-token', // Add your token if needed
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Silly Tetris',
    description: 'Free online Tetris game. Play classic block-stacking puzzle game in your browser.',
    url: 'https://tetris.sillydev.co.uk',
    applicationCategory: 'GameApplication',
    genre: 'Puzzle',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'SillyDev',
      url: 'https://sillydev.co.uk',
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          defer
          src="https://tracking.sillydev.co.uk/script.js"
          data-website-id="d7584303-5428-40ba-b942-e38443429cf8"
        ></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={fuzzyBubbles.className}>{children}</body>
    </html>
  );
}
