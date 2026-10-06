import type { Metadata, Viewport } from 'next';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'Category Bet Desk · independent concept',
  description: 'A thesis-to-economics workbench for a new category bet on a B2B secondhand clothing marketplace. Independent concept by Ayomide Ahmed; not an official Fleek product.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f8c642' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
