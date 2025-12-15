const isServer = typeof window === "undefined";
if (isServer) {
    // Mock localStorage to prevent libraries from crashing on SSR
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).localStorage = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
        clear: () => { },
    };
}

import { initializeApp, getApp } from "firebase/app";
import { getAuth, initializeAuth, browserLocalPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? undefined : undefined // Optional
};

// Debug log to help verifying config loading
if (typeof window !== 'undefined') {
    console.log("Firebase Config Keys Loaded:", Object.keys(firebaseConfig).filter(k => firebaseConfig[k as keyof typeof firebaseConfig]));
}

// Initialize Firebase with a unique name to avoid HMR collisions
const appName = "PICKPIC_APP";
let app;
try {
    app = getApp(appName);
} catch {
    app = initializeApp(firebaseConfig, appName);
}

// Initialize Firebase Auth
let auth;
try {
    const isServer = typeof window === "undefined";
    auth = initializeAuth(app, {
        persistence: isServer ? inMemoryPersistence : browserLocalPersistence,
    });
} catch (e) {
    console.error("Firebase initializeAuth failed:", e);
    try {
        auth = getAuth(app);
    } catch (e2) {
        console.error("Firebase getAuth failed:", e2);
    }
}

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, firebaseConfig };
