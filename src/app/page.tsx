"use client";

import { Package2 } from 'lucide-react';
import ProductFinder from "@/components/product-finder";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-background font-body text-foreground">
       <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Package2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-headline">See & Seek</span>
        </div>
      </header>

      <main className="flex justify-center items-start pt-10">
        <div className="w-full max-w-lg">
          <ProductFinder />
        </div>
      </main>
    </div>
  );
}
