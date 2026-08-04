import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_API_KEY = "AIzaSyDSqcpsRq64j4LbkmeOjeUIpa91HlFpZvc";
const AUTH_STORAGE_KEY = "@aegis_eye_user_auth";

let authListeners: Array<(user: any) => void> = [];

function notifyListeners(user: any) {
  authListeners.forEach(listener => listener(user));
}

export async function signInWithEmailAndPassword(authObj: any, email: string, pass: string) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: pass,
      returnSecureToken: true
    })
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'Authentication failed');
  }

  const user = {
    uid: data.localId,
    email: data.email,
    displayName: data.displayName || email.split('@')[0],
    idToken: data.idToken
  };

  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  notifyListeners(user);
  return { user };
}

export async function createUserWithEmailAndPassword(authObj: any, email: string, pass: string) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: pass,
      returnSecureToken: true
    })
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'Registration failed');
  }

  const user = {
    uid: data.localId,
    email: data.email,
    displayName: email.split('@')[0],
    idToken: data.idToken
  };

  await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  notifyListeners(user);
  return { user };
}

export async function signOut(authObj: any) {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  notifyListeners(null);
}

export function onAuthStateChanged(authObj: any, callback: (user: any) => void) {
  authListeners.push(callback);

  // Load initial state
  AsyncStorage.getItem(AUTH_STORAGE_KEY).then(stored => {
    if (stored) {
      try {
        callback(JSON.parse(stored));
      } catch (e) {
        callback(null);
      }
    } else {
      callback(null);
    }
  }).catch(() => callback(null));

  return () => {
    authListeners = authListeners.filter(l => l !== callback);
  };
}

export const auth = {};
