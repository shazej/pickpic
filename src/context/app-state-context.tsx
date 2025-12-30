"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type AppMode = "buyer" | "seller"

interface AppStateContextType {
    mode: AppMode
    setMode: (mode: AppMode) => void
    toggleMode: () => void
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
    const [mode, setModeState] = useState<AppMode>("buyer")

    useEffect(() => {
        // Restore mode from local storage
        const stored = localStorage.getItem("pickpic.appMode") as AppMode
        if (stored === "buyer" || stored === "seller") {
            setModeState(stored)
        }
    }, [])

    const setMode = (newMode: AppMode) => {
        setModeState(newMode)
        localStorage.setItem("pickpic.appMode", newMode)
    }

    const toggleMode = () => {
        setMode(mode === "buyer" ? "seller" : "buyer")
    }

    return (
        <AppStateContext.Provider value={{ mode, setMode, toggleMode }}>
            {children}
        </AppStateContext.Provider>
    )
}

export function useAppState() {
    const context = useContext(AppStateContext)
    if (!context) {
        throw new Error("useAppState must be used within an AppStateProvider")
    }
    return context
}
