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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Comment Extractor',
    description: 'Extract highlights, sticky notes, and editorial marks from PDFs into structured Markdown or plain text.',
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
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
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
            }),
          }}
        />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
