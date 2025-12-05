
'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Paperclip, Send, Loader2, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { visionChat } from '@/ai/flows/vision-chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { extractProductDetails } from '@/ai/flows/extract-product-details';
import { products as allProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

type MessageContent = {
  text?: string;
  media?: { url: string };
  product?: Product;
};

type Message = {
  role: 'user' | 'model';
  content: MessageContent[];
};

export default function VisionChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestedProducts, setSuggestedProducts] = useState<Product[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, suggestedProducts]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setSuggestedProducts([]); // Clear previous suggestions
        handleSubmit(undefined, { url: imageUrl, file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, uploadedImage?: { url: string, file: File }) => {
    e?.preventDefault();
    
    const currentImage = uploadedImage;
    if (!input && !currentImage) return;

    setIsLoading(true);
    
    const userContent: MessageContent[] = [];
    if (input) {
      userContent.push({ text: input });
    }
    if (currentImage) {
        userContent.push({ media: { url: currentImage.url } });
    }

    const newUserMessage: Message = { role: 'user', content: userContent };
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInput('');

    try {
        const historyForApi: { role: 'user' | 'model'; content: { text?: string; media?: { url: string; } }[] }[] = [];

        for (const msg of newMessages) {
            const contentForApi = [];
            if (msg.role === 'user' && currentImage?.file && msg.content.some(c => c.media)) {
                const dataUri = await fileToDataUri(currentImage.file);
                for (const part of msg.content) {
                    if (part.media) {
                        contentForApi.push({ media: { url: dataUri } });
                    } else if (part.text) {
                        contentForApi.push({ text: part.text });
                    }
                }
            } else {
                for (const part of msg.content) {
                    if (part.text && part.text.trim()) { // Ensure not to send empty text parts
                        contentForApi.push({ text: part.text });
                    }
                }
            }
            if (contentForApi.length > 0) {
                 historyForApi.push({ role: msg.role, content: contentForApi });
            }
        }
        
        let modelResponse: Message;

        if(currentImage && (!messages.some(m => m.content.some(c => c.media))) || (currentImage && input)) {
            const dataUri = await fileToDataUri(currentImage.file);
            const productDetails = await extractProductDetails({ photoDataUri: dataUri });

            const foundProduct = allProducts.find(p => p.name.toLowerCase().includes(productDetails.productName.toLowerCase()));

            if (foundProduct) {
                modelResponse = {
                    role: 'model',
                    content: [
                    { text: `I found a "${productDetails.productName}" for you! Here are the details:` },
                    { product: foundProduct }
                    ]
                };

                // Get 3 random suggested products
                const otherProducts = allProducts.filter(p => p.name !== foundProduct.name);
                const shuffled = otherProducts.sort(() => 0.5 - Math.random());
                setSuggestedProducts(shuffled.slice(0, 3));

            } else {
                modelResponse = {
                    role: 'model',
                    content: [
                    { text: `I identified a "${productDetails.productName}" in your image, but I couldn't find an exact match in our product catalog. You can ask me other questions about it though!` }
                    ]
                };
                setSuggestedProducts([]);
            }
        } else {
            const result = await visionChat({ history: historyForApi });
            modelResponse = { role: 'model', content: [{ text: result.response }] };
            setSuggestedProducts([]);
        }
        
        setMessages([...newMessages, modelResponse]);

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const InitialState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Ecomm Now</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">Upload a photo of a product to see if we have it in our catalog, or just ask a question.</p>
      </div>
      
       <div className="flex flex-col items-center justify-center p-4 rounded-lg">
          <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-lg">Your visual search starts here</p>
          <p className="text-sm text-muted-foreground">Upload an image or type a message below.</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-card">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <InitialState />
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <Avatar className="w-8 h-8 border">
                  <AvatarFallback><Sparkles className="w-4 h-4 text-primary" /></AvatarFallback>
                </Avatar>
              )}
              <div className={`flex flex-col gap-2 max-w-lg ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.content.map((part, i) => (
                  <div key={i} className={`rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {part.text && <p className="text-sm whitespace-pre-wrap px-4 py-2">{part.text}</p>}
                    {part.media && <Image src={part.media.url} alt="Uploaded content" width={200} height={200} className="rounded-md m-2" />}
                    {part.product && (
                      <div className="w-64 p-2">
                        <ProductCard product={part.product} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {msg.role === 'user' && (
                <Avatar className="w-8 h-8 border">
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8 border">
              <AvatarFallback><Sparkles className="w-4 h-4 text-primary" /></AvatarFallback>
            </Avatar>
            <div className="rounded-lg px-4 py-2 bg-muted flex items-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {suggestedProducts.length > 0 && (
          <div className="pt-6">
             <div className="flex items-start gap-4">
                <Avatar className="w-8 h-8 border">
                    <AvatarFallback><Sparkles className="w-4 h-4 text-primary" /></AvatarFallback>
                </Avatar>
                <div className='flex flex-col gap-2 max-w-lg'>
                    <div className="bg-muted rounded-lg p-4">
                        <h3 className="font-semibold text-sm mb-2 text-foreground">You might also like...</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {suggestedProducts.map(product => (
                            <ProductCard key={product.name} product={product} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        )}

      </div>
      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSubmit} className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about an image or describe a product..."
            className="pr-24"
            disabled={isLoading}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button type="submit" size="icon" disabled={isLoading || (!input)}>
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
        <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
      </div>
    </div>
  );
}

    

    