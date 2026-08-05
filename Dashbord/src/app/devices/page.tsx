'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Cpu, Plus, Video, Trash2, Edit2, AlertCircle, Settings } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transformer-camera-api.maxapi.esp32.site';

export default function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [uid, setUid] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [cameraUrl, setCameraUrl] = useState('http://161.248.205.218:1984/stream.html?src=camera_004');
  const [snapshotUrl, setSnapshotUrl] = useState('http://161.248.205.218:1984/api/frame.jpeg?src=camera_004');
  const [zoneCode, setZoneCode] = useState('ZONE_01');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [institution, setInstitution] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [registering, setRegistering] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [callAlertsEnabled, setCallAlertsEnabled] = useState(true);
  const [instantCallOnTrigger, setInstantCallOnTrigger] = useState(true);

  // Sharing & Authorized Users State
  const [shareEmail, setShareEmail] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');
  const [shareError, setShareError] = useState('');
  const [authorizedUsers, setAuthorizedUsers] = useState<any[]>([]);

  const fetchAuthorizedUsers = async (deviceUid: string) => {
    if (!user) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users?userId=${user.uid}`);
      const data = await res.json();
      if (data.success && data.users) {
        const uppercaseUid = deviceUid.toUpperCase();
        const filtered = data.users.filter((u: any) => 
          u.role !== 'admin' && u.accessibleDevices && u.accessibleDevices.map((d: string) => d.toUpperCase()).includes(uppercaseUid)
        );
        setAuthorizedUsers(filtered);
      }
    } catch (err) {
      console.error('Error fetching authorized users:', err);
    }
  };

  const handleShareSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!shareEmail) {
      setShareError('Please enter an email.');
      return;
    }
    setSharing(true);
    setShareError('');
    setShareSuccess('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/devices/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          email: shareEmail,
          deviceUid: uid
        })
      });
      const data = await res.json();
      if (data.success) {
        setShareSuccess(`Successfully shared access with ${shareEmail}.`);
        setShareEmail('');
        fetchAuthorizedUsers(uid);
      } else {
        setShareError(data.error || 'Failed to share device.');
      }
    } catch (err: any) {
      setShareError(err.message || 'Error sharing device.');
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveUserAccess = async (targetUser: any) => {
    if (!confirm(`Are you sure you want to remove access for ${targetUser.email}?`)) return;
    setShareError('');
    setShareSuccess('');
    try {
      const newDevices = (targetUser.accessibleDevices || []).filter((d: string) => d.toUpperCase() !== uid.toUpperCase());
      const response = await fetch(`${BACKEND_URL}/api/users/${targetUser.uid}/devices`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          accessibleDevices: newDevices
        })
      });
      const data = await response.json();
      if (data.success) {
        setShareSuccess(`Successfully removed access for ${targetUser.email}.`);
        fetchAuthorizedUsers(uid);
      } else {
        setShareError(data.error || 'Failed to remove access.');
      }
    } catch (err: any) {
      setShareError(err.message || 'Error removing access.');
    }
  };

  const fetchDevices = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/devices/${user.uid}`);
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch devices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user]);

  const handleEditClick = (device: any) => {
    setEditingDeviceId(device._id);
    setUid(device.uid);
    setDeviceName(device.deviceName);
    setCameraUrl(device.cameraUrl || '');
    setSnapshotUrl(device.snapshotUrl || '');
    setZoneCode(device.zoneCode);
    setPhoneNumbers(device.phoneNumbers ? device.phoneNumbers.join(', ') : '');
    setInstitution(device.institution || '');
    setLocation(device.location || '');
    setLatitude(device.latitude || '');
    setLongitude(device.longitude || '');
    setCallAlertsEnabled(device.callAlertsEnabled !== undefined ? device.callAlertsEnabled : true);
    setInstantCallOnTrigger(device.instantCallOnTrigger !== undefined ? device.instantCallOnTrigger : true);
    
    setShareEmail('');
    setShareError('');
    setShareSuccess('');
    setAuthorizedUsers([]);
    fetchAuthorizedUsers(device.uid);
    (document.getElementById('add_device_modal') as any)?.showModal();
  };

  const handleDeleteClick = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this device node?')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/devices/${deviceId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        fetchDevices();
      } else {
        setError(data.error || 'Failed to delete device.');
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting device.');
    }
  };

  const handleCloseModal = () => {
    setUid('');
    setDeviceName('');
    setCameraUrl('http://161.248.205.218:1984/stream.html?src=camera_004');
    setSnapshotUrl('http://161.248.205.218:1984/api/frame.jpeg?src=camera_004');
    setZoneCode('ZONE_01');
    setPhoneNumbers('');
    setInstitution('');
    setLocation('');
    setLatitude('');
    setLongitude('');
    setEditingDeviceId(null);
    setCallAlertsEnabled(true);
    setInstantCallOnTrigger(true);
    setShareEmail('');
    setShareError('');
    setShareSuccess('');
    setAuthorizedUsers([]);
    (document.getElementById('add_device_modal') as any)?.close();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !deviceName) {
      setError('Please provide MAC Address (UID) and Name.');
      return;
    }
    setError('');
    setRegistering(true);

    const numbersArray = phoneNumbers.split(',')
      .map(num => num.trim())
      .filter(num => num !== '')
      .slice(0, 5);

    try {
      let response;
      if (editingDeviceId) {
        // Edit Mode
        response = await fetch(`${BACKEND_URL}/api/devices/${editingDeviceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            deviceName,
            cameraUrl,
            snapshotUrl,
            zoneCode,
            phoneNumbers: numbersArray,
            institution,
            location,
            latitude,
            longitude,
            callAlertsEnabled,
            instantCallOnTrigger
          })
        });
      } else {
        // Register Mode
        response = await fetch(`${BACKEND_URL}/api/devices`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            deviceName,
            cameraUrl,
            snapshotUrl,
            zoneCode,
            userId: user.uid,
            phoneNumbers: numbersArray,
            institution,
            location,
            latitude,
            longitude,
            callAlertsEnabled,
            instantCallOnTrigger
          })
        });
      }
      
      const data = await response.json();
      if (data.success) {
        handleCloseModal();
        fetchDevices();
      } else {
        setError(data.error || 'Failed to process device.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred.');
    } finally {
      setRegistering(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-base-300">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-h-screen w-full">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-base-content">Devices &amp; Hardware</h2>
            <p className="text-sm text-base-content/80">
              {isAdmin ? 'Register, manage and configure physical ESP32 security nodes.' : 'View active hardware nodes and stream status (Read-Only Mode).'}
            </p>
          </div>

          {isAdmin ? (
            <button 
              onClick={() => {
                setEditingDeviceId(null);
                setUid('');
                setDeviceName('');
                setCameraUrl('https://picsum.photos/800/600');
                setZoneCode('ZONE_01');
                setPhoneNumbers('');
                setInstitution('');
                setLocation('');
                setLatitude('');
                setLongitude('');
                (document.getElementById('add_device_modal') as any)?.showModal();
              }}
              className="btn btn-primary gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
              Pair Device Node
            </button>
          ) : (
            <div className="badge badge-neutral py-3 px-4 font-bold text-xs gap-2 border border-base-100/60">
              <span className="w-2 h-2 rounded-full bg-info"></span>
              Read-Only Operator Mode
            </div>
          )}
        </div>

        {error && (
          <div className="alert alert-error rounded-xl mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex h-[50vh] justify-center items-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : devices.length === 0 ? (
          <div className="hero bg-base-200 border border-base-100 rounded-3xl p-12 text-center shadow-inner">
            <div className="hero-content flex-col max-w-md">
              <Cpu className="w-16 h-16 text-primary/45 mb-2" />
              <h3 className="text-2xl font-bold text-base-content">No Registered Devices</h3>
              <p className="py-2 text-sm text-base-content/80">
                You have not paired any ESP32 camera nodes yet. Set up a physical node to begin active threat analysis.
              </p>
              <button 
                onClick={() => {
                  setEditingDeviceId(null);
                  setUid('');
                  setDeviceName('');
                  setCameraUrl('https://picsum.photos/800/600');
                  setZoneCode('ZONE_01');
                  setPhoneNumbers('');
                  setInstitution('');
                  setLocation('');
                  setLatitude('');
                  setLongitude('');
                  (document.getElementById('add_device_modal') as any)?.showModal();
                }}
                className="btn btn-primary gap-2 mt-4"
              >
                <Plus className="w-4 h-4" /> Add Device
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {devices.map((device) => (
              <div key={device._id} className="card bg-base-200 shadow-xl border border-base-100 overflow-hidden">
                <div className="card-body p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                        <Cpu className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-base-content leading-snug">{device.deviceName}</h3>
                        <p className="text-xs text-base-content/70 font-mono mt-0.5">{device.uid}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${device.callAlertsEnabled !== false ? 'badge-success' : 'badge-ghost'} gap-1.5 font-semibold text-xs py-2 px-2.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${device.callAlertsEnabled !== false ? 'bg-base-100 animate-ping' : 'bg-base-content/40'}`}></span>
                        {device.callAlertsEnabled !== false ? 'Active' : 'Muted'}
                      </span>
                      {isAdmin && (
                        <button 
                          onClick={() => handleEditClick(device)}
                          className="btn btn-ghost btn-circle btn-sm text-base-content/80 hover:bg-base-300 hover:text-base-content"
                          title="Configure Settings & Sharing"
                        >
                          <Settings className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 border-y border-base-100/50 py-4 my-2 text-sm">
                    {device.institution && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Institution:</span>
                        <span className="font-semibold text-right max-w-[200px] truncate" title={device.institution}>{device.institution}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Zone Location:</span>
                      <span className="font-semibold">{device.zoneCode}</span>
                    </div>
                    {device.location && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Address Location:</span>
                        <span className="font-semibold text-right max-w-[200px] truncate" title={device.location}>{device.location}</span>
                      </div>
                    )}
                    {device.latitude && device.longitude && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Coordinates:</span>
                        <span className="font-mono text-xs">{device.latitude}, {device.longitude}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70 shrink-0">Live Stream Feed:</span>
                      <span className="font-mono text-xs truncate max-w-[200px] text-base-content/70">
                        {isAdmin ? device.cameraUrl : '•••••••• (Protected Endpoint)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70 shrink-0">JPG Snapshot Feed:</span>
                      <span className="font-mono text-xs truncate max-w-[200px] text-base-content/70">
                        {isAdmin ? (device.snapshotUrl || device.cameraUrl) : '•••••••• (Protected Endpoint)'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/70 shrink-0">Voice Call Alerts:</span>
                      <span className="font-semibold text-xs truncate max-w-[200px] text-base-content/70" title={device.phoneNumbers ? device.phoneNumbers.join(', ') : 'None'}>
                        {device.phoneNumbers && device.phoneNumbers.length > 0 ? (isAdmin ? device.phoneNumbers.join(', ') : 'Registered') : 'None'}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="card-actions justify-end mt-4">
                      <button 
                        onClick={() => handleDeleteClick(device._id)}
                        className="btn btn-ghost btn-xs text-error hover:bg-error/15 font-bold"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove Device
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DaisyUI Dialog Modal */}
        <dialog id="add_device_modal" className="modal">
          <div className={`modal-box bg-base-200 border border-base-100 rounded-3xl p-8 transition-all duration-300 ${editingDeviceId ? 'max-w-4xl w-11/12' : 'max-w-md'}`}>
            <h3 className="font-extrabold text-xl mb-6">
              {editingDeviceId ? 'Device Settings & Share Access' : 'Pair New Hardware Node'}
            </h3>
            
            <div className={editingDeviceId ? "grid grid-cols-1 lg:grid-cols-2 gap-8" : "block"}>
              {/* Left Side: Device configurations */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">ESP32 MAC Address (UID)</span>
                  </label>
                  <input 
                    type="text" 
                    value={uid}
                    onChange={(e) => setUid(e.target.value)}
                    placeholder="e.g. 24:0A:C4:8B:58:C2" 
                    className="input input-bordered w-full rounded-xl font-mono text-sm text-base-content"
                    required
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">Institution</span>
                  </label>
                  <input 
                    type="text" 
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Barind Multipurpose Development Authority" 
                    className="input input-bordered w-full rounded-xl text-sm text-base-content"
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">Name</span>
                  </label>
                  <input 
                    type="text" 
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="e.g. Manda" 
                    className="input input-bordered w-full rounded-xl text-base-content"
                    required
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">Location</span>
                  </label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Godagari, Rajshahi" 
                    className="input input-bordered w-full rounded-xl text-sm text-base-content"
                  />
                </div>

                <div className="form-control w-full grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold text-base-content/70">Latitude</span>
                    </label>
                    <input 
                      type="text" 
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="e.g. 24.74872" 
                      className="input input-bordered w-full rounded-xl text-sm text-base-content"
                    />
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold text-base-content/70">Longitude</span>
                    </label>
                    <input 
                      type="text" 
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="e.g. 88.684272" 
                      className="input input-bordered w-full rounded-xl text-sm text-base-content"
                    />
                  </div>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">Zone Code</span>
                  </label>
                  <input 
                    type="text" 
                    value={zoneCode}
                    onChange={(e) => setZoneCode(e.target.value)}
                    placeholder="e.g. ZONE_02" 
                    className="input input-bordered w-full rounded-xl text-sm text-base-content"
                    required
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">Live Stream Video URL (Web Playback)</span>
                  </label>
                  <input 
                    type="text" 
                    value={cameraUrl}
                    onChange={(e) => setCameraUrl(e.target.value)}
                    placeholder="e.g. http://161.248.205.218:1984/stream.html?src=camera_004" 
                    className="input input-bordered w-full rounded-xl text-sm text-base-content"
                    required
                  />
                  <span className="label-text-alt text-base-content/70 mt-1">Used exclusively for live video player streaming on dashboard.</span>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">JPG Snapshot URL (AI Threat Analysis)</span>
                  </label>
                  <input 
                    type="text" 
                    value={snapshotUrl}
                    onChange={(e) => setSnapshotUrl(e.target.value)}
                    placeholder="e.g. http://161.248.205.218:1984/api/frame.jpeg?src=camera_004" 
                    className="input input-bordered w-full rounded-xl text-sm text-base-content"
                    required
                  />
                  <span className="label-text-alt text-base-content/70 mt-1">Direct JPEG endpoint used to capture photos 1s apart for AI Threat Analysis.</span>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/70">Phone Call Alert Numbers (Max 5)</span>
                  </label>
                  <input 
                    type="text" 
                    value={phoneNumbers}
                    onChange={(e) => setPhoneNumbers(e.target.value)}
                    placeholder="e.g. +8801711111111, +8801922222222" 
                    className="input input-bordered w-full rounded-xl text-sm text-base-content"
                  />
                  <span className="label-text-alt text-base-content/70 mt-1">Comma-separated list of numbers for auto-voice calls when threat score is &gt; 90%.</span>
                </div>

                <div className="form-control w-full flex-row justify-between items-center bg-base-300/40 p-3 rounded-xl border border-base-100/50 mt-2">
                  <div>
                    <span className="label-text font-bold text-base-content/85 block">Instant Phone Call on Signal</span>
                    <span className="text-[10px] text-base-content/70 block">Immediately call registered phone numbers as soon as hardware signal/trigger arrives</span>
                  </div>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-success toggle-sm"
                    checked={instantCallOnTrigger}
                    onChange={(e) => setInstantCallOnTrigger(e.target.checked)}
                  />
                </div>

                <div className="form-control w-full flex-row justify-between items-center bg-base-300/40 p-3 rounded-xl border border-base-100/50">
                  <div>
                    <span className="label-text font-bold text-base-content/85 block">AI Threat Score Call Alerts (&gt;90%)</span>
                    <span className="text-[10px] text-base-content/70 block">Auto-place call when AI Threat Score exceeds 90%</span>
                  </div>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-success toggle-sm"
                    checked={callAlertsEnabled}
                    onChange={(e) => setCallAlertsEnabled(e.target.checked)}
                  />
                </div>

                <div className="modal-action flex justify-end gap-2 mt-8">
                  <button 
                    type="button" 
                    onClick={handleCloseModal} 
                    className="btn btn-neutral rounded-xl btn-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={registering}
                    className="btn btn-primary rounded-xl btn-sm"
                  >
                    {registering ? 'Saving...' : editingDeviceId ? 'Save Changes' : 'Pair Node'}
                  </button>
                </div>
              </form>

              {/* Right Side: Sharing access management */}
              {editingDeviceId && (
                <div className="border-t lg:border-t-0 lg:border-l border-base-100/60 pt-6 lg:pt-0 lg:pl-8 space-y-6">
                  <div>
                    <h4 className="font-extrabold text-base mb-1">Share Device Access</h4>
                    <p className="text-xs text-base-content/75">Authorize another operator to access this node using their email.</p>
                  </div>
                  
                  {shareSuccess && (
                    <div className="alert alert-success py-2 px-4 rounded-xl text-xs font-semibold">
                      <span>{shareSuccess}</span>
                    </div>
                  )}
                  {shareError && (
                    <div className="alert alert-error py-2 px-4 rounded-xl text-xs font-semibold">
                      <span>{shareError}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="operator@company.com" 
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      className="input input-bordered input-sm flex-1 rounded-xl text-sm text-base-content"
                    />
                    <button 
                      type="button"
                      disabled={sharing}
                      onClick={handleShareSubmit}
                      className="btn btn-primary btn-sm rounded-xl"
                    >
                      {sharing ? 'Sharing...' : 'Share'}
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-bold text-xs text-base-content/70">Authorized Operators ({authorizedUsers.length} / 5)</h5>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {authorizedUsers.length === 0 ? (
                        <p className="text-xs text-base-content/70 italic">This device is not shared with any other operators.</p>
                      ) : (
                        authorizedUsers.map(u => (
                          <div key={u._id} className="flex justify-between items-center bg-base-300/30 border border-base-100/40 p-2.5 rounded-xl text-xs">
                            <div>
                              <div className="font-bold text-base-content">{u.displayName}</div>
                              <div className="text-[10px] text-base-content/75 font-mono">{u.email}</div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleRemoveUserAccess(u)}
                              className="btn btn-ghost btn-circle btn-xs text-error hover:bg-error/15"
                              title="Revoke Access"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={handleCloseModal}>close</button>
          </form>
        </dialog>
      </main>
    </div>
  );
}
