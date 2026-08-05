'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { 
  Radio, 
  RefreshCw, 
  Cpu, 
  Terminal, 
  Activity, 
  SlidersHorizontal,
  Code,
  Calendar,
  Layers,
  MapPin,
  ClipboardCheck
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transformer-camera-api.maxapi.esp32.site';

export default function EspDataPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedJson, setSelectedJson] = useState<any | null>(null);

  const fetchTelemetry = async () => {
    if (!user) return;
    try {
      setRefreshing(true);
      const [evRes, devRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/events/${user.uid}`),
        fetch(`${BACKEND_URL}/api/devices/${user.uid}`)
      ]);
      
      const evData = await evRes.json();
      const devData = await devRes.json();
      
      setEvents(evData.events || []);
      setDevices(devData.devices || []);
    } catch (err) {
      console.error('Error fetching telemetry data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTelemetry();
    }
  }, [user]);

  // Device Map for easy name lookup
  const deviceMap = useMemo(() => {
    const map: Record<string, { name: string; zone: string; location: string; inst: string }> = {};
    devices.forEach((d) => {
      map[d.uid.toUpperCase()] = {
        name: d.deviceName,
        zone: d.zoneCode,
        location: d.location || 'N/A',
        inst: d.institution || 'N/A'
      };
    });
    return map;
  }, [devices]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedDevice !== 'all' && e.uid.toUpperCase() !== selectedDevice.toUpperCase()) {
        return false;
      }
      if (selectedAction !== 'all' && e.action !== selectedAction) {
        return false;
      }
      return true;
    });
  }, [events, selectedDevice, selectedAction]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = filteredEvents.length;
    const pinLow = filteredEvents.filter(e => e.action === 'PIN_LOW').length;
    const pinHigh = filteredEvents.filter(e => e.action === 'PIN_HIGH').length;
    const lastSignal = filteredEvents.length > 0 ? filteredEvents[0].time : 'Never';
    
    return { total, pinLow, pinHigh, lastSignal };
  }, [filteredEvents]);

  const handleOpenJsonModal = (eventObj: any) => {
    setSelectedJson(eventObj);
    (document.getElementById('raw_json_modal') as any)?.showModal();
  };

  const handleCloseJsonModal = () => {
    setSelectedJson(null);
    (document.getElementById('raw_json_modal') as any)?.close();
  };

  const handleCopyJson = () => {
    if (!selectedJson) return;
    navigator.clipboard.writeText(JSON.stringify(selectedJson, null, 2));
    alert('JSON copied to clipboard!');
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-base-300">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-h-screen w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Radio className="w-8 h-8 text-primary animate-pulse" />
              ESP32 Incoming Signals Console
            </h2>
            <p className="text-sm text-base-content/80 mt-1">
              Direct telemetry dashboard displaying raw trigger packets, signal properties, and metadata received from nodes.
            </p>
          </div>

          <button 
            onClick={fetchTelemetry}
            disabled={refreshing}
            className={`btn btn-circle btn-outline btn-neutral ${refreshing ? 'loading' : ''}`}
            title="Refresh Telemetry Log"
          >
            {!refreshing && <RefreshCw className="w-5 h-5" />}
          </button>
        </div>

        {/* Stats Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stats shadow bg-base-200 border border-base-100">
            <div className="stat">
              <div className="stat-title text-base-content/75">Total Signals</div>
              <div className="stat-value text-primary flex items-center gap-2">
                <Terminal className="w-8 h-8" />
                {stats.total}
              </div>
              <div className="stat-desc mt-1">Processed & logged</div>
            </div>
          </div>

          <div className="stats shadow bg-base-200 border border-base-100">
            <div className="stat">
              <div className="stat-title text-base-content/75">Alerts (PIN_LOW)</div>
              <div className="stat-value text-error flex items-center gap-2">
                <Activity className="w-8 h-8" />
                {stats.pinLow}
              </div>
              <div className="stat-desc mt-1 text-error/80 font-medium">Triggers requesting snaps</div>
            </div>
          </div>

          <div className="stats shadow bg-base-200 border border-base-100">
            <div className="stat">
              <div className="stat-title text-base-content/75">Normal (PIN_HIGH)</div>
              <div className="stat-value text-success flex items-center gap-2">
                <ClipboardCheck className="w-8 h-8" />
                {stats.pinHigh}
              </div>
              <div className="stat-desc mt-1 text-success">Healthy node status logs</div>
            </div>
          </div>

          <div className="stats shadow bg-base-200 border border-base-100">
            <div className="stat">
              <div className="stat-title text-base-content/75">Last Active Signal</div>
              <div className="stat-value text-warning text-lg truncate pt-2">
                {stats.lastSignal}
              </div>
              <div className="stat-desc mt-2">Latest trigger timestamp</div>
            </div>
          </div>
        </div>

        {/* Filter Controls Panel */}
        <div className="card bg-base-200 border border-base-100 shadow-xl mb-6">
          <div className="card-body p-4 flex flex-row flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-base-content/80">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Filter Signals
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
              {/* Device Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-base-content/75 font-semibold">Device:</span>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="select select-bordered select-sm rounded-xl bg-base-300 text-xs font-semibold border-base-100/50 text-base-content"
                >
                  <option value="all">All Registered Nodes</option>
                  {devices.map((d) => (
                    <option key={d.uid} value={d.uid}>{d.deviceName} ({d.uid})</option>
                  ))}
                </select>
              </div>

              {/* Action Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-base-content/75 font-semibold">Action:</span>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="select select-bordered select-sm rounded-xl bg-base-300 text-xs font-semibold border-base-100/50 text-base-content"
                >
                  <option value="all">All Actions</option>
                  <option value="PIN_LOW">PIN_LOW (Alert)</option>
                  <option value="PIN_HIGH">PIN_HIGH (Idle)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table Listing */}
        <div className="card bg-base-200 border border-base-100 shadow-xl">
          <div className="card-body p-0 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-20 text-base-content/70">
                <Radio className="w-12 h-12 mx-auto mb-3 opacity-30 animate-bounce" />
                <p className="font-semibold text-base">No Telemetry Signal Logs Found</p>
                <p className="text-xs text-base-content/75 mt-1">Ensure your hardware nodes are online and transmitting events.</p>
              </div>
            ) : (
              <table className="table w-full text-sm">
                <thead className="bg-base-300 text-base-content/80 text-xs border-b border-base-100">
                  <tr>
                    <th>Timestamp</th>
                    <th>Device/MAC</th>
                    <th>Zone</th>
                    <th>Pin Action</th>
                    <th>Custom Message</th>
                    <th>Threat Score</th>
                    <th className="text-right">Payload Inspections</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-100/50">
                  {filteredEvents.map((evt) => {
                    const devInfo = deviceMap[evt.uid.toUpperCase()] || {
                      name: 'Unregistered Board',
                      zone: evt.zoneCode || 'ZONE_01',
                      location: 'N/A',
                      inst: 'N/A'
                    };

                    let badgeColor = 'badge-success';
                    if (evt.action === 'PIN_LOW') {
                      badgeColor = 'badge-error';
                    }

                    let threatBadge = 'badge-ghost';
                    if (evt.threatScore >= 80) {
                      threatBadge = 'badge-error font-bold';
                    } else if (evt.threatScore >= 50) {
                      threatBadge = 'badge-warning font-semibold';
                    }

                    return (
                      <tr key={evt._id} className="hover:bg-base-300/20 transition-all">
                        {/* Time */}
                        <td className="font-mono text-xs text-base-content/70">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-base-content/70" />
                            {evt.time}
                          </span>
                        </td>
                        
                        {/* Device Info */}
                        <td>
                          <div className="flex flex-col">
                            <span className="font-bold text-base-content/90 flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5 text-primary" />
                              {devInfo.name}
                            </span>
                            <span className="text-xs text-base-content/70 font-mono mt-0.5">{evt.uid}</span>
                          </div>
                        </td>

                        {/* Zone */}
                        <td>
                          <span className="badge badge-outline text-2xs uppercase tracking-wide px-2 py-0.5">
                            {devInfo.zone}
                          </span>
                        </td>

                        {/* Pin Action */}
                        <td>
                          <span className={`badge ${badgeColor} text-2xs font-semibold py-1 px-2.5`}>
                            {evt.action}
                          </span>
                        </td>

                        {/* Custom Message */}
                        <td className="max-w-xs truncate text-base-content/80 text-xs">
                          {evt.message}
                        </td>

                        {/* Threat score */}
                        <td>
                          <span className={`badge ${threatBadge} text-xs`}>
                            {evt.threatScore}%
                          </span>
                        </td>

                        {/* Inspect Raw Data */}
                        <td className="text-right">
                          <button
                            onClick={() => handleOpenJsonModal(evt)}
                            className="btn btn-xs btn-neutral rounded-lg font-bold gap-1"
                          >
                            <Code className="w-3 h-3" />
                            Payload JSON
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Payload Visualizer Dialog Modal */}
        <dialog id="raw_json_modal" className="modal">
          <div className="modal-box bg-base-200 border border-base-100 rounded-3xl max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                Raw ESP32 Trigger Payload
              </h3>
              <button 
                onClick={handleCopyJson}
                className="btn btn-xs btn-primary rounded-lg font-bold"
              >
                Copy JSON
              </button>
            </div>

            {selectedJson ? (
              <div className="space-y-4">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-base-300 p-3 rounded-xl border border-base-100/50">
                  <div>
                    <span className="text-base-content/70 block">Origin MAC:</span>
                    <span className="font-mono font-bold text-base-content">{selectedJson.uid}</span>
                  </div>
                  <div>
                    <span className="text-base-content/70 block">Resolved Zone:</span>
                    <span className="font-bold text-base-content">{selectedJson.zoneCode}</span>
                  </div>
                  <div>
                    <span className="text-base-content/70 block">Received At:</span>
                    <span className="font-mono text-base-content">{selectedJson.time}</span>
                  </div>
                  <div>
                    <span className="text-base-content/70 block">Event ID:</span>
                    <span className="font-mono text-base-content text-3xs truncate block" title={selectedJson._id}>
                      {selectedJson._id}
                    </span>
                  </div>
                </div>

                {/* Preformatted JSON block */}
                <pre className="bg-black text-success p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-72 border border-base-100">
                  {JSON.stringify(selectedJson, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-sm text-base-content/75">No payload selected.</p>
            )}

            <div className="modal-action mt-6">
              <button 
                onClick={handleCloseJsonModal} 
                className="btn btn-neutral rounded-xl btn-sm"
              >
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={handleCloseJsonModal}>close</button>
          </form>
        </dialog>
      </main>
    </div>
  );
}
