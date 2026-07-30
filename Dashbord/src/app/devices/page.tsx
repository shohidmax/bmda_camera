'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Cpu, Plus, Video, Trash2, Edit2, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5050';

export default function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form State
  const [uid, setUid] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [cameraUrl, setCameraUrl] = useState('https://picsum.photos/800/600');
  const [zoneCode, setZoneCode] = useState('ZONE_01');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [institution, setInstitution] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [registering, setRegistering] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);

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
    setCameraUrl(device.cameraUrl);
    setZoneCode(device.zoneCode);
    setPhoneNumbers(device.phoneNumbers ? device.phoneNumbers.join(', ') : '');
    setInstitution(device.institution || '');
    setLocation(device.location || '');
    setLatitude(device.latitude || '');
    setLongitude(device.longitude || '');
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
    setCameraUrl('https://picsum.photos/800/600');
    setZoneCode('ZONE_01');
    setPhoneNumbers('');
    setInstitution('');
    setLocation('');
    setLatitude('');
    setLongitude('');
    setEditingDeviceId(null);
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
            zoneCode,
            phoneNumbers: numbersArray,
            institution,
            location,
            latitude,
            longitude
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
            zoneCode,
            userId: user.uid,
            phoneNumbers: numbersArray,
            institution,
            location,
            latitude,
            longitude
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

  return (
    <div className="flex min-h-screen bg-base-300">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Devices &amp; Hardware</h2>
            <p className="text-sm text-base-content/60">Register, manage and configure your physical ESP32 security nodes.</p>
          </div>

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
              <h3 className="text-2xl font-bold">No Registered Devices</h3>
              <p className="py-2 text-sm text-base-content/60">
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
                        <p className="text-xs text-base-content/40 font-mono mt-0.5">{device.uid}</p>
                      </div>
                    </div>
                    <span className="badge badge-success gap-1.5 font-semibold text-xs py-2 px-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-base-100 animate-ping"></span>
                      Active
                    </span>
                  </div>

                  <div className="space-y-2 border-y border-base-100/50 py-4 my-2 text-sm">
                    {device.institution && (
                      <div className="flex justify-between">
                        <span className="text-base-content/40">Institution:</span>
                        <span className="font-semibold text-right max-w-[200px] truncate" title={device.institution}>{device.institution}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-base-content/40">Zone Location:</span>
                      <span className="font-semibold">{device.zoneCode}</span>
                    </div>
                    {device.location && (
                      <div className="flex justify-between">
                        <span className="text-base-content/40">Address Location:</span>
                        <span className="font-semibold text-right max-w-[200px] truncate" title={device.location}>{device.location}</span>
                      </div>
                    )}
                    {device.latitude && device.longitude && (
                      <div className="flex justify-between">
                        <span className="text-base-content/40">Coordinates:</span>
                        <span className="font-mono text-xs">{device.latitude}, {device.longitude}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/40 shrink-0">Snapshot Source:</span>
                      <span className="font-mono text-xs truncate max-w-[200px] text-base-content/70" title={device.cameraUrl}>
                        {device.cameraUrl}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base-content/40 shrink-0">Voice Call Alerts:</span>
                      <span className="font-semibold text-xs truncate max-w-[200px] text-base-content/70" title={device.phoneNumbers ? device.phoneNumbers.join(', ') : 'None'}>
                        {device.phoneNumbers && device.phoneNumbers.length > 0 ? device.phoneNumbers.join(', ') : 'None'}
                      </span>
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-4 gap-2">
                    <button 
                      onClick={() => handleEditClick(device)}
                      className="btn btn-outline btn-neutral btn-sm rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(device._id)}
                      className="btn btn-outline btn-error btn-sm rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DaisyUI Dialog Modal */}
        <dialog id="add_device_modal" className="modal">
          <div className="modal-box bg-base-200 border border-base-100 rounded-3xl max-w-md p-8">
            <h3 className="font-extrabold text-xl mb-4">
              {editingDeviceId ? 'Edit Hardware Node' : 'Pair New Hardware Node'}
            </h3>
            
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
                  className="input input-bordered w-full rounded-xl font-mono text-sm"
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
                  className="input input-bordered w-full rounded-xl text-sm"
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
                  className="input input-bordered w-full rounded-xl"
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
                  className="input input-bordered w-full rounded-xl text-sm"
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
                    className="input input-bordered w-full rounded-xl text-sm"
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
                    className="input input-bordered w-full rounded-xl text-sm"
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
                  className="input input-bordered w-full rounded-xl text-sm"
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/70">Live Stream / JPG Snapshot URL</span>
                </label>
                <input 
                  type="text" 
                  value={cameraUrl}
                  onChange={(e) => setCameraUrl(e.target.value)}
                  placeholder="e.g. http://192.168.1.50/mjpeg" 
                  className="input input-bordered w-full rounded-xl text-sm"
                  required
                />
                <span className="label-text-alt text-base-content/40 mt-1">We grab frames from this stream when D4 transitions to high.</span>
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
                  className="input input-bordered w-full rounded-xl text-sm"
                />
                <span className="label-text-alt text-base-content/40 mt-1">Comma-separated list of numbers for auto-voice calls when threat score is &gt; 90%.</span>
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
                  {editingDeviceId ? (registering ? 'Saving...' : 'Save Changes') : (registering ? 'Processing...' : 'Register Device')}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={handleCloseModal}>close</button>
          </form>
        </dialog>
      </main>
    </div>
  );
}
