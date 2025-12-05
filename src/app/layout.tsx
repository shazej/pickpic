import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LocationProvider } from '@/hooks/use-location';
import Footer from '@/components/footer';
import Link from 'next/link';
import { Search, Plus, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const metadata: Metadata = {
  title: 'Ecomm Now',
  description: 'Upload an image to find products sold by nearby sellers.',
};

const navLinks = [
  "Automotive", "Property", "Electronics", "Contracting", "Services", "Camping", "Sports", "Animals", "Family", "Gifts", "Furniture", "Jobs", "Education", "Others", "Commercial"
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <LocationProvider>
          <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto flex h-16 items-center justify-between px-4 gap-8">
                  <Link href="/" className="text-2xl font-bold text-primary shrink-0">
                    Ecomm Now
                  </Link>
                <div className="flex-1 w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search for anything"
                      className="w-full pl-10 bg-muted border-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <span>العربية</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>English</DropdownMenuItem>
                        <DropdownMenuItem>العربية</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Link href="/seller/login" className="text-sm font-medium hover:text-primary">
                        Log In
                    </Link>
                    <Link href="/seller/signup" className="text-sm font-medium hover:text-primary">
                        Sign Up
                    </Link>
                   <Link href="/seller/dashboard/products/add">
                      <Button>
                          <Plus className="h-4 w-4 mr-1" />
                          Post Ad
                      </Button>
                    </Link>
                </div>
              </div>
              <nav className="border-t">
                <div className="container mx-auto flex items-center justify-center px-4 h-12 overflow-x-auto">
                  <div className="flex items-center gap-6 text-sm font-medium">
                    {navLinks.map((link) => (
                      <Link key={link} href={`/category/${link.toLowerCase()}`} className="text-foreground hover:text-primary whitespace-nowrap">
                        {link}
                        {link === 'Commercial' && <span className="ml-1.5 text-xs bg-orange-500 text-white rounded-full px-1.5 py-0.5">New</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              </nav>
            </header>
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </LocationProvider>
        <Toaster />
      </body>
    </html>
  );
}
