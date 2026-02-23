"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useLanguage } from "@/context/language-context";
import { useAppMode } from "@/context/app-mode-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Globe,
  LogOut,
  Loader2,
  Save,
  Store,
  Hash,
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/translations";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  countryCode: string;
  preferredLanguage: string;
  avatarUrl?: string;
  role: string;
  seller?: {
    phonePublic: string;
    businessName?: string;
    isVerified: boolean;
    rating: number;
    totalSales: number;
  };
  createdAt: string;
}

interface SellerProfile {
  businessName?: string;
  phonePublic?: string;
  rating?: number;
  totalSales?: number;
  isVerified?: boolean;
  isProfileComplete?: boolean;
  user?: {
    nationalId?: string;
  };
}

export function SettingsPanel() {
  const { user, signOut } = useAuth();
  const { t, locale } = useLanguage();
  const { setCurrentView } = useAppMode();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);

  // Unified form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(""); // single phone — saves to user + seller
  const [nationalId, setNationalId] = useState("");
  const [businessName, setBusinessName] = useState("");

  // Save states
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sellerSaving, setSellerSaving] = useState(false);
  const [sellerSaved, setSellerSaved] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, sellerRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/seller/profile"),
      ]);

      let userPhone = "";
      if (meRes.ok) {
        const data = await meRes.json();
        if (data.user) {
          setProfile(data.user);
          setName(data.user.name || "");
          userPhone = data.user.phone || "";
        }
      }

      if (sellerRes.ok) {
        const data = await sellerRes.json();
        if (data.profile) {
          setSellerProfile(data.profile);
          setBusinessName(data.profile.businessName || "");
          setNationalId(data.profile.user?.nationalId || "");
          // Prefer user.phone, fall back to seller.phonePublic
          setPhone(userPhone || data.profile.phonePublic || "");
        } else {
          setPhone(userPhone);
        }
      } else {
        setPhone(userPhone);
      }
    } catch (err) {
      console.error("Failed to fetch profiles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchAll();
  }, [user, fetchAll]);

  // Save name + phone — also syncs phone to seller.phonePublic & whatsappNumber
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await Promise.all([
        fetch("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone }),
        }),
        fetch("/api/seller/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phonePublic: phone,
            whatsappNumber: phone,
            businessName,
            nationalId,
          }),
        }),
      ]);
      await fetchAll();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  // Save only seller-specific fields (nationalId, businessName) — phone already in sync
  const handleSellerSave = async () => {
    setSellerSaving(true);
    setSellerSaved(false);
    try {
      const res = await fetch("/api/seller/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phonePublic: phone,
          whatsappNumber: phone,
          businessName,
          nationalId,
        }),
      });
      if (res.ok) {
        await fetchAll();
        setSellerSaved(true);
        setTimeout(() => setSellerSaved(false), 2000);
      }
    } catch (err) {
      console.error("Failed to save seller profile:", err);
    } finally {
      setSellerSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {t("sell.loginRequired" as TranslationKey)}
        </h2>
        <Button onClick={() => setCurrentView("chat")} variant="outline" className="mt-4">
          <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          {t("settings.backToChat" as TranslationKey)}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 md:px-6 py-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView("chat")}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">
          {t("sidebar.settings" as TranslationKey)}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-lg mx-auto space-y-8">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* ── User Profile Section ── */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {(profile?.name || profile?.email || "U")
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {profile?.name || profile?.email}
                    </h2>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    {profile?.seller?.isVerified && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                        {t("settings.verified" as TranslationKey)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("settings.name" as TranslationKey)}
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("settings.namePlaceholder" as TranslationKey)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("settings.email" as TranslationKey)}
                    </label>
                    <Input value={profile?.email || ""} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("settings.emailHint" as TranslationKey)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("settings.phone" as TranslationKey)}
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+965 XXXX XXXX"
                      type="tel"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("settings.language" as TranslationKey)}
                    </label>
                    <div className="flex items-center gap-2">
                      <LanguageSwitcher />
                      <span className="text-sm text-muted-foreground">
                        {locale === "ar" ? "العربية" : "English"}
                      </span>
                    </div>
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? (
                      <><Loader2 className="h-4 w-4 animate-spin ltr:mr-2 rtl:ml-2" />{t("dashboard.saving" as TranslationKey)}</>
                    ) : saved ? (
                      <><Save className="h-4 w-4 ltr:mr-2 rtl:ml-2" />{t("settings.saved" as TranslationKey)}</>
                    ) : (
                      <><Save className="h-4 w-4 ltr:mr-2 rtl:ml-2" />{t("dashboard.save" as TranslationKey)}</>
                    )}
                  </Button>
                </div>
              </div>

              {/* ── Seller Profile Section ── */}
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      {t("settings.sellerProfile" as TranslationKey)}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("settings.sellerProfileDesc" as TranslationKey)}
                    </p>
                  </div>
                  {sellerProfile !== null && (
                    sellerProfile.isProfileComplete ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        {t("settings.profileComplete" as TranslationKey)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full shrink-0">
                        <AlertCircle className="h-3 w-3" />
                        {t("settings.profileIncomplete" as TranslationKey)}
                      </span>
                    )
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("settings.nationalId" as TranslationKey)}
                    </label>
                    <Input
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="XXXXXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {t("settings.businessName" as TranslationKey)}
                    </label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder={locale === "ar" ? "اسم المتجر (اختياري)" : "Store name (optional)"}
                    />
                  </div>

                  <Button onClick={handleSellerSave} disabled={sellerSaving} className="w-full">
                    {sellerSaving ? (
                      <><Loader2 className="h-4 w-4 animate-spin ltr:mr-2 rtl:ml-2" />{t("dashboard.saving" as TranslationKey)}</>
                    ) : sellerSaved ? (
                      <><Save className="h-4 w-4 ltr:mr-2 rtl:ml-2" />{t("settings.sellerSaved" as TranslationKey)}</>
                    ) : (
                      <><Save className="h-4 w-4 ltr:mr-2 rtl:ml-2" />{t("dashboard.save" as TranslationKey)}</>
                    )}
                  </Button>
                </div>
              </div>

              {/* ── Seller Stats ── */}
              {sellerProfile && (
                <div className="border-t pt-6 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {t("settings.sellerInfo" as TranslationKey)}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-2xl font-bold">{sellerProfile.totalSales ?? 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("settings.totalSales" as TranslationKey)}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-2xl font-bold">
                        {Number(sellerProfile.rating ?? 0).toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("settings.rating" as TranslationKey)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Seller Dashboard Link ── */}
              <div className="border-t pt-6">
                <Link href="/seller/dashboard" target="_blank">
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Store className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {t("settings.sellerDashboard" as TranslationKey)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("settings.sellerDashboardDesc" as TranslationKey)}
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>
              </div>

              {/* ── Sign out ── */}
              <div className="border-t pt-6">
                <Button
                  variant="outline"
                  onClick={() => signOut()}
                  className="w-full text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t("nav.logout" as TranslationKey)}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
