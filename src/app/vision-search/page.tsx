'use client';

import SimilarProductsChat from '@/components/similar-products-chat';

export default function VisionSearchPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col">
          <SimilarProductsChat />
        </div>
      </main>
    </div>
  );
}
