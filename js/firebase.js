/* ==========================================================================
   INDIGO MUSEUM — firebase.js
   Firebase Web SDK v11 (Modular) — initialization + Firestore handle
   ----------------------------------------------------------------------------
   REPLACE the placeholder firebaseConfig object below with your project's
   credentials from the Firebase Console (Project settings → General → Your
   apps → Web app → Config). Do NOT commit real API keys of a project you
   want kept private — for public GitHub Pages sites, Firebase security is
   enforced by firestore.rules, not by hiding the config.
   ========================================================================== */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDRWZUwqP0iTU3szFlrJJqTcE18iR_AtMk",
  authDomain: "indigo-museum.firebaseapp.com",
  projectId: "indigo-museum",
  storageBucket: "indigo-museum.firebasestorage.app",
  messagingSenderId: "394339706466",
  appId: "1:394339706466:web:f0e25d8a3da67e488e133b",
  measurementId: "G-TQ0DWXBJKP"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit };
