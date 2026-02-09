"use client"

import React, { useState } from "react"
import { ShoppingAssistant } from "@/components/app/shopping-assistant"

export function BuyerMode() {
    // We can keep the state if we want to toggle between "Classic Search" and "Assistant"
    // But given the "make design like this" request, we'll default to the Assistant.
    return (
        <div className="animate-in fade-in duration-500 pb-20">
            <ShoppingAssistant />
        </div>
    )
}
