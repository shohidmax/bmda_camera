import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getAuth, 
  signInWithEmailAndPassword as fbSignIn,
  createUserWithEmailAndPassword as fbCreateUser,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const hasFirebaseKeys = 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'placeholder';

let app: any;
let auth: any;
let analytics: any;

// Initialize Firebase client or mock
if (hasFirebaseKeys) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    
    // Initialize Analytics only in client-side environments supporting it
    if (typeof window !== 'undefined') {
      isSupported().then(supported => {
        if (supported) {
          analytics = getAnalytics(app);
          console.log('Firebase Analytics initialized successfully.');
        }
      });
    }
  } catch (err) {
    console.error('Firebase initialization error, switching to mock mode:', err);
    auth = null;
  }
}

// Define mock user type
export interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

// Global state for mock authentication
let mockCurrentUser: MockUser | null = null;
const mockAuthListeners: ((user: MockUser | null) => void)[] = [];

// Helper to notify listeners
const notifyListeners = () => {
  mockAuthListeners.forEach(listener => listener(mockCurrentUser));
};

// Auto-login a demo user in mock mode for instant experience
if (!auth) {
  if (typeof window !== 'undefined') {
    const savedUser = localStorage.getItem('demo_user');
    if (savedUser) {
      mockCurrentUser = JSON.parse(savedUser);
    }
  }
}

// Mock auth exports
export const mockAuth = {
  signInWithEmailAndPassword: async (email: string) => {
    // Artificial delay
    await new Promise(resolve => setTimeout(resolve, 800));
    mockCurrentUser = {
      uid: 'mock-user-123',
      email: email,
      displayName: email.split('@')[0].toUpperCase(),
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_user', JSON.stringify(mockCurrentUser));
    }
    notifyListeners();
    return { user: mockCurrentUser };
  },
  
  createUserWithEmailAndPassword: async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    mockCurrentUser = {
      uid: 'mock-user-' + Math.random().toString(36).substr(2, 9),
      email: email,
      displayName: email.split('@')[0].toUpperCase(),
      photoURL: `https://api.dicebear.com/7.x/adventurer/svg?seed=${email}`
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_user', JSON.stringify(mockCurrentUser));
    }
    notifyListeners();
    return { user: mockCurrentUser };
  },

  signInWithGoogle: async () => {
    await new Promise(resolve => setTimeout(resolve, 800));
    mockCurrentUser = {
      uid: 'mock-google-user-999',
      email: 'demo.visitor@gmail.com',
      displayName: 'Demo Visitor',
      photoURL: 'https://api.dicebear.com/7.x/adventurer/svg?seed=visitor'
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('demo_user', JSON.stringify(mockCurrentUser));
    }
    notifyListeners();
    return { user: mockCurrentUser };
  },

  signOut: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    mockCurrentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demo_user');
    }
    notifyListeners();
  },

  onAuthStateChanged: (callback: (user: any | null) => void) => {
    mockAuthListeners.push(callback);
    // Instant initial check
    callback(mockCurrentUser);
    return () => {
      const index = mockAuthListeners.indexOf(callback);
      if (index > -1) mockAuthListeners.splice(index, 1);
    };
  }
};

// Safe wrapper functions to use either Real Firebase or Mock
export const loginWithEmail = async (email: string, pass: string) => {
  if (auth) {
    return fbSignIn(auth, email, pass);
  } else {
    return mockAuth.signInWithEmailAndPassword(email);
  }
};

export const registerWithEmail = async (email: string, pass: string) => {
  if (auth) {
    return fbCreateUser(auth, email, pass);
  } else {
    return mockAuth.createUserWithEmailAndPassword(email);
  }
};

export const loginWithGoogle = async () => {
  if (auth) {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  } else {
    return mockAuth.signInWithGoogle();
  }
};

export const logoutUser = async () => {
  if (auth) {
    return fbSignOut(auth);
  } else {
    return mockAuth.signOut();
  }
};

export const subscribeToAuthState = (callback: (user: any | null) => void) => {
  if (auth) {
    return fbOnAuthStateChanged(auth, callback);
  } else {
    return mockAuth.onAuthStateChanged(callback);
  }
};

export { app, auth };
