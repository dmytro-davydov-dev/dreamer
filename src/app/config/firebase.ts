// src/app/config/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  connectAuthEmulator,
  type Auth,
  onAuthStateChanged,
  type User,
  type UserCredential,
} from "firebase/auth";

export type FirebaseServices = {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
};

let services: FirebaseServices | null = null;

/**
 * Call once at app startup (e.g. main.tsx).
 * Uses env vars (Vite-style) by default.
 */
export function initFirebase(): FirebaseServices {
  if (services) return services;

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
  };

  const app = getApps().length ? getApps()[0]! : initializeApp(config);
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Optional: local emulators
  if (import.meta.env.DEV && (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true")) {
    // Firestore
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    // Auth
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }

  services = { app, db, auth };
  return services;
}

/** Get Firestore. Requires initFirebase() to have been called. */
export function getDb(): Firestore {
  if (!services) throw new Error("Firebase not initialized. Call initFirebase() first.");
  return services.db;
}

/** Get Auth. Requires initFirebase() to have been called. */
export function getAuthService(): Auth {
  if (!services) throw new Error("Firebase not initialized. Call initFirebase() first.");
  return services.auth;
}

/** Sign in an existing user with email + password. */
export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  const auth = getAuthService();
  return signInWithEmailAndPassword(auth, email, password);
}

/** Register a new user with email + password. */
export async function signUpWithEmail(email: string, password: string): Promise<UserCredential> {
  const auth = getAuthService();
  return createUserWithEmailAndPassword(auth, email, password);
}

/** Sign in anonymously (guest mode). Returns the Firebase User. */
export async function signInAsGuest(): Promise<User> {
  const auth = getAuthService();
  const cred = await signInAnonymously(auth);
  return cred.user;
}

/** Sign out the current user. */
export async function signOutUser(): Promise<void> {
  const auth = getAuthService();
  await firebaseSignOut(auth);
}

/**
 * Ensures the user is signed in anonymously.
 * Returns the Firebase User.
 */
export async function ensureAnonymousAuth(): Promise<User> {
  const auth = getAuthService();

  // Always wait for onAuthStateChanged — it fires only after the SDK has fully
  // initialized auth state (including token refresh). Returning auth.currentUser
  // early can hand back a user whose token hasn't been refreshed yet, causing
  // a transient permission-denied on the first Firestore snapshot.
  const user = await new Promise<User>((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      async (u) => {
        unsub();
        try {
          if (u) return resolve(u);
          const cred = await signInAnonymously(auth);
          resolve(cred.user);
        } catch (e) {
          reject(e);
        }
      },
      reject
    );
  });

  return user;
}
