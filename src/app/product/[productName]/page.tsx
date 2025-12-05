
'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { products, findSellersByProduct } from '@/lib/data';
import { Product, Seller } from '@/lib/types';
import SellerList from '@/components/seller-list';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';

export default function ProductPage() {
  const params = useParams();
  const productName = decodeURIComponent(params.productName as string);

  const product: Product | undefined = products.find(
    (p) => p.name.toLowerCase() === productName.toLowerCase()
  );

  if (!product) {
    return notFound();
  }

  const sellers = findSellersByProduct(product.name);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
                <Link href={`/category/${product.category.toLowerCase()}`}>{product.category}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid md:grid-cols-2 gap-8 mt-6">
        <div>
            <Card className="overflow-hidden">
                <div className="aspect-square relative w-full">
                    <Image
                        src={product.photoUrl || "https://picsum.photos/seed/product/600/600"}
                        alt={product.name}
                        fill
                        className="object-cover"
                        data-ai-hint={product.photoHint}
                    />
                </div>
            </Card>
        </div>
        <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <Badge variant="secondary" className="text-lg font-bold self-start mb-4">
              ${product.price.toFixed(2)}
            </Badge>
            <p className="text-muted-foreground mb-6">
                Find the best deals from sellers near you.
            </p>

            <div>
                <h2 className="text-2xl font-bold mb-4">Sellers</h2>
                 <SellerList 
                    sellers={sellers} 
                    productName={product.name} 
                    onSellerSelect={() => {}}
                />
            </div>
        </div>
      </div>
    </div>
  );
}
