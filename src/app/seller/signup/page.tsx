'use client';

import Link from 'next/link';
import { ArrowLeft, Package2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SellerAuthCard } from '@/components/seller-auth-card';

export default function SellerSignupPage() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
       <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
        <Button variant="ghost" size="icon" asChild>
            <Link href="/">
                <ArrowLeft />
            </Link>
        </Button>
        <div className="flex items-center gap-2 font-semibold">
          <Package2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-headline">See & Seek</span>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <SellerAuthCard
          title="Create Seller Account"
          description="Fill out the form to start selling on our platform."
          buttonText="Sign Up"
          footerText="Already have a seller account?"
          footerLink="/seller/login"
          footerLinkText="Log In"
        />
      </main>
    </div>
  );
}
