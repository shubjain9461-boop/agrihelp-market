/* ═══════════════════════════════════════════════════════════════
   AGRIHELP — Firebase Auth + Firestore Logic   (firebase-app.js)

   This ES module patches the global functions defined in index.html
   with real Firebase versions. It uses window.STATE and
   window.currentRole (exposed via var declarations in index.html).
═══════════════════════════════════════════════════════════════ */

import { auth, db } from './firebase-config.js';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ─── Shorthand helpers (use window.* so we share inline STATE) ──
const S     = () => window.STATE;          // the shared global state
const toast = (m, t) => window.showToast?.(m, t);
const esc   = (s) => window.escHtml?.(s) ?? s;

/* ════════════════════════════════════════════════════════════════
   🔥 SIGNUP
════════════════════════════════════════════════════════════════ */
window.handleSignup = async function () {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameEl   = document.getElementById('su-name');
  const emailEl  = document.getElementById('su-email');
  const mobileEl = document.getElementById('su-mobile');
  const passEl   = document.getElementById('su-pass');

  if (!nameEl || !emailEl || !mobileEl || !passEl) {
    toast('❌ Signup form elements not found. Check the page.', 'error'); return;
  }

  const name   = nameEl.value.trim();
  const email  = emailEl.value.trim();
  const mobile = mobileEl.value.trim();
  const pass   = passEl.value;

  if (!name || !email || !mobile || !pass) { toast('⚠️ Please fill in all fields', 'error'); return; }
  if (!emailRegex.test(email))              { toast('⚠️ Invalid email format', 'error'); return; }
  if (!/^\d{10}$/.test(mobile))             { toast('⚠️ Mobile must be 10 digits', 'error'); return; }
  if (pass.length < 6)                      { toast('⚠️ Password must be at least 6 characters', 'error'); return; }

  const role = window.currentRole || 'farmer';

  try {
    toast('⏳ Creating account…');
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid  = cred.user.uid;

    // ── Write user profile to Firestore /users/{uid} ───────────
    await setDoc(doc(db, 'users', uid), {
      name, email, mobile, role,
      createdAt:   serverTimestamp(),
      rating:      0,
      ratingCount: 0,
      isActive:    true,
      location: { lat: S().farmerLat, lng: S().farmerLng }
    });

    // ── Update SHARED window.STATE.user ────────────────────────
    S().user = { uid, name, email, role };

    toast('✅ Account created!', 'success');
    window.launchApp?.();
  } catch (err) {
    console.error('Signup error:', err);
    const msgs = {
      'auth/email-already-in-use': '⚠️ Email already registered. Try logging in.',
      'auth/weak-password':        '⚠️ Password too weak. Use 6+ characters.',
      'auth/invalid-email':        '⚠️ Invalid email address.',
      'auth/operation-not-allowed':'⚠️ Email sign-in not enabled. Check Firebase Console → Auth → Sign-in method.',
    };
    toast(msgs[err.code] || '❌ Signup failed: ' + err.message, 'error');
  }
};

/* ════════════════════════════════════════════════════════════════
   🔥 LOGIN
════════════════════════════════════════════════════════════════ */
window.handleLogin = async function () {
  const emailEl = document.getElementById('login-email');
  const passEl  = document.getElementById('login-pass');

  if (!emailEl || !passEl) {
    toast('❌ Login form elements not found.', 'error'); return;
  }

  const email = emailEl.value.trim();
  const pass  = passEl.value;

  if (!email || !pass) { toast('⚠️ Please fill in all fields', 'error'); return; }
  if (pass.length < 6) { toast('⚠️ Password must be at least 6 characters', 'error'); return; }

  try {
    toast('⏳ Logging in…');
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const uid  = cred.user.uid;

    // ── Read profile from Firestore ────────────────────────────
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      const data = snap.data();
      S().user = { uid, name: data.name, email: data.email, role: data.role };
      window.currentRole = data.role;   // sync the global role selector
    } else {
      // First-time login without a profile — create one
      const name = email.split('@')[0].replace(/\d/g, '').replace(/^./, c => c.toUpperCase()) || 'User';
      const role = window.currentRole || 'farmer';
      S().user = { uid, name, email, role };
      await setDoc(doc(db, 'users', uid), {
        name, email, role,
        createdAt: serverTimestamp(), rating: 0, ratingCount: 0, isActive: true
      });
    }

    toast('✅ Welcome back!', 'success');
    window.launchApp?.();
  } catch (err) {
    console.error('Login error:', err);
    const msgs = {
      'auth/user-not-found':     '⚠️ No account found. Please sign up first.',
      'auth/wrong-password':     '⚠️ Incorrect password.',
      'auth/invalid-credential': '⚠️ Invalid email or password.',
      'auth/too-many-requests':  '⚠️ Too many attempts. Please wait.',
      'auth/operation-not-allowed':'⚠️ Email sign-in disabled. Enable it in Firebase Console.',
    };
    toast(msgs[err.code] || '❌ Login failed: ' + err.message, 'error');
  }
};

