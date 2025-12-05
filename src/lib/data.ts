
import type { Seller, Product } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const products: Product[] = [
  { name: 'Wireless Headphones', price: 199.99, category: 'Electronics', photoUrl: PlaceHolderImages.find(p => p.id === 'product-headphones')?.imageUrl, photoHint: PlaceHolderImages.find(p => p.id === 'product-headphones')?.imageHint || 'wireless headphones' },
  { name: 'Smartwatch', price: 249.99, category: 'Electronics', photoUrl: PlaceHolderImages.find(p => p.id === 'product-smartwatch')?.imageUrl, photoHint: PlaceHolderImages.find(p => p.id === 'product-smartwatch')?.imageHint || 'smartwatch' },
  { name: 'Coffee Maker', price: 89.00, category: 'Furniture', photoUrl: PlaceHolderImages.find(p => p.id === 'product-coffeemaker')?.imageUrl, photoHint: PlaceHolderImages.find(p => p.id === 'product-coffeemaker')?.imageHint || 'coffee maker' },
  { name: 'Blender', price: 120.00, category: 'Furniture', photoUrl: PlaceHolderImages.find(p => p.id === 'product-blender')?.imageUrl, photoHint: PlaceHolderImages.find(p => p.id === 'product-blender')?.imageHint || 'blender' },
  { name: 'Portable Speaker', price: 89.99, category: 'Electronics', photoUrl: "https://picsum.photos/seed/speaker/400/300", photoHint: "portable speaker" },
  { name: 'Gaming Mouse', price: 79.99, category: 'Electronics', photoUrl: "https://picsum.photos/seed/mouse/400/300", photoHint: "gaming mouse" },
  { name: 'Mechanical Keyboard', price: 129.99, category: 'Electronics', photoUrl: "https://picsum.photos/seed/keyboard/400/300", photoHint: "mechanical keyboard" },
  { name: 'VR Headset', price: 399.99, category: 'Electronics', photoUrl: "https://picsum.photos/seed/vr/400/300", photoHint: "vr headset" },
  { name: 'Sedan Car', price: 25000, category: 'Automotive', photoUrl: "https://picsum.photos/seed/sedan/400/300", photoHint: "blue sedan" },
  { name: 'Modern Apartment', price: 500000, category: 'Property', photoUrl: "https://picsum.photos/seed/apartment/400/300", photoHint: "modern apartment" },
  { name: 'Lawn Mowing Service', price: 50, category: 'Services', photoUrl: "https://picsum.photos/seed/lawn/400/300", photoHint: "lawn mower" },
  { name: 'Camping Tent', price: 150, category: 'Camping', photoUrl: "https://picsum.photos/seed/camptent/400/300", photoHint: "camping tent" },
  { name: 'Basketball', price: 25, category: 'Sports', photoUrl: "https://picsum.photos/seed/basketball/400/300", photoHint: "basketball" },
  { name: 'Golden Retriever Puppy', price: 1200, category: 'Animals', photoUrl: "https://picsum.photos/seed/puppy/400/300", photoHint: "golden retriever" },
  { name: 'Baby Stroller', price: 250, category: 'Family', photoUrl: "https://picsum.photos/seed/stroller/400/300", photoHint: "baby stroller" },
  { name: 'Birthday Gift Basket', price: 75, category: 'Gifts', photoUrl: "https://picsum.photos/seed/giftbasket/400/300", photoHint: "gift basket" },
  { name: 'Wooden Dining Table', price: 800, category: 'Furniture', photoUrl: "https://picsum.photos/seed/diningtable/400/300", photoHint: "dining table" },
  { name: 'Software Developer Role', price: 90000, category: 'Jobs', photoUrl: "https://picsum.photos/seed/devjob/400/300", photoHint: "code on screen" },
];


