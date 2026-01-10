
import { ProductGallery } from "@/components/product/product-gallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Heart, Flag } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReviewList } from "@/components/reviews/review-list";
import { AddReviewForm } from "@/components/reviews/add-review-form";
import { MessageSellerButton } from "@/components/product/message-seller-button";
import { BuyerAssistant } from "@/components/product/buyer-assistant";
import { query, sql } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
    const { productId } = await params;

    const productResult = await query(
        `SELECT p.*, pa.attributes_json, 
                u.display_name as seller_name, u.phone as seller_phone, u.id as user_id,
                sp.id as seller_id, sp.store_name, sp.bio as seller_bio
         FROM marketplace.Products p
         LEFT JOIN marketplace.ProductAttributes pa ON p.id = pa.product_id
         LEFT JOIN marketplace.SellerProfiles sp ON p.seller_id = sp.id
         LEFT JOIN auth.Users u ON sp.user_id = u.id
         WHERE p.id = @productId`,
        [{ name: 'productId', value: productId, type: sql.UniqueIdentifier }]
    );

    if (!productResult || productResult.recordset.length === 0) {
        notFound();
    }

    const dbProduct = productResult.recordset[0];

    const imagesResult = await query(
        `SELECT image_url FROM marketplace.ProductImages WHERE product_id = @productId ORDER BY is_primary DESC, created_at ASC`,
        [{ name: 'productId', value: productId, type: sql.UniqueIdentifier }]
    );

    const images = imagesResult.recordset.map((img: any, i: number) => ({
        id: i.toString(),
        url: img.image_url,
        alt: dbProduct.title
    }));

    const attributes = dbProduct.attributes_json ? JSON.parse(dbProduct.attributes_json) : {};

    const product = {
        id: dbProduct.id,
        title: dbProduct.title,
        price: dbProduct.price,
        currency: dbProduct.currency || 'USD',
        description: dbProduct.description,
        condition: attributes.condition || 'New',
        category: dbProduct.category || 'General',
        postedAt: 'Recently',
        images: images.length > 0 ? images : [{ id: '0', url: '/placeholder-product.png', alt: dbProduct.title }],
        attributes: attributes,
        seller: {
            id: dbProduct.seller_id,
            name: dbProduct.seller_name || dbProduct.store_name || 'Seller',
            rating: '5.0',
            location: 'Kuwait City',
            joinDate: '2024',
            phone: dbProduct.seller_phone
        }
    };

    return (
        <div className="container py-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">

                {/* Left Column: Gallery */}
                <div>
                    <ProductGallery images={product.images} />
                </div>

                {/* Right Column: Details */}
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">{product.category}</Badge>
                            <Badge variant="outline">{product.condition}</Badge>
                        </div>
                        <h1 className="text-3xl font-bold">{product.title}</h1>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-primary">
                                {product.currency === 'USD' ? '$' : product.currency}{product.price.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <MessageSellerButton
                            sellerId={product.seller.id}
                            productId={product.id}
                        />
                        {product.seller.phone && (
                            <Button className="w-full bg-slate-900 text-white" asChild>
                                <a href={`tel:${product.seller.phone}`}>
                                    Call Seller: {product.seller.phone}
                                </a>
                            </Button>
                        )}
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1">
                                <Heart className="mr-2 h-4 w-4" />
                                Save
                            </Button>
                            <Button variant="ghost" size="icon">
                                <Flag className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/30">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src="" />
                                    <AvatarFallback>{product.seller.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <Link href={`/seller/${product.seller.id}`} className="font-semibold hover:underline">
                                        {product.seller.name}
                                    </Link>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                        <MapPin className="mr-1 h-3 w-3" />
                                        {product.seller.location}
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/seller/${product.seller.id}`}>
                                    View Profile
                                </Link>
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Member since {product.seller.joinDate} • {product.seller.rating} ★
                        </div>
                    </div>

                    <Tabs defaultValue="details">
                        <TabsList className="w-full">
                            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                            <TabsTrigger value="specs" className="flex-1">Specifications</TabsTrigger>
                            <TabsTrigger value="reviews" className="flex-1">Reviews</TabsTrigger>
                        </TabsList>
                        <TabsContent value="details" className="mt-4 text-sm leading-relaxed text-muted-foreground">
                            {product.description}
                        </TabsContent>
                        <TabsContent value="specs" className="mt-4">
                            <dl className="grid grid-cols-2 gap-4 text-sm">
                                {Object.entries(product.attributes).map(([key, value]) => (
                                    <div key={key} className="flex flex-col">
                                        <dt className="font-medium text-foreground">{key}</dt>
                                        <dd className="text-muted-foreground">{String(value)}</dd>
                                    </div>
                                ))}
                            </dl>
                        </TabsContent>
                        <TabsContent value="reviews" className="mt-4">
                            <div className="grid gap-8">
                                <ReviewList />
                                {/* AddReviewForm removed for now due to serialization issues */}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            <BuyerAssistant productId={product.id} />
        </div>
    );
}
