import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'טכנולוגי ב"ש | Techni Be\'er Sheva',
  description: 'הרשת החברתית של תלמידי הטכנולוגי באר שבע',
  keywords: ['טכנולוגי', 'באר שבע', 'תלמידים', 'רשת חברתית'],
  robots: 'noindex, nofollow', // Private school network - don't index
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className={`${heebo.variable} font-sans bg-brand-silver min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
