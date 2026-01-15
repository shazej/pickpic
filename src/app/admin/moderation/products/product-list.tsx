"use client";

import { useState } from "react";
import { updateProductModeration, ModerationStatus } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Check, X, AlertTriangle } from "lucide-react";
import Image from "next/image";

interface ProductModerationListProps {
    products: any[];
    status: ModerationStatus;
}

export function ProductModerationList({ products, status }: ProductModerationListProps) {
    const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());

    const handleAction = async (id: string, action: ModerationStatus) => {
        setSubmittingIds(prev => new Set(prev).add(id));
        await updateProductModeration(id, action);
        setSubmittingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    if (products.length === 0) {
        return <div className="p-8 text-center text-muted-foreground w-full">No products found in this queue.</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-800">
                        {product.image_url ? (
                            <Image
                                src={product.image_url}
                                alt={product.title}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">No Image</div>
                        )}
                    </div>
                    <CardContent className="p-4">
                        <h3 className="font-semibold truncate">{product.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{product.store_name}</p>
                        <p className="font-bold">{product.currency} {product.price}</p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 gap-2 flex justify-between">
                        {status === 'PENDING' || status === 'FLAGGED' ? (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-green-200 text-green-600 hover:bg-green-50"
                                    onClick={() => handleAction(product.id, 'APPROVED')}
                                    disabled={submittingIds.has(product.id)}
                                >
                                    <Check className="w-4 h-4 mr-1" /> Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => handleAction(product.id, 'REJECTED')}
                                    disabled={submittingIds.has(product.id)}
                                >
                                    <X className="w-4 h-4 mr-1" /> Reject
                                </Button>
                            </>
                        ) : (
                            <div className="w-full text-center text-sm text-muted-foreground py-2 italic">
                                Action taken
                            </div>
                        )}
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
