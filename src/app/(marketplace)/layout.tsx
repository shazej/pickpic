import "@/lib/polyfill";
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LocationProvider } from '@/hooks/use-location';
import { AuthProvider } from '@/context/auth-context';
import { ReactNode } from 'react';
import { Navbar } from "@/components/navbar/Navbar";
import { Footer } from "@/components/layout/footer";
import { ChatWidget } from '@/components/chat/chat-widget';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Ecomm Now',
  description: 'Upload an image to find products sold by nearby sellers.',
};

export default function MarketplaceLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <LocationProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <ChatWidget />
      </div>
    </LocationProvider>
  );
}
