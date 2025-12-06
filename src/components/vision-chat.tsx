'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import {
  Paperclip,
  Send,
  Loader2,
  Bot,
  User,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { visionChat } from '@/ai/flows/vision-chat';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

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
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Scroll to the bottom of the chat on new messages
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('div');
      if(scrollElement) {
        scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: 'smooth',
        });
      }
    }
  }, [messages]);

  useEffect(() => {
    // Initial message from the AI
    setMessages([{ role: 'model', content: [{ text: "Hello! Upload an image and ask me anything about it." }] }]);
  }, []);

  const handleSendMessage = async (text: string, imageUrl?: string) => {
    if (!text && !imageUrl) return;

    const userMessageContent: MessageContent[] = [];
    if (text) userMessageContent.push({ text });
    if (imageUrl) userMessageContent.push({ media: { url: imageUrl } });

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessageContent }];
    setMessages(newMessages);
    setInput('');
    setImagePreview(null);
    setIsLoading(true);

    try {
      const result = await visionChat({ history: newMessages });

      if (result) {
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
        const dataUri = await fileToDataUri(file);
        setImagePreview(dataUri);
        // Automatically send a default message with the image
        if (!input) {
            handleSendMessage("What do you see in this image?", dataUri);
        }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input, imagePreview || undefined);
  };
  
  const InitialState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/20 rounded-lg border-2 border-dashed m-4">
      <ImageIcon className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <h1 className="text-2xl font-bold font-headline">Visual Question & Answer</h1>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Upload an image and ask our AI anything you want to know about it.
      </p>
      <Button
        onClick={() => fileInputRef.current?.click()}
        className="mt-6"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Paperclip className="mr-2 h-4 w-4" />
        )}
        Upload an Image
      </Button>
    </div>
  );


  if (messages.length <= 1 && !imagePreview) {
    return <InitialState />;
  }

  return (
    <div className="flex flex-col h-full p-4">
        <ScrollArea className="flex-grow mb-4" ref={scrollAreaRef}>
          <div className="space-y-6 pr-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && (
                  <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <Bot size={20} />
                  </div>
                )}
                <div className={`p-3 rounded-lg max-w-lg ${msg.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                  {msg.content.map((c, i) => (
                    <div key={i}>
                      {c.media?.url && (
                        <div className='mb-2 rounded-md overflow-hidden'>
                            <Image src={c.media.url} alt="Uploaded content" width={300} height={300} className="max-w-full h-auto" />
                        </div>
                      )}
                      {c.text && <p className="whitespace-pre-wrap">{c.text}</p>}
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
              <div className="flex items-start gap-3">
                 <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <Bot size={20} />
                  </div>
                <div className="p-3 bg-muted rounded-lg">
                  <Loader2 className="animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="mt-auto">
          <form onSubmit={handleFormSubmit} className="relative">
            {imagePreview && !messages.some(m => m.content.some(c => c.media?.url === imagePreview)) && (
              <div className="absolute bottom-16 left-4 p-1 bg-background border rounded-md shadow-sm">
                <Image src={imagePreview} alt="Preview" width={60} height={60} className="rounded-sm" />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full h-5 w-5 text-xs flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the image..."
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
              >
                <Paperclip size={20} />
              </Button>
              <Button type="submit" size="icon" disabled={isLoading || (!input && !imagePreview)}>
                <Send size={20} />
              </Button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </form>
        </div>
    </div>
  );
}
