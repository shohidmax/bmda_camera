'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Bell, ShieldAlert, Cpu, ToggleLeft, ToggleRight } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Notification Toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [sirenAlerts, setSirenAlerts] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/events/${user.uid}`);
        const data = await res.json();
        // Filters critical alerts (threatScore >= 80)
        const critical = (data.events || []).filter((e: any) => e.threatScore >= 80);
        setCriticalAlerts(critical);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  return (
    <div className="flex min-h-screen bg-base-300">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Alert Center</h2>
            <p className="text-sm text-base-content/60">Configure real-time push alerts and review recent high-threat incidents.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Column */}
          <div className="card bg-base-200 border border-base-100 shadow-xl lg:col-span-1">
            <div className="card-body p-6">
              <h3 className="card-title text-lg font-bold mb-4">Alert Preferences</h3>
              
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm">Push Notifications</h4>
                    <p className="text-2xs text-base-content/50">Immediate alerts in the browser.</p>
                  </div>
                  <button onClick={() => setPushAlerts(!pushAlerts)}>
                    {pushAlerts ? (
                      <ToggleRight className="w-10 h-10 text-primary cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-base-content/30 cursor-pointer" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm">Email Reports</h4>
                    <p className="text-2xs text-base-content/50">Hourly reports of camera activities.</p>
                  </div>
                  <button onClick={() => setEmailAlerts(!emailAlerts)}>
                    {emailAlerts ? (
                      <ToggleRight className="w-10 h-10 text-primary cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-base-content/30 cursor-pointer" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm">Central Webhook Siren</h4>
                    <p className="text-2xs text-base-content/50">Auto-execute sirens on critical triggers.</p>
                  </div>
                  <button onClick={() => setSirenAlerts(!sirenAlerts)}>
                    {sirenAlerts ? (
                      <ToggleRight className="w-10 h-10 text-primary cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-base-content/30 cursor-pointer" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Critical Warnings Log */}
          <div className="card bg-base-200 border border-base-100 shadow-xl lg:col-span-2">
            <div className="card-body p-6">
              <h3 className="card-title text-lg font-bold mb-4">High Threat Triggers Log</h3>

              {loading ? (
                <div className="flex justify-center py-12">
                  <span className="loading loading-spinner loading-md text-primary"></span>
                </div>
              ) : criticalAlerts.length === 0 ? (
                <div className="text-center py-16 text-base-content/40 space-y-2">
                  <Bell className="w-12 h-12 mx-auto opacity-45" />
                  <p className="font-bold text-sm">No Critical Incidents Flagged</p>
                  <p className="text-xs max-w-xs mx-auto">There are no logged threats with score &ge; 80% on your camera nodes.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {criticalAlerts.map((alert) => (
                    <div 
                      key={alert._id} 
                      className="alert alert-error bg-error/10 border border-error/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-error text-error-content p-2 rounded-xl shrink-0 mt-0.5 md:mt-0">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-base-content">{alert.message}</h4>
                          <p className="text-xs text-base-content/60 mt-0.5">
                            AI Report: {alert.aiReport.length > 80 ? alert.aiReport.substring(0, 80) + '...' : alert.aiReport}
                          </p>
                          <span className="text-2xs font-mono text-base-content/40 block mt-1">
                            {alert.time} | Device MAC: {alert.uid}
                          </span>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="badge badge-error font-bold text-2xs py-2 px-2.5">
                          {alert.threatScore}% Score
                        </span>
                        <span className="badge badge-neutral text-2xs uppercase">Alerted</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
