
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Phone, MessageCircle, MapPin } from 'lucide-react';
import { ProductResult } from '@/types/schemas';

interface ProductCardProps {
  product: ProductResult;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden w-full max-w-sm hover:shadow-lg transition-shadow bg-card/60 backdrop-blur-sm border-primary/20">
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={product.imageUrl || '/placeholder-image.jpg'}
          alt={product.title}
          fill
          className="object-cover"
        />
        {product.condition && (
          <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white border-0">
            {product.condition}
          </Badge>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg line-clamp-2 leading-tight">{product.title}</h3>
          <p className="font-bold text-primary whitespace-nowrap ml-2">
            {product.price} <span className="text-xs text-muted-foreground">{product.currency}</span>
          </p>
        </div>

        {product.location && (
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1" />
            {product.location}
          </div>
        )}

        <div className="pt-2 flex gap-2">
          {product.sellerContact?.whatsapp && (
            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 h-9" asChild>
              <a
                href={`https://wa.me/${product.sellerContact.whatsapp.replace(/\D/g, '')}?text=I%20am%20interested%20in%20your%20product:%20${encodeURIComponent(product.title)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4 mr-1.5" />
                WhatsApp
              </a>
            </Button>
          )}
          {product.sellerContact?.phone && (
            <Button size="sm" variant="outline" className="flex-1 h-9" asChild>
              <a href={`tel:${product.sellerContact.phone}`}>
                <Phone className="h-4 w-4 mr-1.5" />
                Call
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
