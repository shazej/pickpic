'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Loader2, Camera, Upload, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUri } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { generateImages, type GenerateImagesOutput } from '@/ai/flows/generate-images';
import { Input } from './ui/input';

type Message = {
    role: 'user' | 'model' | 'system';
    text: string;
}

export default function VisionChat() {
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GenerateImagesOutput>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setGeneratedImages([]);
    setMessages([]);
    try {
      const dataUri = await fileToDataUri(file);
      setInputImage(dataUri);

      const result = await generateImages({
          photoDataUri: dataUri,
      });

      if (result && result.length > 0) {
          setGeneratedImages(result);
          setMessages([{ role: 'system', text: 'Images generated based on your upload. You can now use the chat to refine them.'}]);
      } else {
          toast({
              variant: 'destructive',
              title: 'Generation Failed',
              description: 'We couldn\'t generate images based on your upload.',
          });
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
  }

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleImageUpload(file);
    }
  };

  const handlePromptSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt || !inputImage) return;

    setIsLoading(true);
    setGeneratedImages([]);
    const newMessages: Message[] = [...messages, { role: 'user', text: prompt }];
    setMessages(newMessages);
    setPrompt('');

    try {
         const result = await generateImages({
            photoDataUri: inputImage,
            prompt: prompt,
        });
        if (result && result.length > 0) {
            setGeneratedImages(result);
            setMessages(prev => [...prev, { role: 'system', text: 'Images have been updated based on your prompt.'}]);
        } else {
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: 'We couldn\'t generate images based on your prompt.',
            });
            setMessages(prev => [...prev, { role: 'system', text: 'Sorry, I could not generate images. Please try another prompt.'}]);
        }
    } catch(error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'An error occurred during image generation.',
        });
    } finally {
        setIsLoading(false);
    }
  }

  const triggerFileUpload = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  const InitialState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">AI Image Generation</h1>
        <p className="text-muted-foreground mt-2">Upload an image and use chat to generate new creations inspired by it.</p>
      </div>

      <Card className="w-full max-w-md shadow-lg">
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

      <div className="mt-8 text-sm text-muted-foreground/80 space-y-2">
        <p>Example: Upload a picture of a landscape to see different artistic versions.</p>
        <p>Or, show a photo of a pet and ask to "make it a cartoon character".</p>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-background">
      {!inputImage ? (
        <InitialState />
      ) : (
        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <h2 className="text-2xl font-bold font-headline mb-4">Chat & Refine</h2>
                <div className='sticky top-8'>
                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            <div className="aspect-square relative">
                                {inputImage && <Image src={inputImage} alt="Your uploaded image" fill className="object-cover" />}
                            </div>
                        </CardContent>
                    </Card>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button onClick={triggerFileUpload} disabled={isLoading} variant="outline">
                            <Upload className="mr-2 h-4 w-4" /> Change
                        </Button>
                        <Button onClick={triggerCamera} disabled={isLoading} variant="outline">
                            <Camera className="mr-2 h-4 w-4" /> Retake
                        </Button>
                    </div>

                    <div className='mt-4 bg-card border rounded-lg p-4 h-64 flex flex-col'>
                       <div className='flex-1 overflow-y-auto text-sm space-y-3 pr-2'>
                           {messages.map((msg, i) => (
                               <div key={i} className={`p-2 rounded-lg ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                  {msg.text}
                               </div>
                           ))}
                       </div>
                        <form onSubmit={handlePromptSubmit} className='mt-4 relative'>
                            <Input 
                                placeholder='e.g., "make it futuristic"'
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                disabled={isLoading}
                                className='pr-10'
                            />
                            <Button type="submit" size="icon" variant="ghost" className='absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8' disabled={isLoading || !prompt}>
                                <Send className='h-4 w-4' />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2">
                 <h2 className="text-2xl font-bold font-headline mb-4">Generated Images</h2>
                {isLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {generatedImages.map((img, index) => (
                      <Card key={index} className="overflow-hidden group">
                        <CardContent className="p-0">
                            <div className="aspect-square relative">
                                <Image src={img.url} alt={`Generated image ${index + 1}`} fill className="object-cover transition-transform group-hover:scale-105" />
                            </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                 {generatedImages.length === 0 && !isLoading && (
                    <div className="col-span-full text-center text-muted-foreground mt-8">
                        <p>No images generated yet. Use the chat to provide a prompt.</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
