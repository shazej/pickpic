'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BarChart, Home, Package, Users, LogOut, PlusCircle } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { products } from '@/lib/data';

export default function SellerProductsPage() {
  const sellerProducts = products.slice(0, 5); // Mocking seller's products

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-muted/40">
        <Sidebar>
          <SidebarContent>
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2 justify-center">
                 <Package className="h-6 w-6 text-primary" />
                 <span className="text-lg font-semibold font-headline">Seller Dashboard</span>
              </div>
            </SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                 <Link href="/seller/dashboard" passHref legacyBehavior>
                    <SidebarMenuButton as="a">
                    <Home className="h-5 w-5" />
                    <span>Dashboard</span>
                    </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <Link href="/seller/dashboard/products" passHref legacyBehavior>
                    <SidebarMenuButton as="a" isActive>
                    <Package className="h-5 w-5" />
                    <span>Products</span>
                    </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
               <SidebarMenuItem>
                 <Link href="#" passHref legacyBehavior>
                    <SidebarMenuButton as="a">
                    <Users className="h-5 w-5" />
                    <span>Customers</span>
                    </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
               <SidebarMenuItem>
                 <Link href="#" passHref legacyBehavior>
                    <SidebarMenuButton as="a">
                    <BarChart className="h-5 w-5" />
                    <span>Analytics</span>
                    </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                 <Link href="/" passHref legacyBehavior>
                    <SidebarMenuButton as="a">
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </SidebarMenuButton>
                 </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
             <SidebarTrigger className="md:hidden" />
             <div className="w-full flex-1">
                <h1 className="text-lg font-semibold md:text-2xl">Products</h1>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/seller/dashboard/products/add">
                    <Button>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Product
                    </Button>
                </Link>
              </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Products</CardTitle>
                <CardDescription>
                  Manage your inventory and view product performance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden w-[100px] sm:table-cell">
                        <span className="sr-only">Image</span>
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Total Sales
                      </TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellerProducts.map((product) => (
                      <TableRow key={product.name}>
                        <TableCell className="hidden sm:table-cell">
                          <Image
                            alt={product.name}
                            className="aspect-square rounded-md object-cover"
                            height="64"
                            src={product.photoUrl || "https://picsum.photos/seed/product/100/100"}
                            width="64"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">Active</Badge>
                        </TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          25
                        </TableCell>
                        <TableCell>
                          {/* Actions Dropdown can go here */}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
