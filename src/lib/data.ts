import type { Seller } from '@/lib/types';

export const sellers: Seller[] = [
  {
    id: 'seller-1',
    name: 'Tech Haven',
    location: { lat: 34.0522, lng: -118.2437 }, // Downtown LA
    address: '123 Main St, Los Angeles, CA',
    products: [
      { name: 'Wireless Headphones', price: 199.99 },
      { name: 'Smartwatch', price: 249.99 },
      { name: 'Portable Speaker', price: 89.99 },
    ],
  },
  {
    id: 'seller-2',
    name: 'Gadget Galaxy',
    location: { lat: 34.0622, lng: -118.2537 }, // Near Dodger Stadium
    address: '456 Tech Rd, Los Angeles, CA',
    products: [
      { name: 'Wireless Headphones', price: 189.99 },
      { name: 'Gaming Mouse', price: 79.99 },
      { name: 'Mechanical Keyboard', price: 129.99 },
    ],
  },
  {
    id: 'seller-3',
    name: 'Electro World',
    location: { lat: 34.0422, lng: -118.2637 }, // South Park
    address: '789 Circuit Ave, Los Angeles, CA',
    products: [
      { name: 'Smartwatch', price: 259.99 },
      { name: 'VR Headset', price: 399.99 },
      { name: 'Wireless Headphones', price: 219.99 },
    ],
  },
  {
    id: 'seller-4',
    name: 'Home Goods Central',
    location: { lat: 40.7128, lng: -74.0060 }, // NYC
    address: '101 Homey Blvd, New York, NY',
    products: [
      { name: 'Coffee Maker', price: 89.00 },
      { name: 'Blender', price: 120.00 },
    ],
  },
  {
    id: 'seller-5',
    name: 'Kitchen Creations',
    location: { lat: 40.7228, lng: -73.9960 }, // Near Washington Square Park, NYC
    address: '212 Culinary Way, New York, NY',
    products: [
      { name: 'Coffee Maker', price: 95.50 },
      { name: 'Stand Mixer', price: 299.00 },
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
