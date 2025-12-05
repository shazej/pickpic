'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import Image from 'next/image';
import { Paperclip, Send, Loader2, Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { visionChat } from '@/ai/flows/vision-chat';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card, CardContent } from './ui/card';

type Message = {
  role: 'user' | 'model';
  content: { text?: string; media?: { url: string } }[];
};

export default function VisionChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<{ url: string; file: File } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
        const url = e.target?.result as string;
        setImage({ url, file });
        
        // Add a system-like message to show the image in the chat
        const imageMessage: Message = {
            role: 'user',
            content: [{ media: { url } }, {text: "What do you want to know about this image?"}]
        };
        setMessages([imageMessage]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input) return;
    if (messages.length === 0 && !image) {
        toast({
            variant: 'destructive',
            title: 'Please upload an image first',
            description: 'You need to provide an image to ask questions about it.',
        });
        return;
    }


    setIsLoading(true);
    
    const userContent: { text?: string; media?: { url: string } }[] = [{ text: input }];

    const newUserMessage: Message = { role: 'user', content: userContent };
    
    const newMessages = [...messages, newUserMessage];
    setMessages(newMessages);
    setInput('');
    

    try {
      // The first message with media is already in the history
      const history = [...newMessages];
      if (image && history.length > 1) { // Add image only once to the history sent to AI
        const firstUserMessage = history.find(m => m.role === 'user' && m.content.some(c => c.media));
        if (firstUserMessage) {
            // We don't need to re-add the image for every message.
        } else {
             const dataUri = await fileToDataUri(image.file);
             history[history.length - 1].content.unshift({ media: { url: dataUri } });
        }
      }

      const result = await visionChat({ history: newMessages });

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
    } finally {
      setIsLoading(false);
    }
  };
  
  const triggerFileUpload = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  const InitialState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Visual Search</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Upload an image or use your camera to get started.</p>
        </div>

        <Card className="w-full max-w-md">
            <CardContent className="p-6">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                    />
                    <Button onClick={triggerFileUpload} disabled={isLoading} size="lg" variant="outline">
                    <Upload className="mr-2 h-5 w-5" /> Upload Image
                    </Button>
                    <input
                    type="file"
                    ref={cameraInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    />
                    <Button onClick={triggerCamera} disabled={isLoading} size="lg">
                    <Camera className="mr-2 h-5 w-5" /> Use Camera
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        <div className="mt-8 text-sm text-gray-400 dark:text-gray-500 space-y-2">
            <p>Example: Upload a picture of a landmark and ask "Where is this?"</p>
            <p>Or, show a picture of a meal and ask "What's the recipe for this?"</p>
        </div>
    </div>
  );


  return (
    <div className="flex flex-col h-full bg-card">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !image ? (
            <InitialState />
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
               {msg.role === 'model' && (
                <Avatar className="w-9 h-9 border">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div className={`flex flex-col gap-1.5 max-w-2xl ${msg.role === 'user' ? 'items-end' : ''}`}>
                {msg.content.map((part, i) => (
                  <div key={i} className={`rounded-xl px-4 py-2.5 ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {part.media && <Image src={part.media.url} alt="Uploaded content" width={300} height={300} className="rounded-lg mb-2 border-2 border-white/50" />}
                    {part.text && <p className="text-sm whitespace-pre-wrap">{part.text}</p>}
                  </div>
                ))}
              </div>
               {msg.role === 'user' && (
                <Avatar className="w-9 h-9 border">
                  <AvatarFallback>You</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
        {isLoading && (
           <div className="flex items-start gap-4">
              <Avatar className="w-9 h-9 border">
                  <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="rounded-xl px-4 py-2.5 bg-muted flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
          </div>
        )}
      </div>
      {(messages.length > 0 || image) && (
        <div className="border-t p-4 bg-background">
          <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the image..."
              className="pr-24 h-12 text-base"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" onClick={() => {
                setMessages([]);
                setImage(null);
              }} disabled={isLoading}>
                <Paperclip className="h-5 w-5" />
              </Button>
              <Button type="submit" size="icon" disabled={isLoading || !input}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
