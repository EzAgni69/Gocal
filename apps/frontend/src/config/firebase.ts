import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCfYEUrIjWmjLtVv96yjPHpFU0dPeGKmsU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "vanij-32b55.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "vanij-32b55",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "vanij-32b55.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "247882474478",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:247882474478:web:052f2035a74e08306c24ff",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-GTQ8WH30DG",
};

// Initialize Firebase only if it hasn't been initialized already
if (process.env.NODE_ENV === 'development') {
  if (firebaseConfig.apiKey === "AIzaSy-dummy-key-for-build") {
    console.warn("⚠️ Firebase is using the DUMMY API KEY. Please check your .env.local file.");
  } else {
    console.log("🔥 Firebase initialized with project:", firebaseConfig.projectId);
  }
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export default app;
