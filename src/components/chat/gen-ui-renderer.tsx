"use client";

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, DollarSign, CheckCircle, AlertCircle } from "lucide-react";

// Types matching the AI Flow Schemas
type BuyerResult = {
    id: string;
    title: string;
    price: number;
    location: string;
    imageUrl?: string;
};

type SellerListing = {
    productName: string;
    price?: number;
    description?: string;
    location?: string;
    category?: string;
    confidence: number;
    missingFields: string[];
};

interface GenUiRendererProps {
    type: 'buyer_search' | 'seller_draft' | 'text' | 'error';
    data: any;
    onAction?: (action: string, payload?: any) => void;
}

export function GenUiRenderer({ type, data, onAction }: GenUiRendererProps) {
    if (type === 'buyer_search') {
        const results = data.results as BuyerResult[];
        if (!results || results.length === 0) return null;

        return (
            <div className="flex flex-col space-y-4 my-2">
                <div className="text-sm text-gray-500 mb-2">I found a few items for you:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.map((item) => (
                        <Card key={item.id} className="w-full bg-white shadow-sm border-2 border-gray-100 hover:border-blue-100 transition-colors">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-lg font-semibold truncate">{item.title}</CardTitle>
                                <div className="flex items-center text-sm text-gray-500">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {item.location}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-2">
                                {item.imageUrl ? (
                                    <div className="relative w-full h-32 mb-2 bg-gray-100 rounded-md overflow-hidden">
                                        <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full" />
                                    </div>
                                ) : (
                                    <div className="w-full h-32 mb-2 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                                        No Image
                                    </div>
                                )}
                                <div className="text-xl font-bold text-green-600">${item.price}</div>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                                <Button
                                    className="w-full" variant="outline"
                                    onClick={() => onAction?.('view_details', item.id)}
                                >
                                    View Details
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'seller_draft') {
        const draft = data as SellerListing;
        const isReady = draft.confidence > 0.8 && draft.missingFields.length === 0;

        return (
            <Card className="w-full max-w-md my-4 border-l-4 border-l-blue-500">
                <CardHeader>
                    <CardTitle className="text-lg">Draft Listing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Product</span>
                        <span className="font-medium">{draft.productName || '...'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Price</span>
                        <span className="font-medium">{draft.price ? `$${draft.price}` : <span className="text-red-400">Missing</span>}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Location</span>
                        <span className="font-medium">{draft.location || <span className="text-red-400">Missing</span>}</span>
                    </div>
                    <div className="space-y-1 pt-2">
                        <span className="text-gray-500 block text-sm">Description</span>
                        <p className="text-sm bg-gray-50 p-2 rounded">{draft.description || 'No description provided.'}</p>
                    </div>

                    {!isReady && (
                        <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded flex items-start">
                            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-semibold">Missing Information:</span>
                                <ul className="list-disc pl-4 mt-1">
                                    {draft.missingFields.map(field => <li key={field} className="capitalize">{field}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}
                </CardContent>
                {isReady && (
                    <CardFooter>
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => onAction?.('publish', draft)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirm & Publish
                        </Button>
                    </CardFooter>
                )}
            </Card>
        );
    }

    return null;
}
