'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SellerAuthCardProps {
  title: string;
  description: string;
  buttonText: string;
  footerText: string;
  footerLink: string;
  footerLinkText: string;
  isLogin?: boolean;
}

export function SellerAuthCard({
  title,
  description,
  buttonText,
  footerText,
  footerLink,
  footerLinkText,
  isLogin = false,
}: SellerAuthCardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAuth = async () => {
    setLoading(true);
    try {
      const { signInWithEmailAndPassword, createUserWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');

      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Login Successful',
          description: 'Redirecting to your dashboard...',
        });
        router.push('/seller/dashboard');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Account Created',
          description: 'Welcome! Redirecting to your dashboard...',
        });
        router.push('/seller/dashboard');
      }
    } catch (error: any) {
      console.error(error);
      let errorMessage = 'An error occurred. Please try again.';
      if (error.code === 'auth/invalid-credential') errorMessage = 'Invalid email or password.';
      if (error.code === 'auth/email-already-in-use') errorMessage = 'Email is already in use.';
      if (error.code === 'auth/weak-password') errorMessage = 'Password should be at least 6 characters.';

      toast({
        variant: 'destructive',
        title: isLogin ? 'Login Failed' : 'Sign Up Failed',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <Button className="w-full" onClick={handleAuth} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {buttonText}
        </Button>
        <div className="mt-4 text-center text-sm">
          {footerText}{' '}
          <Link href={footerLink} className="underline">
            {footerLinkText}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
