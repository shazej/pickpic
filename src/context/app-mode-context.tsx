"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export type AppMode = "buy" | "sell";
export type AppView = "chat" | "settings" | "listings";

export interface ChatEntry {
  id: string;
  title: string;
  mode: AppMode;
  createdAt: number;
}

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  chats: ChatEntry[];
  currentChatId: string | null;
  startNewChat: () => void;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;
  updateChatTitle: (title: string) => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

const STORAGE_KEY_MODE = "pickpic_mode";
const STORAGE_KEY_CHATS = "pickpic_chats";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("buy");
  const [currentView, setCurrentViewState] = useState<AppView>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Load persisted state on mount
  useEffect(() => {
    const savedMode = localStorage.getItem(STORAGE_KEY_MODE) as AppMode | null;
    if (savedMode === "buy" || savedMode === "sell") {
      setModeState(savedMode);
    }
    try {
      const savedChats = localStorage.getItem(STORAGE_KEY_CHATS);
      if (savedChats) {
        setChats(JSON.parse(savedChats));
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist chats
  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats));
    }
  }, [chats]);

  const setMode = useCallback((newMode: AppMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY_MODE, newMode);
    setCurrentChatId(null);
    setCurrentViewState("chat");
  }, []);

  const setCurrentView = useCallback((view: AppView) => {
    setCurrentViewState(view);
    setSidebarOpen(false);
  }, []);

  const startNewChat = useCallback(() => {
    const id = generateId();
    const entry: ChatEntry = {
      id,
      title: mode === "buy" ? "New search" : "New listing",
      mode,
      createdAt: Date.now(),
    };
    setChats((prev) => [entry, ...prev]);
    setCurrentChatId(id);
    setCurrentViewState("chat");
    setSidebarOpen(false);
  }, [mode]);

  const selectChat = useCallback((id: string) => {
    const chat = chats.find((c) => c.id === id);
    if (chat) {
      setModeState(chat.mode);
      setCurrentChatId(id);
      setCurrentViewState("chat");
      setSidebarOpen(false);
    }
  }, [chats]);

  const deleteChat = useCallback((id: string) => {
    setChats((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(updated));
      return updated;
    });
    // Also remove persisted messages for this chat
    try {
      localStorage.removeItem(`pickpic_messages_${id}`);
    } catch {
      // ignore
    }
    if (currentChatId === id) {
      setCurrentChatId(null);
    }
  }, [currentChatId]);

  const updateChatTitle = useCallback((title: string) => {
    if (!currentChatId) return;
    setChats((prev) =>
      prev.map((c) =>
        c.id === currentChatId ? { ...c, title: title.slice(0, 50) } : c
      )
    );
  }, [currentChatId]);

  return (
    <AppModeContext.Provider
      value={{
        mode,
        setMode,
        currentView,
        setCurrentView,
        sidebarOpen,
        setSidebarOpen,
        chats,
        currentChatId,
        startNewChat,
        selectChat,
        deleteChat,
        updateChatTitle,
      }}
    >
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error("useAppMode must be used within an AppModeProvider");
  }
  return context;
}
