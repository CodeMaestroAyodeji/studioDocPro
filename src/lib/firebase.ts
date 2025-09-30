// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

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
const db = getFirestore(app);

// Enable multi-tab persistence
if (typeof window !== 'undefined') {
    enableMultiTabIndexedDbPersistence(db).catch((err) => {
        if (err.code == 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time.
            console.warn('Firestore persistence failed: multiple tabs open.');
        } else if (err.code == 'unimplemented') {
            // The current browser does not support all of the
            // features required to enable this persistence mode.
            console.warn('Firestore persistence is not available in this browser.');
        }
    });
}

export { app, auth, db };
