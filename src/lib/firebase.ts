import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update, push, child, Database } from "firebase/database";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, Firestore } from "firebase/firestore";

// Firebase web configuration (read from process.env or fallback to demo config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoKeyForPadDispenser12345",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sanitary-pad-dispenser.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://sanitary-pad-dispenser-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sanitary-pad-dispenser",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sanitary-pad-dispenser.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456789"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let db: Database | null = null;
let firestore: Firestore | null = null;

try {
  db = getDatabase(app);
  firestore = getFirestore(app);
} catch (e) {
  console.warn("Firebase initialization notice:", e);
}

export { app, db, firestore };
