'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import Image from 'next/image';
import {
  Paperclip,
  Loader2,
  Bot,
  Image as ImageIcon,
  Send,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { visionChat, VisionChatInput } from '@/ai/flows/vision-chat';
import { Card, CardContent } from './ui/card';
import Link from 'next/link';
import { ScrollArea } from './ui/scroll-area';

type Message = {
  role: 'user' | 'model';
  content: { text?: string; media?: { url: string } }[];
};

export default function SimilarProductsChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUploadedImage, setHasUploadedImage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if(viewport) {
            viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string, imageUrl?: string) => {
    if (!text && !imageUrl) return;

    const userMessageContent: { text?: string; media?: { url: string } }[] = [];
    if (text) userMessageContent.push({ text });
    if (imageUrl) userMessageContent.push({ media: { url: imageUrl } });

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessageContent }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const history: VisionChatInput['history'] = newMessages.map(msg => ({
        role: msg.role,
        content: msg.content.map(c => ({
          text: c.text,
          media: c.media ? { url: c.media.url } : undefined,
        })),
      }));

      const result = await visionChat({ history });

      if (result && result.response) {
        setMessages(prev => [...prev, { role: 'model', content: [{ text: result.response }] }]);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong while communicating with the AI.',
      });
      setMessages(prev => [...prev, { role: 'model', content: [{ text: "I'm sorry, I encountered an error. Please try again." }] }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsLoading(true);
        const dataUri = await fileToDataUri(file);
        setHasUploadedImage(true);
        // Start the chat with the image
        await handleSendMessage("Describe this image and suggest some random products from the website.", dataUri);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not process the image. Please try another one.',
        });
        setIsLoading(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const InitialState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-primary/10 rounded-full p-6 mb-6 border-8 border-primary/5">
        <ImageIcon className="h-16 w-16 text-primary" />
      </div>
      <h1 className="text-3xl font-bold font-headline mb-2">Visual & Conversational Search</h1>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">
        Upload an image of a product, and our AI will help you find what you're looking for. Ask questions to refine your search.
      </p>
      <Button size="lg" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
        <Paperclip className="mr-2 h-4 w-4" />
        {isLoading ? 'Processing...' : 'Upload Image'}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-card border rounded-lg">
      <ScrollArea className="flex-grow" ref={scrollAreaRef}>
         <div className="p-4 h-full">
            {!hasUploadedImage && !isLoading && <InitialState />}
            
            <div className="space-y-6">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'model' && (
                    <div className="bg-muted text-muted-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <Bot size={20} />
                    </div>
                  )}
                  <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                    {msg.content.map((c, i) => (
                      <div key={i}>
                        {c.text && <p className="whitespace-pre-wrap">{c.text}</p>}
                        {c.media?.url && <Image src={c.media.url} alt="Uploaded content" width={200} height={200} className="rounded-md mt-2" />}
                      </div>
                    ))}
                  </div>
                   {msg.role === 'user' && (
                    <div className="bg-muted text-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <User size={20} />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-4">
                  <div className="bg-muted text-muted-foreground rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0">
                    <Bot size={22} />
                  </div>
                  <div className="p-4 bg-muted rounded-xl rounded-tl-none flex items-center">
                    <Loader2 className="animate-spin text-primary" />
                    <p className="ml-2 text-muted-foreground">Thinking...</p>
                  </div>
                </div>
              )}
            </div>
         </div>
      </ScrollArea>

      <div className="mt-auto px-4 pb-4 border-t pt-4 bg-card rounded-b-lg">
        {hasUploadedImage ? (
          <form onSubmit={handleFormSubmit} className="relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a follow-up question..."
              className="pr-24"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                title="Upload another image"
              >
                <Paperclip size={20} />
              </Button>
              <Button type="submit" size="icon" disabled={isLoading || !input}>
                <Send size={20} />
              </Button>
            </div>
          </form>
        ) : (
          <Button className="w-full h-12 text-base" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            <Paperclip className="mr-2 h-4 w-4" />
            {isLoading ? 'Analyzing...' : 'Upload Image'}
          </Button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
}
