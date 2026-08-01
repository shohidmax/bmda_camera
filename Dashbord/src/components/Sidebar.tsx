'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Video, 
  History, 
  Bell, 
  PhoneCall, 
  LifeBuoy, 
  AlertCircle, 
  LogOut,
  User,
  Users,
  Radio,
  Sun,
  Moon
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<string>('dark');

  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('aegis_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('aegis_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Shield },
    { name: 'Devices & Control', path: '/devices', icon: Video },
    { name: 'Threat History', path: '/history', icon: History },
    { name: 'ESP Signals', path: '/esp-data', icon: Radio },
    { name: 'Alert Center', path: '/notifications', icon: Bell },
    ...(user && user.role === 'admin' ? [{ name: 'Manage Access', path: '/access', icon: Users }] : []),
    { name: 'File Complaint', path: '/complain', icon: AlertCircle },
    { name: 'Get Support', path: '/support', icon: LifeBuoy },
    { name: 'Contact Us', path: '/contact', icon: PhoneCall },
  ];

  if (!user) return null;

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="lg:hidden flex items-center justify-between bg-base-200 border-b border-base-100 p-4 sticky top-0 z-40 w-full shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-content p-1.5 rounded-lg shadow-lg shadow-primary/20">
            <Shield className="w-5 h-5 animate-pulse" />
          </div>
          <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AEGIS EYE
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="btn btn-ghost btn-circle btn-sm text-base-content"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-warning" /> : <Moon className="w-5 h-5 text-primary" />}
          </button>

          <button 
            onClick={() => setIsMobileOpen(true)}
            className="btn btn-ghost btn-circle btn-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-base-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Overlay Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar Content */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-80 bg-base-200 border-r border-base-100 flex flex-col justify-between shrink-0 transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col overflow-y-auto">
          {/* Brand */}
          <div className="p-6 flex items-center justify-between border-b border-base-100">
            <div className="flex items-center gap-3">
              <div className="bg-primary text-primary-content p-2 rounded-xl shadow-lg shadow-primary/20">
                <Shield className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  AEGIS EYE
                </h1>
                <span className="text-xs font-semibold text-base-content/75 uppercase tracking-widest">
                  AI Security Portal
                </span>
              </div>
            </div>
            {/* Close button inside mobile drawer */}
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden btn btn-ghost btn-circle btn-sm text-base-content/80"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link 
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 group ${
                    isActive 
                      ? 'bg-primary text-primary-content shadow-lg shadow-primary/10' 
                      : 'text-base-content/70 hover:bg-base-100 hover:text-base-content'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? 'text-primary-content' : 'text-base-content/70 group-hover:text-primary'
                  }`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Footer */}
        <div className="p-4 border-t border-base-100 bg-base-300/40 space-y-3">
          <div className="flex items-center gap-3 p-2">
            <div className="avatar">
              <div className="w-10 h-10 rounded-xl ring-2 ring-primary/20">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User Avatar" />
                ) : (
                  <div className="bg-neutral text-neutral-content flex items-center justify-center h-full w-full">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-hidden">
              <h4 className="font-semibold text-sm truncate text-base-content flex items-center gap-1.5">
                <span>{user.displayName || 'Security Operator'}</span>
                {user.role && (
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold shrink-0 ${
                    user.role === 'admin' ? 'bg-error/15 text-error border border-error/20' :
                    user.role === 'manager' ? 'bg-warning/15 text-warning border border-warning/20' :
                    'bg-info/15 text-info border border-info/20'
                  }`}>
                    {user.role}
                  </span>
                )}
              </h4>
              <p className="text-xs text-base-content/75 truncate">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={toggleTheme}
              className="btn btn-outline btn-sm flex-1 gap-2 rounded-xl border-base-content/20 hover:bg-base-100 text-base-content font-medium"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-warning" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-primary" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
            <button 
              onClick={logout}
              className="btn btn-outline btn-error btn-sm gap-1.5 rounded-xl border-dashed border-base-content/20 hover:border-solid group px-3"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
