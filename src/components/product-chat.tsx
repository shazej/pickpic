'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { Paperclip, Send, Loader2, Package, DollarSign, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { createProductChat } from '@/ai/flows/create-product-chat';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

type Message = {
  role: 'user' | 'model';
  content: { text?: string; media?: { url: string } }[];
};

type ProductDetails = {
    productName?: string;
    description?: string;
    price?: number;
}

export default function ProductChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<{ url: string; file: File } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [productDetails, setProductDetails] = useState<ProductDetails>({});
  const [isFinalized, setIsFinalized] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage({ url: e.target?.result as string, file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input && !image) return;

    setIsLoading(true);
    
    const userContent: { text?: string; media?: { url: string } }[] = [];
    if (input) {
      userContent.push({ text: input });
    }
    if (image) {
      const dataUri = await fileToDataUri(image.file);
      userContent.push({ media: { url: dataUri } });
    }

    const newUserMessage: Message = { role: 'user', content: userContent };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInput('');
    setImage(null);

    try {
      const result = await createProductChat({ history: newMessages });

      if (result) {
        const modelMessage: Message = { role: 'model', content: [{ text: result.response }] };
        setMessages([...newMessages, modelMessage]);
        
        const newDetails: ProductDetails = {};
        if (result.productName) newDetails.productName = result.productName;
        if (result.description) newDetails.description = result.description;
        if (result.price) newDetails.price = result.price;

        if (Object.keys(newDetails).length > 0) {
            setProductDetails(prev => ({...prev, ...newDetails}));
        }

        if(result.productName && result.description && result.price) {
            setIsFinalized(true);
        }
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateProduct = () => {
    toast({
        title: "Product Created!",
        description: `${productDetails.productName} has been added to your inventory.`,
    });
    // Reset state for new product creation
    setMessages([]);
    setProductDetails({});
    setIsFinalized(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 h-full gap-0 bg-background">
      <div className="lg:col-span-2 flex flex-col h-full bg-card border-r">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
               {msg.role === 'model' && (
                <Avatar className="w-8 h-8 border">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div className={`flex flex-col gap-1 max-w-lg ${msg.role === 'user' ? 'items-end' : ''}`}>
                {msg.content.map((part, i) => (
                  <div key={i} className={`rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {part.text && <p className="text-sm">{part.text}</p>}
                    {part.media && <Image src={part.media.url} alt="Uploaded content" width={200} height={200} className="rounded-md mt-2" />}
                  </div>
                ))}
              </div>
               {msg.role === 'user' && (
                <Avatar className="w-8 h-8 border">
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {messages.length === 0 && (
             <div className="text-center text-muted-foreground mt-8 h-full flex flex-col items-center justify-center bg-background/50 rounded-lg p-6">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground">Start by describing your product or uploading an image.</h3>
                <p className="text-sm">e.g., "A pair of red running shoes" or upload a photo.</p>
              </div>
          )}
          {isLoading && (
             <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 border">
                    <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            </div>
          )}
        </div>
        <div className="border-t p-4 bg-background">
          <form onSubmit={handleSubmit} className="relative">
            {image && (
              <div className="absolute bottom-16 left-4 bg-muted p-2 rounded-lg border">
                <div className="relative">
                  <Image src={image.url} alt="Preview" width={64} height={64} className="rounded" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground"
                    onClick={() => setImage(null)}
                  >
                    &times;
                  </Button>
                </div>
              </div>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your product or ask a question..."
              className="pr-24"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button type="submit" size="icon" disabled={isLoading || (!input && !image)}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
        </div>
      </div>
      <div className="lg:col-span-1 flex flex-col p-6 bg-background h-full">
         <Card className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Product Details</CardTitle>
                {isFinalized && <Badge className='bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'><CheckCircle className="h-4 w-4 mr-1" />Ready</Badge>}
            </CardHeader>
            <CardContent className="space-y-4 flex-grow">
                <div className="space-y-2">
                    <Label htmlFor="product-name" className='flex items-center gap-2'><Package className='w-4 h-4 text-muted-foreground' /> Name</Label>
                    <Input id="product-name" value={productDetails.productName || ''} onChange={e => setProductDetails(p => ({...p, productName: e.target.value}))} placeholder="e.g. Wireless Headphones" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description" className='flex items-center gap-2'><FileText className='w-4 h-4 text-muted-foreground' /> Description</Label>
                    <Textarea id="description" value={productDetails.description || ''} onChange={e => setProductDetails(p => ({...p, description: e.target.value}))} placeholder="A short, catchy description..." rows={6} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price" className='flex items-center gap-2'><DollarSign className='w-4 h-4 text-muted-foreground' /> Price</Label>
                    <Input id="price" type="number" value={productDetails.price || ''} onChange={e => setProductDetails(p => ({...p, price: Number(e.target.value)}))} placeholder="99.99" />
                </div>
            </CardContent>
             <div className='p-6 pt-0'>
                <Button className="w-full" disabled={!isFinalized} onClick={handleCreateProduct}>
                    Create Product
                </Button>
             </div>
         </Card>
      </div>
    </div>
  );
}
