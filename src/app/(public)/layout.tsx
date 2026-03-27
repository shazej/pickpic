import "@/lib/polyfill";
import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
const inter = { variable: '' };

export const metadata: Metadata = {
  title: 'Ecomm Now',
  description: 'Upload an image to find products sold by nearby sellers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <LocationProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </LocationProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