/* ════════════════════════════════════════════════════════════════
   🔥 LOGOUT
════════════════════════════════════════════════════════════════ */
window.handleLogout = async function () {
  if (S().unsubscribeBuyers) { S().unsubscribeBuyers(); S().unsubscribeBuyers = null; }
  await signOut(auth);
  S().user = null;
  S().mapReady = false;
  document.getElementById('app').classList.remove('active');
  document.getElementById('auth-screen').classList.remove('hidden');
  toast('👋 Logged out');
};

/* ════════════════════════════════════════════════════════════════
   🔥 AUTH STATE OBSERVER — auto-login if Firebase session exists
════════════════════════════════════════════════════════════════ */
onAuthStateChanged(auth, async (firebaseUser) => {
  if (firebaseUser && !S().user) {
    try {
      const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        S().user = { uid: firebaseUser.uid, name: data.name, email: data.email, role: data.role };
        window.currentRole = data.role;
        window.launchApp?.();
      }
    } catch (err) {
      console.error('Auto-login error:', err);
    }
  }
});

/* ════════════════════════════════════════════════════════════════
   🔥 REAL-TIME FIRESTORE LISTENER — new buyer requirements
════════════════════════════════════════════════════════════════ */
function startFirestoreListener() {
  if (S().unsubscribeBuyers) S().unsubscribeBuyers();

  const q = query(
    collection(db, 'buyers'),
    where('isActive', '==', true),
    orderBy('postedAt', 'desc')
  );

  S().unsubscribeBuyers = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      const d = change.doc.data();
      const buyer = {
        id:            change.doc.id,
        name:          d.buyerName || d.name || 'Unknown',
        emoji:         d.emoji || '??',
        type:          d.type || 'Wholesaler',
        product:       d.product || '',
        qty:           d.qty || 0,
        price:         d.price || 0,
        lat:           d.lat || 18.5204,
        lng:           d.lng || 73.8567,
        phone:         d.phone || '',
        deadline:      d.deadline || 'Open',
        rating:        d.rating || 4.0,
        reviews:       d.reviews || 0,
        urgent:        d.urgent || false,
        highValue:     d.highValue || false,
        fromFirestore: true,
        distance: haversine(S().farmerLat, S().farmerLng, d.lat || 18.5204, d.lng || 73.8567)
      };

      if (change.type === 'added') {
        if (!S().buyers.some(b => b.id === buyer.id)) {
          S().buyers.push(buyer);
          if (S().user) window.addNotification?.(`🆕 New: ${buyer.name} needs ${buyer.qty}qt ${buyer.product}`);
        }
      } else if (change.type === 'modified') {
        const idx = S().buyers.findIndex(b => b.id === buyer.id);
        if (idx !== -1) S().buyers[idx] = { ...S().buyers[idx], ...buyer };
      } else if (change.type === 'removed') {
        S().buyers = S().buyers.filter(b => b.id !== buyer.id);
      }
    });

    window.applyFilters?.();
  }, (err) => {
    console.error('Firestore listener error:', err);
    toast('⚠️ Real-time sync error', 'error');
  });
}

/* ════════════════════════════════════════════════════════════════
   🔥 LOAD BUYERS — seed data + Firestore live data merged
════════════════════════════════════════════════════════════════ */
window.loadBuyersWithDistance = function () {
  const SEED = window.SEED_BUYERS || [];
  S().buyers = SEED.map(b => ({
    ...b,
    distance: haversine(S().farmerLat, S().farmerLng, b.lat, b.lng)
  }));
  window.applyFilters?.();
  try { startFirestoreListener(); }
  catch (err) { console.error('Firestore connect error:', err); }
};

