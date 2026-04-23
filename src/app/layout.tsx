/**
 * Root layout: global SEO metadata, JSON-LD structured data, and the HTML shell.
 * Rendered around every route in the app.
 */

import type { Metadata } from 'next';
import './globals.css';

const siteUrl = 'https://pdfcomments.app';

export const metadata: Metadata = {
  title: 'PDF Comment Extractor - Extract Editorial Feedback & Design Comments',
  description: 'Extract editorial comments, design feedback, and review annotations from PDFs into structured Markdown or plain text. 100% private, client-side processing.',
  keywords: ['PDF', 'annotations', 'comments', 'highlights', 'sticky notes', 'markdown', 'extract', 'editorial', 'feedback', 'design review'],
  authors: [{ name: 'Landon Miles' }],
  creator: 'Landon Miles',
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'PDF Comment Extractor',
    title: 'PDF Comment Extractor - Extract Editorial Feedback & Design Comments',
    description: 'Extract highlights, sticky notes, and editorial marks from PDFs into structured Markdown or plain text. 100% private, client-side processing.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PDF Comment Extractor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Comment Extractor',
    description: 'Extract highlights, sticky notes, and editorial marks from PDFs into structured Markdown or plain text.',
    images: ['/og-image.png'],
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // Escape `<` so a future value containing `</script>` can never
            // break out of the surrounding <script> element.
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'PDF Comment Extractor',
              description: 'Extract editorial comments, design feedback, and review annotations from PDFs into structured Markdown or plain text.',
              url: siteUrl,
              applicationCategory: 'Utility',
              operatingSystem: 'Any',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              featureList: [
                'Extract highlights from PDFs',
                'Extract sticky notes',
                'Extract strikethroughs and underlines',
                'Export to Markdown',
                '100% client-side processing',
                'No data uploaded to servers',
              ],
            }).replace(/</g, '\\u003c'),
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
