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
  X,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { visionChat } from '@/ai/flows/vision-chat';
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
      const scrollViewport = scrollAreaRef.current.querySelector('div');
      if (scrollViewport) {
        scrollViewport.scrollTo({
          top: scrollViewport.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [messages]);

  useEffect(() => {
    // Initial message from the AI
    setMessages([]);
  }, []);

  const handleSendMessage = async (text: string, imageUrl?: string) => {
    if (!text && !imageUrl) return;

    const userMessageContent: MessageContent[] = [];
    if (text) userMessageContent.push({ text });
    if (imageUrl) userMessageContent.push({ media: { url: imageUrl } });
    
    // Add an initial greeting from the model if this is the first message
    const newMessages: Message[] = messages.length === 0 
      ? [{ role: 'model', content: [{ text: "Hello! What can I help you with today?" }]}, { role: 'user', content: userMessageContent }]
      : [...messages, { role: 'user', content: userMessageContent }];

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
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-primary/10 rounded-full p-4 mb-6">
        <Bot className="h-10 w-10 text-primary" />
      </div>
      <h1 className="text-3xl font-bold font-headline mb-2">Visual Chat</h1>
      <p className="text-muted-foreground max-w-md mx-auto">
        Start a conversation by uploading an image or asking a question below.
      </p>
    </div>
  );


  return (
    <div className="flex flex-col h-full w-full">
        {messages.length === 0 && !imagePreview && <InitialState />}
        
        <ScrollArea className="flex-grow mb-4" ref={scrollAreaRef}>
          <div className="space-y-6 pr-4 pt-6">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && (
                  <div className="bg-primary text-primary-foreground rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0">
                    <Bot size={22} />
                  </div>
                )}
                <div className={`p-4 rounded-xl max-w-lg ${msg.role === 'model' ? 'bg-muted rounded-tl-none' : 'bg-primary text-primary-foreground rounded-tr-none'}`}>
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
                  <div className="bg-muted text-foreground rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0">
                    <User size={20} />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-4">
                 <div className="bg-primary text-primary-foreground rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0">
                    <Bot size={22} />
                  </div>
                <div className="p-4 bg-muted rounded-xl rounded-tl-none">
                  <Loader2 className="animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="mt-auto px-4 pb-4">
          <div className="relative">
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
             <form onSubmit={handleFormSubmit} className="relative">
                <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question or upload an image..."
                className="pr-24 h-12 text-base rounded-full pl-6"
                disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                >
                    <Paperclip size={20} />
                </Button>
                <Button type="submit" size="icon" className="rounded-full" disabled={isLoading || (!input && !imagePreview)}>
                    <Send size={20} />
                </Button>
                </div>
            </form>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
    </div>
  );
}
