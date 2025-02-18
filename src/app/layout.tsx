import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import ViewportHandler from '@/components/ViewportHandler';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import NavBar from '@/components/NavBar';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Kantoku Kanji | TikTok-Style Kanji Learning',
  description: 'Learn Kanji with a fun, TikTok-style flashcard interface. Swipe through cards, test your knowledge, and improve your Japanese!',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-visual" />
        <meta name="supported-color-schemes" content="light" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link 
          rel="preload" 
          href="/kanji.csv" 
          as="fetch" 
          type="text/csv" 
          crossOrigin="anonymous"
          fetchPriority="high"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.querySelector('link[rel=preload][href="/kanji.csv"]').addEventListener('load', function() {
                this.loaded = true;
              });
            `
          }}
        />
      </head>
      <body className={`${inter.className} font-sans`}>
        <ViewportHandler />
        <ErrorBoundary>
          <NavBar />
          {children}
        </ErrorBoundary>
        <SpeedInsights />
      </body>
    </html>
  );
}
