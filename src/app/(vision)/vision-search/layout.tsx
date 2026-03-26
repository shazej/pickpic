
import "@/lib/polyfill";
import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
const inter = { variable: '' };

export const metadata: Metadata = {
  title: 'Visual Search | Ecomm Now',
  description: 'Search for products by uploading an image.',
};

export default function VisionSearchLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased`} suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
