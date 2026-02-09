"use client";

import { AssistantWizard } from "@/components/seller/assistant-wizard";

export default function SellerAssistantPage() {
    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-6">Create Listing with AI</h1>
            <p className="text-muted-foreground mb-8">
                Upload a photo and answer a few questions. We'll handle the rest.
            </p>
            <AssistantWizard />
        </div>
    );
}
