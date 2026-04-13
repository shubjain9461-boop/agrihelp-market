// ═══════════════════════════════════════════════════════════════
//  AGRIHELP — Firebase Configuration
//  
//  STEP: Replace the values below with YOUR Firebase project config.
//  Get it from: Firebase Console → Project Settings → Your Apps → SDK setup
// ═══════════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ─── YOUR FIREBASE CONFIG (replace with your actual values) ──────
const firebaseConfig = {

  apiKey: "AIzaSyAlGAUd9ZDt8lYdRA2lMdYQq0VEGoXfed0",
  authDomain: "nc3project-4b843.firebaseapp.com",
  projectId: "nc3project-4b843",
  storageBucket: "nc3project-4b843.firebasestorage.app",
  messagingSenderId: "883191920553",
  appId: "1:883191920553:web:3d67d0547534af0de176b8",
};

// ─── INITIALIZE FIREBASE ──────────────────────────────────────────
const app = initializeApp(firebaseConfig);

// ─── EXPORT SERVICES ─────────────────────────────────────────────
export const auth = getAuth(app);
export const db = getFirestore(app);
