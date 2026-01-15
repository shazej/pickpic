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
    type: 'buyer_search' | 'seller_draft' | 'text' | 'error' | 'clarification' | 'gated_access';
    data: any;
    onAction?: (action: string, payload?: any) => void;
}

import { useLanguage } from "@/components/i18n/LanguageContext";

export function GenUiRenderer({ type, data, onAction }: GenUiRendererProps) {
    const { t } = useLanguage();

    if (type === 'buyer_search') {
        const results = data.results as BuyerResult[];
        if (!results || results.length === 0) return null;

        return (
            <div className="flex flex-col space-y-4 my-2">
                <div className="text-sm text-gray-500 mb-2">{t('buyer.search_found_msg')}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.map((item, index) => (
                        <Card
                            key={item.id}
                            className="w-full bg-white shadow-sm border-2 border-gray-100 hover:border-blue-100 transition-colors animate-in fade-in slide-in-from-top-2 duration-500"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-lg font-semibold truncate">{item.title}</CardTitle>
                                <div className="flex items-center text-sm text-gray-500">
                                    <MapPin className="w-3 h-3 me-1" />
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
                                    {t('buyer.view_details')}
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
            <Card className="w-full max-w-md my-4 border-l-4 border-l-blue-500 rtl:border-l-0 rtl:border-r-4 rtl:border-r-blue-500">
                <CardHeader>
                    <CardTitle className="text-lg">{t('seller.draft_title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">{t('seller.product_name')}</span>
                        <span className="font-medium">{draft.productName || '...'}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">{t('seller.price')}</span>
                        <span className="font-medium">{draft.price ? `$${draft.price}` : <span className="text-red-400">{t('seller.missing_label')}</span>}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">{t('seller.location')}</span>
                        <span className="font-medium">{draft.location || <span className="text-red-400">{t('seller.missing_label')}</span>}</span>
                    </div>
                    <div className="space-y-1 pt-2">
                        <span className="text-gray-500 block text-sm">{t('seller.description')}</span>
                        <p className="text-sm bg-gray-50 p-2 rounded">{draft.description || t('seller.no_description')}</p>
                    </div>

                    {!isReady && (
                        <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded flex items-start">
                            <AlertCircle className="w-4 h-4 me-2 mt-0.5 shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-semibold">{t('seller.missing_info')}</span>
                                <ul className="list-disc ps-4 mt-1">
                                    {draft.missingFields.map(field => <li key={field} className="capitalize">{field}</li>)}
                                </ul>
                            </div>
                        </div>
                    )}
                </CardContent>
                {isReady && (
                    <CardFooter>
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => onAction?.('publish', draft)}>
                            <CheckCircle className="w-4 h-4 me-2" />
                            {t('seller.confirm')}
                        </Button>
                    </CardFooter>
                )}
            </Card>
        );
    }

    if (type === 'clarification') {
        const { options } = data;
        return (
            <div className="flex flex-col space-y-3 my-2 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-sm font-medium text-gray-700">{t('common.clarify')}</div>
                <div className="flex flex-wrap gap-2">
                    {options?.map((opt: any, idx: number) => (
                        <Button
                            key={idx}
                            variant="outline"
                            className="bg-white hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                            onClick={() => onAction?.('send_message', opt.value)}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'gated_access') {
        const reason = data?.reason;
        return (
            <div className="flex flex-col space-y-3 my-2 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                <div className="text-sm font-medium text-red-800 dark:text-red-300">
                    {reason === 'auth' ? t('access.gated_title') : t('access.gated_msg')}
                </div>
                <div className="flex flex-wrap gap-2">
                    {reason === 'auth' && (
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => onAction?.('login')}
                        >
                            {t('auth.sign_in')}
                        </Button>
                    )}
                    {reason === 'credits' && (
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            onClick={() => onAction?.('buy_credits')}
                        >
                            {t('access.buy_credits')}
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return null;
}