/* ════════════════════════════════════════════════════════════════
   🔥 POST BUYER REQUIREMENT → Firestore /buyers
════════════════════════════════════════════════════════════════ */
window.postRequirement = async function () {
  const product  = document.getElementById('pf-product')?.value;
  const qty      = document.getElementById('pf-qty')?.value;
  const price    = document.getElementById('pf-price')?.value;
  const phone    = document.getElementById('pf-phone')?.value;
  const deadline = document.getElementById('pf-deadline')?.value;
  const type     = document.getElementById('pf-type')?.value;

  if (!product || !qty || !price || !phone) {
    toast('⚠️ Please fill all required fields', 'error'); return;
  }

  try {
    toast('⏳ Posting requirement…');
    const emoji = S().user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

    const docRef = await addDoc(collection(db, 'buyers'), {
      buyerId:   S().user?.uid || 'anonymous',
      buyerName: S().user?.name || 'Buyer',
      emoji, type, product,
      qty:       parseInt(qty),
      price:     parseInt(price),
      phone, deadline: deadline || 'Open',
      lat: S().farmerLat, lng: S().farmerLng,
      rating: 4.0, reviews: 0, urgent: false,
      highValue: parseInt(price) > 3000,
      isActive:  true,
      postedAt:  serverTimestamp(),
      fromFirestore: true
    });

    // Also push to local state immediately (listener will also pick it up)
    const localReq = {
      id: docRef.id, product, qty: parseInt(qty), price: parseInt(price),
      phone, deadline: deadline || 'Open', type,
      postedAt: new Date().toLocaleTimeString(), fromFirestore: true
    };
    S().postedRequirements.push(localReq);
    S().stats.contacts++;
    S().stats.distanceSaved += Math.floor(Math.random() * 30 + 10);

    window.renderPostedList?.();
    window.updateDashStats?.();

    ['pf-qty', 'pf-price', 'pf-phone', 'pf-deadline'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const pSel = document.getElementById('pf-product');
    if (pSel) pSel.selectedIndex = 0;

    toast('✅ Requirement posted & saved to Firebase!', 'success');
    window.addNotification?.(`🔔 New buyer: ${product} — ₹${parseInt(price).toLocaleString()}/qt`, true);
  } catch (err) {
    console.error('Post requirement error:', err);
    toast('❌ Failed to post: ' + err.message, 'error');
  }
};

/* ════════════════════════════════════════════════════════════════
   🔥 DELETE BUYER REQUIREMENT
════════════════════════════════════════════════════════════════ */
window.deletePost = async function (id) {
  try {
    const post = S().postedRequirements.find(r => r.id === id);
    if (post?.fromFirestore) {
      await deleteDoc(doc(db, 'buyers', String(id)));
    }
    S().postedRequirements = S().postedRequirements.filter(r => r.id !== id);
    S().buyers = S().buyers.filter(b => b.id !== id);
    window.renderPostedList?.();
    window.applyFilters?.();
    window.updateDashStats?.();
    toast('🗑 Requirement removed');
  } catch (err) {
    console.error('Delete error:', err);
    toast('❌ Failed to delete: ' + err.message, 'error');
  }
};

/* ════════════════════════════════════════════════════════════════
   🔥 SEND CHAT MESSAGE → Firestore /messages
════════════════════════════════════════════════════════════════ */
window.sendChatMessage = async function () {
  const input = document.getElementById('chat-input');
  const text  = input?.value.trim();
  if (!text) return;

  const msgs = document.getElementById('chat-messages');
  if (msgs) { msgs.innerHTML += `<div class="msg me">${esc(text)}</div>`; msgs.scrollTop = msgs.scrollHeight; }
  if (input) input.value = '';

  // Save to Firestore
  try {
    if (S().user && S().selectedBuyer) {
      await addDoc(collection(db, 'messages'), {
        senderId:    S().user.uid,
        senderName:  S().user.name,
        recipientId: String(S().selectedBuyer.id),
        content:     text,
        sentAt:      serverTimestamp(),
        read:        false
      });
    }
  } catch (err) { console.error('Message save error:', err); }

  // Auto-reply simulation (keeps existing UX)
  setTimeout(() => {
    const replies = [
      'Yes, we are interested! What is the quality grade?',
      'Can you deliver within 3 days?',
      'We can offer ₹200 more for certified organic produce.',
      'Please send a sample first. We will finalize quantity.',
      'Our warehouse is ready. When can you deliver?',
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    if (msgs) { msgs.innerHTML += `<div class="msg them">${reply}</div>`; msgs.scrollTop = msgs.scrollHeight; }
  }, 1200 + Math.random() * 800);
};

/* ════════════════════════════════════════════════════════════════
   🔥 SAVE RATING → Firestore /ratings
════════════════════════════════════════════════════════════════ */
window.rateBuyer = async function (stars) {
  document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('active', i < stars));
  toast(`⭐ Rated ${stars} star${stars > 1 ? 's' : ''}! Thank you.`);

  if (S().selectedBuyer && S().user) {
    try {
      await addDoc(collection(db, 'ratings'), {
        ratedById:      S().user.uid,
        ratedByName:    S().user.name,
        ratedBuyerId:   String(S().selectedBuyer.id),
        ratedBuyerName: S().selectedBuyer.name,
        stars,
        ratedAt: serverTimestamp()
      });
      // Update local state
      const b = S().selectedBuyer;
      b.rating = +((b.rating * b.reviews + stars) / (b.reviews + 1)).toFixed(1);
      b.reviews++;
      S().stats.rating = stars;
    } catch (err) { console.error('Rating save error:', err); }
  }
};

// ─── Haversine (copy needed in module scope) ──────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

console.log('🔥 Firebase module loaded — Auth + Firestore active');
