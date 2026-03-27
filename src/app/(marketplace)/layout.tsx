import "@/lib/polyfill";
export const dynamic = "force-dynamic";
import type { Metadata } from 'next';
import { LocationProvider } from "@/hooks/use-location";
import { AppShell } from "./app-shell";

export const metadata: Metadata = {
  title: 'Monetchat - AI Marketplace',
  description: 'Chat with AI to find and buy products. Upload images, use voice, or just type what you need.',
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocationProvider>
      <AppShell>{children}</AppShell>
    </LocationProvider>
  );
}
