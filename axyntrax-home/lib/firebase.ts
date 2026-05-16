import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

// Configuración protegida para evitar fallos en build
const isConfigValid = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your_firebase_api_key_here';

const firebaseConfig = {
  apiKey: isConfigValid ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY : "AIzaSyDummyKeyForBuild",
  authDomain: "axyntrax-automation.firebaseapp.com",
  projectId: "axyntrax-automation",
  storageBucket: "axyntrax-automation.appspot.com",
  messagingSenderId: "991740590",
  appId: "1:991740590:web:axyntrax",
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Use experimentalForceLongPolling for stable serverless connection
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export { app, auth, db };
