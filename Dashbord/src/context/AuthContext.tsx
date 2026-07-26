'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { subscribeToAuthState } from '../utils/firebase';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050';
const PUBLIC_ROUTES = ['/login', '/register', '/reset-password', '/contact', '/support', '/complain'];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      if (currentUser) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName
            })
          });
          const data = await response.json();
          if (data.success && data.user) {
            setUser({
              ...currentUser,
              role: data.user.role,
              accessibleDevices: data.user.accessibleDevices || []
            });
          } else {
            setUser(currentUser);
          }
        } catch (err) {
          console.error('Error syncing user profile:', err);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);

      // Simple routing guard
      const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
      if (!currentUser && !isPublicRoute) {
        router.push('/login');
      } else if (currentUser && pathname === '/login') {
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
    const { logoutUser } = await import('../utils/firebase');
    await logoutUser();
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
