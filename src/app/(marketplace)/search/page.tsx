
"use client";

import { Suspense } from 'react';
import { MultimodalTabs } from '@/components/search/multimodal-tabs';

export const dynamic = 'force-dynamic';

function SearchContent() {
    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Find Products</h1>
            <p className="text-center text-muted-foreground mb-8">
                Search using text, voice, or video.
            </p>
            <MultimodalTabs />
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="container py-8">Loading search...</div>}>
            <SearchContent />
        </Suspense>
    );
}
