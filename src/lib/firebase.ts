// src/lib/firebase.ts

// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDUxVKYP3W_39arLLgn2503aK-_NWS0miU",
  authDomain: "docu-pro-b881d.firebaseapp.com",
  projectId: "docu-pro-b881d",
  storageBucket: "docu-pro-b881d.appspot.com",
  messagingSenderId: "202449295035",
  appId: "1:202449295035:web:496e033e1f1b31c6f6bb9e"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, storage };