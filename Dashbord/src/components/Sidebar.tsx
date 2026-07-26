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
  Users
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Shield },
    { name: 'Devices & Control', path: '/devices', icon: Video },
    { name: 'Threat History', path: '/history', icon: History },
    { name: 'Alert Center', path: '/notifications', icon: Bell },
    ...(user && user.role === 'admin' ? [{ name: 'Manage Access', path: '/access', icon: Users }] : []),
    { name: 'File Complaint', path: '/complain', icon: AlertCircle },
    { name: 'Get Support', path: '/support', icon: LifeBuoy },
    { name: 'Contact Us', path: '/contact', icon: PhoneCall },
  ];

  if (!user) return null;

  return (
    <aside className="w-80 bg-base-200 border-r border-base-100 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div className="flex flex-col overflow-y-auto">
        {/* Brand */}
        <div className="p-6 flex items-center gap-3 border-b border-base-100">
          <div className="bg-primary text-primary-content p-2 rounded-xl shadow-lg shadow-primary/20">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AEGIS EYE
            </h1>
            <span className="text-xs font-semibold text-base-content/50 uppercase tracking-widest">
              AI Security Portal
            </span>
          </div>
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
                  isActive ? 'text-primary-content' : 'text-base-content/40 group-hover:text-primary'
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
            <p className="text-xs text-base-content/50 truncate">
              {user.email}
            </p>
          </div>
        </div>

        <button 
          onClick={logout}
          className="btn btn-outline btn-error btn-sm w-full gap-2 rounded-xl border-dashed border-base-content/20 hover:border-solid group"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
