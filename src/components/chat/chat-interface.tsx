"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Send,
  ImageIcon,
  User,
  Bot,
  Loader2,
  Phone,
  Camera,
  MapPin,
  Tag,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { VoiceButton } from "./voice-button";
import { useLanguage } from "@/context/language-context";
import { useAppMode } from "@/context/app-mode-context";
import { useAuth } from "@/context/auth-context";
import type { TranslationKey } from "@/lib/i18n/translations";

export interface ChatProduct {
  id: string;
  title: string;
  title_ar?: string;
  description?: string | null;
  description_ar?: string | null;
  price: number;
  currency: string;
  condition?: string;
  is_negotiable?: boolean;
  image_url: string | null;
  category?: { slug: string; name: string; name_ar?: string } | null;
  seller?: { name: string; phone?: string; whatsapp?: string };
  location?: { region?: string; region_ar?: string };
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  image?: string;
  products?: ChatProduct[];
}

const MESSAGES_STORAGE_PREFIX = "pickpic_messages_";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.387 0-4.592-.838-6.313-2.236l-.44-.368-3.244 1.088 1.088-3.244-.368-.44A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
    </svg>
  );
}

// ============================================
// Product Detail Dialog
// ============================================

function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  locale,
  t,
}: {
  product: ChatProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  t: (key: TranslationKey) => string;
}) {
  if (!product) return null;

  const displayTitle =
    locale === "ar" && product.title_ar ? product.title_ar : product.title;
  const displayDescription =
    locale === "ar" && product.description_ar
      ? product.description_ar
      : product.description;
  const displayRegion =
    locale === "ar" && product.location?.region_ar
      ? product.location.region_ar
      : product.location?.region;
  const displayCategory =
    locale === "ar" && product.category?.name_ar
      ? product.category.name_ar
      : product.category?.name;

  const whatsappText =
    locale === "ar"
      ? `${t("product.whatsappMessage")} ${product.title_ar || product.title}`
      : `${t("product.whatsappMessage")} ${product.title}`;
  const whatsappLink = product.seller?.whatsapp
    ? `https://wa.me/${product.seller.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappText)}`
    : product.seller?.phone
      ? `https://wa.me/${product.seller.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappText)}`
      : null;

  const conditionLabels: Record<string, string> = {
    new: t("condition.new"),
    like_new: t("condition.like_new"),
    good: t("condition.good"),
    fair: t("condition.fair"),
    poor: t("condition.poor"),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
        {/* Product Image */}
        {product.image_url ? (
          <div className="relative aspect-[4/3] w-full bg-muted">
            <Image
              src={product.image_url}
              alt={displayTitle}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center">
            <Camera className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Title & Price */}
          <div>
            <DialogTitle className="text-xl font-bold">
              {displayTitle}
            </DialogTitle>
            <p className="text-2xl font-bold text-primary mt-1">
              {product.currency} {product.price.toLocaleString()}
              {product.is_negotiable && (
                <span className="text-sm font-normal text-muted-foreground ltr:ml-2 rtl:mr-2">
                  {t("product.negotiable")}
                </span>
              )}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {product.condition && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                {conditionLabels[product.condition] || product.condition}
              </span>
            )}
            {displayCategory && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border">
                <Tag className="h-3 w-3" />
                {displayCategory}
              </span>
            )}
          </div>

          {/* Description */}
          {displayDescription && (
            <div>
              <h4 className="text-sm font-semibold mb-1">
                {t("product.details")}
              </h4>
              <p className="text-sm text-muted-foreground">
                {displayDescription}
              </p>
            </div>
          )}

          {/* Seller & Location */}
          {(product.seller?.name || displayRegion) && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {product.seller?.name && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {product.seller.name}
                </span>
              )}
              {displayRegion && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {displayRegion}
                </span>
              )}
            </div>
          )}

          {/* Contact Buttons */}
          <div className="flex gap-2 pt-2">
            {(product.seller?.phone || product.seller?.whatsapp) && (
              <a
                href={`tel:${product.seller.phone || product.seller.whatsapp}`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full gap-2">
                  <Phone className="h-4 w-4" />
                  {t("product.call")}
                </Button>
              </a>
            )}
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                  <WhatsAppIcon className="h-4 w-4" />
                  {t("product.whatsapp")}
                </Button>
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Product Card
// ============================================

function ProductCard({
  product,
  locale,
  t,
  onViewDetails,
}: {
  product: ChatProduct;
  locale: string;
  t: (key: TranslationKey) => string;
  onViewDetails: () => void;
}) {
  const whatsappText =
    locale === "ar"
      ? `${t("product.whatsappMessage")} ${product.title_ar || product.title}`
      : `${t("product.whatsappMessage")} ${product.title}`;
  const whatsappLink = product.seller?.whatsapp
    ? `https://wa.me/${product.seller.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappText)}`
    : product.seller?.phone
      ? `https://wa.me/${product.seller.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappText)}`
      : null;
  const displayTitle =
    locale === "ar" && product.title_ar ? product.title_ar : product.title;
  const displayRegion =
    locale === "ar" && product.location?.region_ar
      ? product.location.region_ar
      : product.location?.region;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Clickable area - opens detail dialog */}
      <button
        onClick={onViewDetails}
        className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/50 transition-colors text-left"
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.title}
            width={64}
            height={64}
            className="rounded-md object-cover w-16 h-16 shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Camera className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{displayTitle}</p>
          <p className="text-sm text-primary font-bold">
            {product.currency} {product.price.toLocaleString()}
          </p>
          {product.seller?.name && (
            <p className="text-xs text-muted-foreground truncate">
              {product.seller.name}
              {displayRegion ? ` · ${displayRegion}` : ""}
            </p>
          )}
        </div>
      </button>

      {/* Contact buttons - always visible when seller info exists */}
      <div className="flex border-t divide-x rtl:divide-x-reverse">
        {(product.seller?.phone || product.seller?.whatsapp) && (
          <a
            href={`tel:${product.seller.phone || product.seller.whatsapp}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            {t("product.call")}
          </a>
        )}
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            {t("product.whatsapp")}
          </a>
        )}
        {/* View details fallback when no contact info */}
        {!product.seller?.phone && !product.seller?.whatsapp && (
          <button
            onClick={onViewDetails}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary hover:bg-muted/50 transition-colors"
          >
            {t("product.details")}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================
// Chat Interface
// ============================================

interface ChatInterfaceProps {
  /** "full" = full-page chat (homepage), "widget" = compact widget */
  variant?: "full" | "widget";
  className?: string;
}

export function ChatInterface({
  variant = "full",
  className,
}: ChatInterfaceProps) {
  const isWidget = variant === "widget";
  const { t, locale } = useLanguage();

  // AppMode context - only available in full variant (not widget)
  let appModeCtx: ReturnType<typeof useAppMode> | null = null;
  try {
    appModeCtx = useAppMode();
  } catch {
    // Widget variant may not have AppModeProvider
  }

  // Auth context - check if user is logged in (AuthProvider is in root layout)
  const { user: authUser } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ChatProduct | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Current chat ID for persistence (this is the server session ID for logged-in users)
  const currentChatId = appModeCtx?.currentChatId;

  // Load messages when chat changes - from server for logged-in users, localStorage for anonymous
  useEffect(() => {
    if (!currentChatId) {
      setMessages([]);
      setSessionId(null);
      setIsLoading(false);
      return;
    }

    // Set session ID from the chat ID (they're the same for server-persisted chats)
    setSessionId(currentChatId);

    // Try loading from server first (for logged-in users)
    if (authUser) {
      setMessagesLoading(true);
      fetch(`/api/chats/${currentChatId}/messages`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.messages?.length > 0) {
            setMessages(
              data.messages.map((m: { id: string; role: string; text: string; image?: string; products?: ChatProduct[] }) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                text: m.text,
                image: m.image,
                products: m.products,
              }))
            );
          } else {
            setMessages([]);
          }
        })
        .catch(() => {
          setMessages([]);
        })
        .finally(() => {
          setMessagesLoading(false);
        });
    } else {
      // Anonymous: load from localStorage
      try {
        const saved = localStorage.getItem(MESSAGES_STORAGE_PREFIX + currentChatId);
        if (saved) {
          setMessages(JSON.parse(saved) as ChatMessage[]);
        } else {
          setMessages([]);
        }
      } catch {
        setMessages([]);
      }
    }
  }, [currentChatId, authUser]);

  // Save messages to localStorage (for anonymous users as backup)
  useEffect(() => {
    if (currentChatId && messages.length > 0 && !authUser) {
      try {
        localStorage.setItem(
          MESSAGES_STORAGE_PREFIX + currentChatId,
          JSON.stringify(messages)
        );
      } catch {
        // localStorage full or unavailable
      }
    }
  }, [messages, currentChatId, authUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Upload image to S3 first, then return the public URL
  const uploadImageToS3 = useCallback(async (file: File): Promise<string> => {
    const presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content_type: file.type,
        folder: "chat",
      }),
    });

    if (!presignRes.ok) {
      throw new Error("Failed to get upload URL");
    }

    const { upload_url, public_url } = await presignRes.json();

    const uploadRes = await fetch(upload_url, {
      method: "PUT",
      body: file,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error("S3 upload error:", uploadRes.status, errText);
      throw new Error(`Upload failed: ${uploadRes.status}`);
    }

    return public_url;
  }, []);

  const sendMessage = useCallback(
    async (text: string, file?: File | null) => {
      if (!text && !file) return;

      // Show user message with local preview
      const localPreview = file ? URL.createObjectURL(file) : undefined;
      const userMsgId = Date.now().toString();
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: "user",
        text: text || t("chat.imageSearch"),
        image: localPreview,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInputValue("");
      setImagePreview(null);
      setImageFile(null);
      setIsLoading(true);

      try {
        // Upload image to S3 if present
        let imageUrl: string | undefined;
        if (file) {
          imageUrl = await uploadImageToS3(file);
          // Replace blob URL with S3 URL for persistence
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMsgId ? { ...m, image: imageUrl } : m
            )
          );
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            message: text || undefined,
            image_url: imageUrl || undefined,
            location: { country_code: "KW", language: locale },
          }),
        });

        const data = await res.json();

        // If this is a new session, update the session ID and refresh sidebar
        if (data.session_id && data.session_id !== sessionId) {
          setSessionId(data.session_id);
          // For logged-in users: tell the sidebar to select this new chat
          if (authUser && appModeCtx) {
            appModeCtx.refreshChats();
            appModeCtx.selectChat(data.session_id);
          }
        }

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: data.message?.content || t("chat.found"),
          products: data.message?.products || [],
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            text: t("chat.error"),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, uploadImageToS3, locale, t, authUser, appModeCtx]
  );

  const handleSend = () => {
    sendMessage(inputValue, imageFile);
  };

  const handleVoiceTranscript = (transcript: string) => {
    sendMessage(transcript);
  };

  // Check if user is logged in before allowing image upload
  const handleImageButtonClick = (ref: React.RefObject<HTMLInputElement | null>) => {
    if (!authUser) {
      setShowLoginPrompt(true);
      return;
    }
    ref.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleSuggestion = (text: string) => {
    sendMessage(text);
  };

  const showWelcome = messages.length === 0 && !messagesLoading;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Messages area */}
      <ScrollArea className={cn("flex-1", isWidget ? "p-3" : "p-4 md:p-6")}>
        <div
          className={cn(
            "space-y-4 mx-auto",
            isWidget ? "max-w-full" : "max-w-2xl"
          )}
        >
          {/* Loading messages from server */}
          {messagesLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Welcome screen */}
          {showWelcome && (
            <div
              className={cn(
                "flex flex-col items-center text-center",
                isWidget ? "py-6" : "py-12 md:py-20"
              )}
            >
              <div
                className={cn(
                  "rounded-full bg-primary/10 flex items-center justify-center mb-4",
                  isWidget ? "h-12 w-12" : "h-16 w-16"
                )}
              >
                <Bot
                  className={cn(
                    "text-primary",
                    isWidget ? "h-6 w-6" : "h-8 w-8"
                  )}
                />
              </div>
              <h2
                className={cn(
                  "font-bold",
                  isWidget ? "text-lg" : "text-2xl md:text-3xl"
                )}
              >
                {t("chat.welcome")}
              </h2>
              <p
                className={cn(
                  "text-muted-foreground mt-2",
                  isWidget ? "text-sm" : "text-base"
                )}
              >
                {t("chat.subtitle")}
              </p>

              <div
                className={cn(
                  "grid gap-2 w-full mt-6",
                  isWidget
                    ? "grid-cols-1 max-w-[260px]"
                    : "grid-cols-1 sm:grid-cols-3 max-w-lg"
                )}
              >
                {[
                  { icon: "🚗", text: t("chat.suggest.car") },
                  { icon: "📱", text: t("chat.suggest.phone") },
                  { icon: "🏠", text: t("chat.suggest.apartment") },
                ].map((s) => (
                  <button
                    key={s.text}
                    onClick={() => handleSuggestion(s.text)}
                    className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm hover:bg-muted/50 transition-colors text-left"
                  >
                    <span>{s.icon}</span>
                    <span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id}>
              <div
                className={cn(
                  "flex gap-2.5",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "rounded-full flex items-center justify-center shrink-0",
                    isWidget ? "h-7 w-7" : "h-8 w-8",
                    msg.role === "user" ? "bg-muted" : "bg-primary/10"
                  )}
                >
                  {msg.role === "user" ? (
                    <User
                      className={cn(isWidget ? "h-3.5 w-3.5" : "h-4 w-4")}
                    />
                  ) : (
                    <Bot
                      className={cn(isWidget ? "h-3.5 w-3.5" : "h-4 w-4")}
                    />
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-lg p-3 text-sm",
                    isWidget ? "max-w-[80%]" : "max-w-[70%]",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {msg.image && (
                    <Image
                      src={msg.image}
                      alt="Uploaded"
                      width={isWidget ? 120 : 200}
                      height={isWidget ? 120 : 200}
                      className="rounded-md mb-2"
                    />
                  )}
                  {msg.text}
                </div>
              </div>
              {msg.products && msg.products.length > 0 && (
                <div
                  className={cn(
                    "mt-2 space-y-2",
                    isWidget ? "ml-9" : "ml-10"
                  )}
                >
                  {msg.products.slice(0, isWidget ? 3 : 5).map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      locale={locale}
                      t={t}
                      onViewDetails={() => setSelectedProduct(p)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5">
              <div
                className={cn(
                  "rounded-full flex items-center justify-center bg-primary/10 shrink-0",
                  isWidget ? "h-7 w-7" : "h-8 w-8"
                )}
              >
                <Bot
                  className={cn(isWidget ? "h-3.5 w-3.5" : "h-4 w-4")}
                />
              </div>
              <div className="rounded-lg p-3 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div
        className={cn(
          "border-t bg-background",
          isWidget ? "p-2.5" : "p-4"
        )}
      >
        <div className={cn("mx-auto", isWidget ? "max-w-full" : "max-w-2xl")}>
          {imagePreview && (
            <div className="relative inline-block mb-2">
              <Image
                src={imagePreview}
                alt="Preview"
                width={60}
                height={60}
                className="rounded-md"
              />
              <button
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                }}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-5 w-5 text-xs flex items-center justify-center"
              >
                &times;
              </button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2 items-center"
          >
            {/* Gallery pick */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => handleImageButtonClick(fileInputRef)}
              disabled={isLoading}
              title={t("chat.imageSearch")}
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />

            {/* Camera capture */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => handleImageButtonClick(cameraInputRef)}
              disabled={isLoading}
              title={t("chat.camera")}
            >
              <Camera className="h-5 w-5" />
            </Button>
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleImageChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {/* Text input */}
            <Input
              placeholder={t("chat.placeholder")}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />

            {/* Voice - now on right side of input */}
            <VoiceButton
              onTranscript={handleVoiceTranscript}
              disabled={isLoading}
            />

            {/* Send */}
            <Button
              type="submit"
              size="icon"
              className="shrink-0"
              disabled={isLoading || (!inputValue && !imageFile)}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}
        locale={locale}
        t={t}
      />

      {/* Login Required Dialog - shown when unauthenticated user tries to upload image */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            {locale === "ar" ? "تسجيل الدخول مطلوب" : "Login Required"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {locale === "ar"
              ? "يرجى تسجيل الدخول أو إنشاء حساب لتتمكن من رفع الصور والبحث بها."
              : "Please log in or create an account to upload images and search with them."}
          </p>
          <div className="flex gap-3 mt-2">
            <Button asChild className="flex-1">
              <Link href="/login" onClick={() => setShowLoginPrompt(false)}>
                {locale === "ar" ? "تسجيل الدخول" : "Log In"}
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/register" onClick={() => setShowLoginPrompt(false)}>
                {locale === "ar" ? "إنشاء حساب" : "Sign Up"}
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