export const sellers: Seller[] = [
  {
    id: 'seller-1',
    name: 'Tech Haven',
    location: { lat: 34.0522, lng: -118.2437 }, // Downtown LA
    address: '123 Main St, Los Angeles, CA',
    phone: '(213) 555-0101',
    photoUrl: PlaceHolderImages.find(p => p.id === 'seller-1-photo')?.imageUrl || 'https://picsum.photos/seed/tech1/400/300',
    photoHint: PlaceHolderImages.find(p => p.id === 'seller-1-photo')?.imageHint || 'tech store',
    products: [
      { name: 'Wireless Headphones', price: 199.99, category: 'Electronics' },
      { name: 'Smartwatch', price: 249.99, category: 'Electronics' },
      { name: 'Portable Speaker', price: 89.99, category: 'Electronics' },
    ],
  },
  {
    id: 'seller-2',
    name: 'Gadget Galaxy',
    location: { lat: 34.0622, lng: -118.2537 }, // Near Dodger Stadium
    address: '456 Tech Rd, Los Angeles, CA',
    phone: '(213) 555-0102',
    photoUrl: PlaceHolderImages.find(p => p.id === 'seller-2-photo')?.imageUrl || 'https://picsum.photos/seed/tech2/400/300',
    photoHint: PlaceHolderImages.find(p => p.id === 'seller-2-photo')?.imageHint || 'gadget store',
    products: [
      { name: 'Wireless Headphones', price: 189.99, category: 'Electronics' },
      { name: 'Gaming Mouse', price: 79.99, category: 'Electronics' },
      { name: 'Mechanical Keyboard', price: 129.99, category: 'Electronics' },
    ],
  },
  {
    id: 'seller-3',
    name: 'Electro World',
    location: { lat: 34.0422, lng: -118.2637 }, // South Park
    address: '789 Circuit Ave, Los Angeles, CA',
    phone: '(213) 555-0103',
    photoUrl: PlaceHolderImages.find(p => p.id === 'seller-3-photo')?.imageUrl || 'https://picsum.photos/seed/tech3/400/300',
    photoHint: PlaceHolderImages.find(p => p.id === 'seller-3-photo')?.imageHint || 'electronics shop',
    products: [
      { name: 'Smartwatch', price: 259.99, category: 'Electronics' },
      { name: 'VR Headset', price: 399.99, category: 'Electronics' },
      { name: 'Wireless Headphones', price: 219.99, category: 'Electronics' },
    ],
  },
  {
    id: 'seller-4',
    name: 'Home Goods Central',
    location: { lat: 40.7128, lng: -74.0060 }, // NYC
    address: '101 Homey Blvd, New York, NY',
    phone: '(212) 555-0104',
    photoUrl: PlaceHolderImages.find(p => p.id === 'seller-4-photo')?.imageUrl || 'https://picsum.photos/seed/home1/400/300',
    photoHint: PlaceHolderImages.find(p => p.id === 'seller-4-photo')?.imageHint || 'home goods',
    products: [
      { name: 'Coffee Maker', price: 89.00, category: 'Furniture' },
      { name: 'Blender', price: 120.00, category: 'Furniture' },
    ],
  },
  {
    id: 'seller-5',
    name: 'Kitchen Creations',
    location: { lat: 40.7228, lng: -73.9960 }, // Near Washington Square Park, NYC
    address: '212 Culinary Way, New York, NY',
    phone: '(212) 555-0105',
    photoUrl: PlaceHolderImages.find(p => p.id === 'seller-5-photo')?.imageUrl || 'https://picsum.photos/seed/kitchen1/400/300',
    photoHint: PlaceHolderImages.find(p => p.id === 'seller-5-photo')?.imageHint || 'kitchenware shop',
    products: [
      { name: 'Coffee Maker', price: 95.50, category: 'Furniture' },
      { name: 'Stand Mixer', price: 299.00, category: 'Furniture' },
    ],
  },
   {
    id: 'seller-6',
    name: 'Digital Dreams',
    location: { lat: 34.0722, lng: -118.2837 },
    address: '321 Innovation Dr, Los Angeles, CA',
    phone: '(213) 555-0106',
    photoUrl: PlaceHolderImages.find(p => p.id === 'seller-6-photo')?.imageUrl || 'https://picsum.photos/seed/tech4/400/300',
    photoHint: PlaceHolderImages.find(p => p.id === 'seller-6-photo')?.imageHint || 'electronics store',
    products: [
      { name: 'Wireless Headphones', price: 209.99, category: 'Electronics' },
      { name: 'Tablet', price: 499.99, category: 'Electronics' },
    ],
  },
  {
    id: 'seller-7',
    name: 'Connect Electronics',
    location: { lat: 34.0322, lng: -118.2237 },
    address: '654 Connection St, Los Angeles, CA',
    phone: '(213) 555-0107',
    photoUrl: PlaceHolderImages.find(p => p.id === 'seller-7-photo')?.imageUrl || 'https://picsum.photos/seed/tech5/400/300',
    photoHint: PlaceHolderImages.find(p => p.id === 'seller-7-photo')?.imageHint || 'gadget shop',
    products: [
      { name: 'Smartwatch', price: 239.99, category: 'Electronics' },
      { name: 'E-Reader', price: 129.99, category: 'Electronics' },
    ],
  },
  {
    id: 'seller-8',
    name: 'Future Gadgets',
    location: { lat: 40.7328, lng: -74.0160 },
    address: '45 Future Ave, New York, NY',
    phone: '(212) 555-0108',
    photoUrl: PlaceHolderImages.find(p => p.id === 'seller-8-photo')?.imageUrl || 'https://picsum.photos/seed/tech6/400/300',
    photoHint: PlaceHolderImages.find(p => p.id === 'seller-8-photo')?.imageHint || 'futuristic gadgets',
    products: [
      { name: 'Wireless Headphones', price: 229.99, category: 'Electronics' },
      { name: 'Drone', price: 799.99, category: 'Electronics' },
    ],
  },
  {
    id: 'seller-9',
    name: 'Urban Homeware',
    location: { lat: 40.7028, lng: -73.9860 },
    address: '789 Domestic Dr, New York, NY',
    phone: '(212) 555-0109',
    photoUrl: PlaceHolderImages.find(p => p.id === 'seller-9-photo')?.imageUrl || 'https://picsum.photos/seed/home2/400/300',
    photoHint: PlaceHolderImages.find(p => p.id === 'seller-9-photo')?.imageHint || 'modern homeware',
    products: [
      { name: 'Coffee Maker', price: 79.99, category: 'Furniture' },
      { name: 'Air Fryer', price: 149.99, category: 'Furniture' },
    ],
  },
  {
    id: 'seller-10',
    name: 'The Appliance Stop',
    location: { lat: 40.7428, lng: -73.9760 },
    address: '101 Appliance Rd, New York, NY',
    phone: '(212) 555-0110',
    photoUrl: PlaceHolderImages.find(p => p.id === 'seller-10-photo')?.imageUrl || 'https://picsum.photos/seed/home3/400/300',
    photoHint: PlaceHolderImages.find(p => p.id === 'seller-10-photo')?.imageHint || 'appliance store',
    products: [
      { name: 'Blender', price: 110.00, category: 'Furniture' },
      { name: 'Toaster Oven', price: 65.00, category: 'Furniture' },
    ],
  },
];

export function findSellersByProduct(productName: string): Seller[] {
    if (!productName) return [];
  const lowerCaseProductName = productName.toLowerCase();
  const foundSellers = sellers.filter(seller =>
    seller.products.some(product =>
      product.name.toLowerCase().includes(lowerCaseProductName)
    )
  );

  return foundSellers.map(seller => ({
    ...seller,
    products: seller.products.filter(product => product.name.toLowerCase().includes(lowerCaseProductName))
  }));
}
