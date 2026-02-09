
'use client';

import Link from 'next/link';
import { SellerAuthCard } from '@/components/seller-auth-card';
import { Package2 } from 'lucide-react';

import { useLanguage } from '@/components/i18n/LanguageContext';

export default function SellerSignupPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-muted/40">
      <div className="absolute top-8 left-8 flex items-center gap-2 font-semibold">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <Package2 className="h-6 w-6 text-primary" />
          <span className="text-xl font-headline">Ecomm Now</span>
        </Link>
      </div>
      <SellerAuthCard
        title={t('auth.seller_signup_title')}
        description={t('auth.seller_signup_desc')}
        buttonText={t('auth.sign_up')}
        footerText={t('auth.has_account')}
        footerLink="/seller/login"
        footerLinkText={t('auth.login_cta')}
        isLogin={false}
      />
    </div>
  );
}
