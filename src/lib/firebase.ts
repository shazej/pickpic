import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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
} catch (e) {
    app = initializeApp(firebaseConfig, appName);
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage, firebaseConfig };
