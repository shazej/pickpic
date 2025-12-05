'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Paperclip, Send, Loader2, Search, Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { visionChat } from '@/ai/flows/vision-chat';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { identifyProduct } from '@/ai/flows/product-identification';

type MessageContent = {
  text?: string;
  media?: { url: string };
};

type Message = {
  role: 'user' | 'model';
  content: MessageContent[];
};

export default function VisionChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<{ url: string; file: File } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

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
        // Automatically submit after image selection
        handleSubmit(undefined, { url: e.target?.result as string, file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent, uploadedImage?: { url: string, file: File }) => {
    e?.preventDefault();
    const currentImage = uploadedImage || image;
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
    setImage(null);

    try {
      if(currentImage && messages.length === 0) {
        // First message with an image, let's identify it first
        const dataUri = await fileToDataUri(currentImage.file);
        const result = await identifyProduct({ photoDataUri: dataUri });

        if (result.productName) {
           const params = new URLSearchParams({
            productName: result.productName,
            confidence: (result.confidence * 100).toFixed(0),
          });
          router.push(`/sellers?${params.toString()}`);
          return; // Redirect and stop further processing
        }
      }

      // If not identified as a product or it's a follow-up, use general vision chat
      const historyWithDataUri = await Promise.all(
        newMessages.map(async (msg) => {
          if (msg.role === 'user') {
            const userImage = msg.content.find(c => c.media)?.media;
            if(userImage && userImage.url.startsWith('blob:')) {
                // This is a complex case. For this component, we assume the user uploaded image is always the first.
                // A more robust implementation would store the File object with the message.
                const firstUserImageFile = (uploadedImage || image)?.file;
                if(firstUserImageFile) {
                    const dataUri = await fileToDataUri(firstUserImageFile);
                    return {
                        ...msg,
                        content: msg.content.map(c => c.media ? { media: { url: dataUri } } : c)
                    };
                }
            }
          }
          return msg;
        })
      );


      const result = await visionChat({ history: historyWithDataUri as any });
      
      if (result) {
        const modelMessage: Message = { role: 'model', content: [{ text: result.response }] };
        setMessages([...newMessages, modelMessage]);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
      // Restore previous state on error
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const InitialState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">See & Seek</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">Upload a photo to find where a product is sold, or ask any question about an image.</p>
      </div>
      
       <div className="flex flex-col items-center justify-center p-4 rounded-lg">
          <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-lg">Your conversation starts here</p>
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
              <div className={`flex flex-col gap-2 max-w-lg ${msg.role === 'user' ? 'items-end' : ''}`}>
                {msg.content.map((part, i) => (
                  <div key={i} className={`rounded-lg px-4 py-2 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {part.text && <p className="text-sm whitespace-pre-wrap">{part.text}</p>}
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
      </div>
      <div className="border-t p-4 bg-background">
        <form onSubmit={handleSubmit} className="relative">
          {image && (
            <div className="absolute bottom-16 left-4 bg-muted p-2 rounded-lg border">
              <div className="relative">
                <Image src={image.url} alt="Preview" width={64} height={64} className="rounded object-cover" />
                <Button
                  type="button"
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
            placeholder="Ask about the image or describe a product..."
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
  );
}
