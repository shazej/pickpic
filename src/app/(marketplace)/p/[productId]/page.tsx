
import { ProductGallery } from "@/components/product/product-gallery";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, MessageCircle, Heart, Flag } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReviewList } from "@/components/reviews/review-list";
import { AddReviewForm } from "@/components/reviews/add-review-form";
import { MessageSellerButton } from "@/components/product/message-seller-button";

// Mock Data
const PRODUCT = {
    id: '1',
    title: 'Vintage Film Camera - Canon AE-1',
    price: 150.00,
    currency: 'USD',
    description: 'Excellent condition vintage Canon AE-1 Program 35mm film camera. Comes with 50mm f/1.8 FD lens. Tested and working perfectly. New light seals installed.',
    condition: 'Used - Good',
    category: 'Electronics',
    postedAt: '2 days ago',
    images: [
        { id: '1', url: 'https://picsum.photos/seed/camera1/800/800', alt: 'Front view' },
        { id: '2', url: 'https://picsum.photos/seed/camera2/800/800', alt: 'Back view' },
        { id: '3', url: 'https://picsum.photos/seed/camera3/800/800', alt: 'Top view' },
    ],
    attributes: {
        Brand: 'Canon',
        Model: 'AE-1 Program',
        Type: 'SLR',
        Format: '35mm',
        Focus: 'Manual'
    },
    seller: {
        id: 'seller1',
        name: 'Alex Photography',
        rating: 4.8,
        location: 'Downtown District',
        joinDate: '2023'
    }
};

export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
    // In real app: const { productId } = await params; const product = await getProduct(productId);
    const { productId } = await params;
    const product = PRODUCT;

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
                                        <dd className="text-muted-foreground">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </TabsContent>
                        <TabsContent value="reviews" className="mt-4">
                            <div className="grid gap-8">
                                <ReviewList />
                                <AddReviewForm onSubmit={(d) => console.log(d)} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
