'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SimilarProductsChat from '@/components/similar-products-chat';

export default function VisionSearchPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
       <header className="flex h-16 items-center border-b px-4 shrink-0">
        <nav className="flex items-center gap-4 text-lg font-medium md:gap-2 md:text-sm lg:gap-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="font-semibold text-lg">Visual Search</h1>
        </nav>
      </header>
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col p-4">
          <SimilarProductsChat />
        </div>
      </main>
    </div>
  );
}
