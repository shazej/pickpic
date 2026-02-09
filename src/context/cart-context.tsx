"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export type CartItem = {
    productId: string;
    title: string;
    price: number;
    image: string;
    quantity: number;
    sellerId: string;
};

type CartContextType = {
    items: CartItem[];
    addToCart: (item: Omit<CartItem, "quantity">) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const { toast } = useToast();

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('cart');
        if (saved) {
            try {
                setItems(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    const addToCart = (newItem: Omit<CartItem, "quantity">) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === newItem.productId);
            if (existing) {
                toast({ title: "Updated quantity", description: `${newItem.title} quantity updated.` });
                return prev.map(i => i.productId === newItem.productId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            toast({ title: "Added to cart", description: `${newItem.title} added to cart.` });
            return [...prev, { ...newItem, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setItems(prev => prev.filter(i => i.productId !== productId));
    };

    const clearCart = () => {
        setItems([]);
    };

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within CartProvider");
    return context;
};
