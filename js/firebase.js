// Buddy's accounts run on Firebase Authentication, which stores the passwords, keeps
// people signed in and slows down password guessing. The settings below identify the
// Firebase project. They aren't secrets: Firebase expects them in the page.
// Firebase JavaScript SDK 13.3.0 (https://www.npmjs.com/package/firebase), from Google's CDN.
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.3.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDC78qlGic5AfAvcsqMteFX6y5OJRCyP40",
  authDomain: "buddy-15d98.firebaseapp.com",
  projectId: "buddy-15d98",
  storageBucket: "buddy-15d98.firebasestorage.app",
  messagingSenderId: "265864877510",
  appId: "1:265864877510:web:c11e5d67c65051b599cec7",
};

export const auth = getAuth(initializeApp(firebaseConfig));

// The signed-in user once Firebase has restored any saved session, or null
export async function currentUser() {
  await auth.authStateReady();
  return auth.currentUser;
}

// A fresh ID token for the backend to check, or null when nobody is signed in
export async function idToken() {
  const user = await currentUser();
  return user ? user.getIdToken() : null;
}

// Plain-language versions of Firebase's error codes
const MESSAGES = {
  "auth/email-already-in-use": "That email is already registered. Try signing in instead.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/missing-email": "Please enter your email address.",
  "auth/missing-password": "Please enter your password.",
  "auth/weak-password": "Your password needs at least 8 characters.",
  "auth/password-does-not-meet-requirements": "That password is too weak. Please try a longer one.",
  "auth/invalid-credential": "That email and password don't match an account.",
  "auth/invalid-login-credentials": "That email and password don't match an account.",
  "auth/wrong-password": "That email and password don't match an account.",
  "auth/user-not-found": "That email and password don't match an account.",
  "auth/user-disabled": "This account has been switched off.",
  "auth/too-many-requests": "Too many attempts. Please wait a few minutes, or use Forgot Password to reset it.",
  "auth/network-request-failed": "Can't reach the sign-in service. Please check your connection and try again.",
  "auth/requires-recent-login": "For your security, please log out and sign in again, then try that once more.",
  "auth/operation-not-allowed": "Email sign-in isn't switched on for this app yet.",
  "auth/configuration-not-found": "Sign-in isn't set up for this app yet.",
  "auth/admin-restricted-operation": "New sign-ups are switched off right now.",
};

export function friendlyError(error) {
  console.error("Firebase:", error?.code || error);
  return MESSAGES[error?.code] || "Something went wrong. Please try again.";
}

// chat.js is a plain script, so it gets the token through window
window.buddyAuth = { idToken };
window.dispatchEvent(new Event("buddy-auth-ready"));
