'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, 
  CheckCircle, 
  Activity, 
  Cpu, 
  Plus, 
  RefreshCw, 
  Zap,
  Play,
  ArrowRight,
  Video
} from 'lucide-react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050';

export default function DashboardHome() {
  const { user, loading: authLoading } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeAlerts: 0,
    threatsDetected: 0,
    systemStatus: 'Healthy'
  });
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [playingDevices, setPlayingDevices] = useState<Record<string, boolean>>({});
  const [selectedSimDevice, setSelectedSimDevice] = useState<string>('');
  const [selectedFilterDevice, setSelectedFilterDevice] = useState<string>('all');

  const deviceMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    devices.forEach((d) => {
      map[d.uid.toUpperCase()] = d.deviceName;
    });
    return map;
  }, [devices]);

  const togglePlay = (deviceId: string) => {
    setPlayingDevices((prev) => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }));
  };

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch devices
      const devRes = await fetch(`${BACKEND_URL}/api/devices/${user.uid}`);
      const devData = await devRes.json();
      const userDevices = devData.devices || [];
      setDevices(userDevices);
      if (userDevices.length > 0 && !selectedSimDevice) {
        setSelectedSimDevice(userDevices[0].uid);
      }

      // Fetch events
      const evRes = await fetch(`${BACKEND_URL}/api/events/${user.uid}`);
      const evData = await evRes.json();
      const userEvents = evData.events || [];
      setEvents(userEvents);

      // Calculate stats
      const activeAlerts = userEvents.filter((e: any) => e.threatScore >= 80).length;
      const threatsDetected = userEvents.filter((e: any) => e.threatScore >= 60).length;

      setStats({
        totalDevices: userDevices.length,
        activeAlerts,
        threatsDetected,
        systemStatus: 'Online'
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  // Simulate a physical ESP32 D4 trigger
  const handleSimulateTrigger = async () => {
    if (devices.length === 0) {
      alert('Please register at least one camera device first in the "Devices" tab!');
      return;
    }
    
    const targetDevice = devices.find(d => d.uid === selectedSimDevice) || devices[0];
    setSimulating(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: targetDevice.uid,
          time: new Date().toISOString().replace('T', ' ').substring(0, 19),
          action: 'PIN_HIGH',
          message: `Simulation: Trigger detected on D4 for ${targetDevice.deviceName}`,
          zone_code: targetDevice.zoneCode
        })
      });
      
      const resData = await response.json();
      if (resData.success) {
        // Poll for changes 3 seconds later (give time for snapshots/AI to run)
        setTimeout(async () => {
          await fetchDashboardData();
          setSimulating(false);
        }, 4000);
      } else {
        alert('Simulation failed: ' + resData.error);
        setSimulating(false);
      }
    } catch (err: any) {
      alert('Error triggering simulation: ' + err.message);
      setSimulating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-base-300">
        <span className="loading loading-ring loading-lg text-primary"></span>
      </div>
    );
  }

  // Filtered Events list for home preview
  const filteredEvents = events.filter(e => {
    if (selectedFilterDevice !== 'all' && e.uid.toUpperCase() !== selectedFilterDevice.toUpperCase()) {
      return false;
    }
    if (activeTab === 'alerts') return e.threatScore >= 80;
    if (activeTab === 'suspicious') return e.threatScore >= 50 && e.threatScore < 80;
    return true;
  }).slice(0, 5);

  return (
    <div className="flex min-h-screen bg-base-300">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Operator Dashboard</h2>
            <p className="text-sm text-base-content/60">Monitor cameras, check active AI threats and hardware nodes.</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={fetchDashboardData}
              className={`btn btn-circle btn-outline btn-neutral ${loading ? 'loading' : ''}`}
              title="Refresh Dashboard"
            >
              {!loading && <RefreshCw className="w-5 h-5" />}
            </button>

            {devices.length > 0 && (
              <select
                value={selectedSimDevice}
                onChange={(e) => setSelectedSimDevice(e.target.value)}
                className="select select-bordered select-sm rounded-xl bg-base-200 text-xs font-semibold border-base-100/50"
                disabled={simulating}
              >
                {devices.map(d => (
                  <option key={d.uid} value={d.uid}>
                    Trigger: {d.deviceName}
                  </option>
                ))}
              </select>
            )}

            <button 
              onClick={handleSimulateTrigger}
              disabled={simulating || devices.length === 0}
              className="btn btn-primary btn-sm rounded-xl gap-2 shadow-lg shadow-primary/20"
            >
              {simulating ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Analyzing AI...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  Simulate (D4)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stats shadow-lg bg-base-200 border border-base-100">
            <div className="stat">
              <div className="stat-title text-base-content/50">Active Devices</div>
              <div className="stat-value text-primary flex items-center gap-2">
                <Cpu className="w-8 h-8" />
                {stats.totalDevices}
              </div>
              <div className="stat-desc mt-1">Paired and transmitting</div>
            </div>
          </div>

          <div className="stats shadow-lg bg-base-200 border border-base-100">
            <div className="stat">
              <div className="stat-title text-base-content/50">High Threat Incidents</div>
              <div className="stat-value text-error flex items-center gap-2">
                <ShieldAlert className="w-8 h-8" />
                {stats.activeAlerts}
              </div>
              <div className="stat-desc text-error/80 mt-1 font-medium">Requires immediate attention</div>
            </div>
          </div>

          <div className="stats shadow-lg bg-base-200 border border-base-100">
            <div className="stat">
              <div className="stat-title text-base-content/50">Total AI Flags</div>
              <div className="stat-value text-warning flex items-center gap-2">
                <Activity className="w-8 h-8" />
                {stats.threatsDetected}
              </div>
              <div className="stat-desc mt-1">Threat Score &gt; 50%</div>
            </div>
          </div>

          <div className="stats shadow-lg bg-base-200 border border-base-100">
            <div className="stat">
              <div className="stat-title text-base-content/50">Operational Health</div>
              <div className="stat-value text-success flex items-center gap-2">
                <CheckCircle className="w-8 h-8" />
                {stats.systemStatus}
              </div>
              <div className="stat-desc mt-1 text-success">All subsystems green</div>
            </div>
          </div>
        </div>

        {/* Setup Prompt if No Devices */}
        {devices.length === 0 && !loading && (
          <div className="hero bg-base-200 border border-base-100 rounded-3xl p-8 mb-8 shadow-inner">
            <div className="hero-content text-center flex-col max-w-md">
              <Cpu className="w-16 h-16 text-primary/60 mb-2 animate-bounce" />
              <h3 className="text-2xl font-bold">No Device Paired</h3>
              <p className="py-2 text-sm text-base-content/60">
                You must register an ESP32 hardware device (identified by its MAC address) to start receiving trigger requests and capturing AI analysis.
              </p>
              <Link href="/devices" className="btn btn-primary gap-2 mt-2">
                <Plus className="w-4 h-4" /> Pair a Device
              </Link>
            </div>
          </div>
        )}

        {/* Live Camera Grid Preview */}
        {devices.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Active Feeds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map((dev) => {
                const isPlaying = playingDevices[dev._id];
                const isHtmlStream = dev.cameraUrl.includes('.html') || dev.cameraUrl.includes('stream');
                
                return (
                  <div key={dev._id} className="card bg-base-200 shadow-xl border border-base-100 overflow-hidden">
                    <div 
                      onClick={() => togglePlay(dev._id)}
                      className="relative aspect-video bg-black flex items-center justify-center cursor-pointer group"
                    >
                      {isPlaying ? (
                        <iframe 
                          src={dev.cameraUrl}
                          title={dev.deviceName}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : (
                        <>
                          {!isHtmlStream ? (
                            <img 
                              src={dev.cameraUrl} 
                              alt={dev.deviceName} 
                              className="w-full h-full object-cover brightness-90 group-hover:scale-[1.02] transition-all duration-500" 
                            />
                          ) : (
                            <div className="absolute inset-0 bg-neutral/80 flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-neutral/95">
                              <Video className="w-12 h-12 text-primary/60 mb-2 group-hover:scale-110 transition-transform duration-300" />
                              <span className="text-xs text-base-content/40 font-mono">Stream Ready: {dev.deviceName}</span>
                            </div>
                          )}
                          
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-14 h-14 rounded-full bg-primary text-primary-content flex items-center justify-center shadow-lg shadow-primary/40 transform group-hover:scale-110 transition-all duration-300">
                              <Play className="w-6 h-6 fill-current translate-x-0.5" />
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* Badges on top */}
                      <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md pointer-events-none">
                        <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-error animate-pulse' : 'bg-success animate-ping'}`}></span>
                        <span>{isPlaying ? 'STREAMING' : 'LIVE'} | {dev.deviceName}</span>
                      </div>
                      <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-md font-mono pointer-events-none">
                        {dev.uid}
                      </div>
                    </div>
                    
                    <div className="card-body p-4 flex-row justify-between items-center bg-base-200/50">
                      <div>
                        <h4 className="font-bold text-base-content">{dev.deviceName}</h4>
                        <p className="text-xs text-base-content/50">Zone: {dev.zoneCode} | {dev.cameraUrl}</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlay(dev._id);
                        }}
                        className={`btn btn-xs rounded-lg font-semibold ${isPlaying ? 'btn-error' : 'btn-success'}`}
                      >
                        {isPlaying ? 'Stop Feed' : 'Start Feed'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Events logs */}
        <div className="card bg-base-200 border border-base-100 shadow-xl">
          <div className="card-body p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="card-title text-xl font-bold">Threat Activity Log</h3>
                <p className="text-xs text-base-content/50">Latest triggers and threat scoring generated by the main engine AI.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <select
                  value={selectedFilterDevice}
                  onChange={(e) => setSelectedFilterDevice(e.target.value)}
                  className="select select-bordered select-sm rounded-xl bg-base-300 text-xs font-semibold border-base-100/50"
                >
                  <option value="all">All Devices</option>
                  {devices.map(d => (
                    <option key={d.uid} value={d.uid}>{d.deviceName}</option>
                  ))}
                </select>

                <div className="tabs tabs-boxed bg-base-300">
                  <button 
                    onClick={() => setActiveTab('all')} 
                    className={`tab tab-sm font-semibold transition-all ${activeTab === 'all' ? 'tab-active bg-primary text-primary-content' : ''}`}
                  >
                    All Logs
                  </button>
                  <button 
                    onClick={() => setActiveTab('alerts')} 
                    className={`tab tab-sm font-semibold transition-all ${activeTab === 'alerts' ? 'tab-active bg-primary text-primary-content' : ''}`}
                  >
                    Critical (80+)
                  </button>
                  <button 
                    onClick={() => setActiveTab('suspicious')} 
                    className={`tab tab-sm font-semibold transition-all ${activeTab === 'suspicious' ? 'tab-active bg-primary text-primary-content' : ''}`}
                  >
                    Suspicious
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-base-content/40">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="font-medium text-sm">No activity recorded for this criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((evt) => {
                  let badgeColor = 'badge-ghost';
                  let borderAlert = 'border-base-100';
                  if (evt.threatScore >= 80) {
                    badgeColor = 'badge-error';
                    borderAlert = 'border-l-4 border-l-error';
                  } else if (evt.threatScore >= 50) {
                    badgeColor = 'badge-warning';
                    borderAlert = 'border-l-4 border-l-warning';
                  } else if (evt.threatScore > 10) {
                    badgeColor = 'badge-info';
                  }
                  
                  return (
                    <div 
                      key={evt._id} 
                      className={`collapse collapse-arrow bg-base-300/40 rounded-2xl border ${borderAlert} transition-all`}
                    >
                      <input type="checkbox" /> 
                      <div className="collapse-title flex items-center justify-between pr-10 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{evt.message}</span>
                            <span className="text-xs text-base-content/40 font-mono mt-0.5">{evt.time} | Device: {deviceMap[evt.uid.toUpperCase()] || evt.uid}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className={`badge ${badgeColor} font-semibold py-2.5 px-3`}>
                            Score: {evt.threatScore}%
                          </div>
                          <span className="badge badge-outline text-xs capitalize">{evt.status}</span>
                        </div>
                      </div>
                      
                      <div className="collapse-content px-6 pb-6 pt-2 border-t border-base-100/50 bg-base-300/10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                          {/* Captures */}
                          <div className="md:col-span-2">
                            <h4 className="font-bold text-sm mb-3">AI Threat Report</h4>
                            <p className="text-sm bg-base-300 p-4 rounded-xl leading-relaxed text-base-content/80">
                              {evt.aiReport}
                            </p>
                            
                            {evt.capturedImages && evt.capturedImages.length > 0 && (
                              <div className="mt-4">
                                <h4 className="font-bold text-sm mb-3">1-Second Burst Snapshots</h4>
                                <div className="grid grid-cols-3 gap-3">
                                  {evt.capturedImages.map((img: string, idx: number) => (
                                    <div key={idx} className="aspect-video bg-neutral rounded-lg overflow-hidden relative shadow border border-base-100">
                                      <a href={img} target="_blank" rel="noopener noreferrer">
                                        <img src={img} alt={`Frame ${idx+1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Extra info & cmd */}
                          <div className="bg-base-300/40 p-4 rounded-xl border border-base-100/60 flex flex-col justify-between">
                            <div className="space-y-2">
                              <h4 className="font-bold text-sm">Signal Metadata</h4>
                              <div className="text-xs space-y-1.5 font-mono text-base-content/70">
                                <div><span className="text-base-content/40">Action:</span> {evt.action}</div>
                                <div><span className="text-base-content/40">Zone Code:</span> {evt.zoneCode || 'ZONE_01'}</div>
                                <div><span className="text-base-content/40">ID:</span> {evt._id}</div>
                                <div><span className="text-base-content/40">Status:</span> {evt.status}</div>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              {evt.threatScore >= 80 && evt.status === 'alerted' && (
                                <div className="alert alert-error text-xs p-2.5 rounded-lg flex items-start gap-2">
                                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                                  <span>Central Commander executed external webhook triggers.</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="card-actions justify-end mt-6">
              <Link href="/history" className="btn btn-neutral btn-sm gap-1.5 rounded-xl font-bold">
                View Full Logs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
