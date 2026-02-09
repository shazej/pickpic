"use client"

import React from "react"
import { AppStateProvider, useAppState } from "@/context/app-state-context"
import { AppShell } from "@/components/app/app-shell"
import { BuyerMode } from "@/components/app/buyer-mode"
import { SellerMode } from "@/components/app/seller-mode"

function AppContent() {
    const { mode } = useAppState()

    return (
        <AppShell>
            {mode === "buyer" ? <BuyerMode /> : <SellerMode />}
        </AppShell>
    )
}

export default function AppPage() {
    return (
        <AppStateProvider>
            <AppContent />
        </AppStateProvider>
    )
}
