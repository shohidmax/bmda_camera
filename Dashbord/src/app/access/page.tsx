'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Users, Shield, ShieldCheck, Key, CheckSquare, Square, RefreshCw, AlertCircle, PhoneCall } from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://transformer-camera-api.maxapi.esp32.site';

export default function AccessControlPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Selected user for device access modal configuration
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [tempAccessibleDevices, setTempAccessibleDevices] = useState<string[]>([]);

  // Create User Form State
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState('operator');
  const [creatingUser, setCreatingUser] = useState(false);

  // Share Device Form State
  const [shareEmail, setShareEmail] = useState('');
  const [shareDeviceUid, setShareDeviceUid] = useState('');
  const [sharingDevice, setSharingDevice] = useState(false);

  // Global Settings Toggle State
  const [globalCallAlertsEnabled, setGlobalCallAlertsEnabled] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings`);
      const data = await res.json();
      if (data.success && data.settings) {
        setGlobalCallAlertsEnabled(data.settings.globalCallAlertsEnabled);
      }
    } catch (err) {
      console.error('Error fetching global settings:', err);
    }
  };

  const handleToggleGlobalCall = async () => {
    if (!user) return;
    setError('');
    setSuccessMsg('');
    const newValue = !globalCallAlertsEnabled;
    try {
      const response = await fetch(`${BACKEND_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          globalCallAlertsEnabled: newValue
        })
      });
      const data = await response.json();
      if (data.success) {
        setGlobalCallAlertsEnabled(newValue);
        setSuccessMsg(`Global Voice Call Alert service has been ${newValue ? 'ENABLED' : 'DISABLED'}.`);
      } else {
        setError(data.error || 'Failed to update settings.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred during settings toggle.');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newDisplayName) {
      setError('Please provide Email and Display Name.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setCreatingUser(true);
    try {
      const generatedUid = 'mock-uid-' + Math.random().toString(36).substr(2, 9);
      
      // Step 1: Sync/create standard user profile
      const response = await fetch(`${BACKEND_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: generatedUid,
          email: newEmail,
          displayName: newDisplayName
        })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to register profile.');
      }

      // Step 2: If role is not operator, update the role on the backend
      if (newRole !== 'operator') {
        const roleResponse = await fetch(`${BACKEND_URL}/api/users/${generatedUid}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.uid,
            role: newRole
          })
        });
        const roleData = await roleResponse.json();
        if (!roleData.success) {
          throw new Error(roleData.error || 'Failed to set user role.');
        }
      }

      setSuccessMsg(`Operator account for ${newEmail} created successfully.`);
      setNewEmail('');
      setNewDisplayName('');
      setNewRole('operator');
      const modal = document.getElementById('create_user_modal') as any;
      if (modal) modal.close();
      fetchUsersAndDevices();
    } catch (err: any) {
      setError(err.message || 'Error occurred during user creation.');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleShareDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail || !shareDeviceUid) {
      setError('Please provide Email and select a Device.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setSharingDevice(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/devices/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          email: shareEmail,
          deviceUid: shareDeviceUid
        })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to share device.');
      }
      setSuccessMsg(`Successfully shared device ${shareDeviceUid} with ${shareEmail}.`);
      setShareEmail('');
      setShareDeviceUid('');
      (document.getElementById('share_device_modal') as any)?.close();
      fetchUsersAndDevices();
    } catch (err: any) {
      setError(err.message || 'Error occurred during device sharing.');
    } finally {
      setSharingDevice(false);
    }
  };

  const handleDeleteUser = async (targetUid: string) => {
    if (!confirm('Are you sure you want to delete this user profile?')) return;
    setActionLoading(`delete_${targetUid}`);
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${targetUid}?userId=${user?.uid}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg('User profile deleted successfully.');
        fetchUsersAndDevices();
      } else {
        setError(data.error || 'Failed to delete user.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred during user deletion.');
    } finally {
      setActionLoading(null);
    }
  };

  const fetchUsersAndDevices = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      
      // Fetch all users (requires requester userId query param for authorization)
      const reqId = user.uid || user.email || '';
      const userRes = await fetch(`${BACKEND_URL}/api/users?userId=${encodeURIComponent(reqId)}`);
      const userData = await userRes.json();
      if (!userData.success) throw new Error(userData.error || 'Failed to load users.');
      
      // Deduplicate users array by email
      const rawUsers = userData.users || [];
      const userMap = new Map();
      rawUsers.forEach((u: any) => {
        const key = (u.email || '').toLowerCase().trim();
        if (key && !userMap.has(key)) {
          userMap.set(key, u);
        }
      });
      setUsers(Array.from(userMap.values()));

      // Fetch all devices (as admin, this will return all devices)
      const devRes = await fetch(`${BACKEND_URL}/api/devices/${user.uid}`);
      const devData = await devRes.json();
      if (!devData.success) throw new Error(devData.error || 'Failed to load devices.');
      setDevices(devData.devices || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error occurred loading access control list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUsersAndDevices();
      fetchSettings();
    }
  }, [user]);

  const handleRoleChange = async (targetUid: string, newRole: string) => {
    if (!user) return;
    setActionLoading(`role_${targetUid}`);
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${targetUid}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          role: newRole
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`Successfully updated role for ${data.user.email} to ${newRole}.`);
        // Refresh local user role
        setUsers(users.map(u => u.uid === targetUid ? { ...u, role: newRole } : u));
      } else {
        setError(data.error || 'Failed to update user role.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred during role update.');
    } finally {
      setActionLoading(null);
    }
  };

  const openDeviceAccessModal = (targetUser: any) => {
    setSelectedUser(targetUser);
    setTempAccessibleDevices(targetUser.accessibleDevices || []);
    const modal = document.getElementById('device_access_modal') as any;
    if (modal) modal.showModal();
  };

  const toggleDeviceSelection = (deviceUid: string) => {
    if (tempAccessibleDevices.includes(deviceUid)) {
      setTempAccessibleDevices(tempAccessibleDevices.filter(uid => uid !== deviceUid));
    } else {
      setTempAccessibleDevices([...tempAccessibleDevices, deviceUid]);
    }
  };

  const handleSaveDeviceAccess = async () => {
    if (!user || !selectedUser) return;
    setActionLoading(`devices_${selectedUser.uid}`);
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/${selectedUser.uid}/devices`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          accessibleDevices: tempAccessibleDevices
        })
      });
      const data = await response.json();
      if (data.success) {
        setSuccessMsg(`Successfully updated device access permissions for ${data.user.email}.`);
        // Update user state locally
        setUsers(users.map(u => u.uid === selectedUser.uid ? { ...u, accessibleDevices: tempAccessibleDevices } : u));
        const modal = document.getElementById('device_access_modal') as any;
        if (modal) modal.close();
        setSelectedUser(null);
      } else {
        setError(data.error || 'Failed to update device access.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred during device permission update.');
    } finally {
      setActionLoading(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-base-300">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 flex items-center justify-center w-full">
          <div className="card bg-base-200 border border-base-100 p-8 text-center rounded-3xl max-w-md shadow-xl">
            <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Access Denied</h3>
            <p className="text-sm text-base-content/80">
              Only system administrators have permission to access the User Roles and Access Management portal.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-base-300">
      <Sidebar />

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-h-screen w-full">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-base-content">Access Control &amp; Roles</h2>
            <p className="text-sm text-base-content/80">
              Change operator status (Admin / Manager) and grant access to specific hardware nodes.
            </p>
          </div>

          <div className="flex gap-3 items-center">
            {/* Global Voice Alert Toggle Switch */}
            <div className="flex items-center gap-2 bg-base-200 border border-base-100 rounded-2xl py-2.5 px-4 shadow-sm">
              <span className="text-xs font-bold text-base-content/75 flex items-center gap-1.5">
                <PhoneCall className={`w-4 h-4 ${globalCallAlertsEnabled ? 'text-success animate-pulse' : 'text-base-content/70'}`} />
                Global Call Service:
              </span>
              <input 
                type="checkbox" 
                className="toggle toggle-success toggle-sm"
                checked={globalCallAlertsEnabled}
                onChange={handleToggleGlobalCall}
              />
            </div>

            <button 
              onClick={() => (document.getElementById('create_user_modal') as any)?.showModal()}
              className="btn btn-primary gap-2 shadow-lg shadow-primary/20"
            >
              <Users className="w-5 h-5" />
              Create Operator
            </button>
            <button 
              onClick={() => (document.getElementById('share_device_modal') as any)?.showModal()}
              className="btn btn-accent gap-2 shadow-lg shadow-accent/20 text-accent-content font-bold"
            >
              <Key className="w-5 h-5" />
              Share Device
            </button>
            <button 
              onClick={fetchUsersAndDevices}
              className={`btn btn-circle btn-outline btn-neutral ${loading ? 'loading' : ''}`}
              title="Refresh Users"
            >
              {!loading && <RefreshCw className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error rounded-xl mb-6 shadow-md">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success rounded-xl mb-6 shadow-md">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="flex h-[50vh] justify-center items-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <div className="card bg-base-200 border border-base-100 shadow-xl overflow-hidden rounded-3xl">
            <div className="card-body p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="card-title text-xl font-bold text-base-content">Registered Users &amp; Permissions</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-b border-base-300/40 text-base-content/80">
                      <th>Name / Email</th>
                      <th>Account Role</th>
                      <th>Device Access Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-base-300/20 hover:bg-base-300/20 transition-all">
                        <td className="py-4">
                          <div className="font-bold text-base-content">{u.displayName || 'No Display Name'}</div>
                          <div className="text-xs text-base-content/75 font-mono mt-0.5">{u.email}</div>
                          <div className="text-[10px] text-base-content/65 font-mono mt-0.5">UID: {u.uid}</div>
                        </td>
                        
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <select 
                              value={u.role || 'operator'}
                              disabled={actionLoading === `role_${u.uid}` || u.uid === user.uid}
                              onChange={(e) => handleRoleChange(u.uid, e.target.value)}
                              className="select select-bordered select-sm rounded-xl font-semibold bg-base-100 border-base-300/60 text-base-content"
                            >
                              <option value="operator">Operator</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                            {actionLoading === `role_${u.uid}` && (
                              <span className="loading loading-spinner loading-xs text-primary"></span>
                            )}
                          </div>
                        </td>

                        <td className="py-4">
                          {u.role === 'admin' ? (
                            <span className="badge badge-error gap-1 text-xs font-semibold py-2 px-2.5">
                              <Shield className="w-3.5 h-3.5" /> Full System Admin
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="badge badge-neutral gap-1 text-xs font-semibold py-2 px-2.5 w-fit">
                                <Key className="w-3.5 h-3.5" />
                                {u.accessibleDevices?.length || 0} Devices Allowed
                              </span>
                              {u.accessibleDevices?.length > 0 && (
                                <div className="text-[10px] text-base-content/70 truncate max-w-[200px]">
                                  {u.accessibleDevices.join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-4 text-right flex justify-end gap-2 items-center">
                          <button
                            disabled={u.role === 'admin' || actionLoading === `devices_${u.uid}`}
                            onClick={() => openDeviceAccessModal(u)}
                            className="btn btn-primary btn-sm rounded-xl gap-1.5 font-bold"
                          >
                            <Key className="w-4 h-4" />
                            Configure Access
                          </button>
                          {u.uid !== user.uid && (
                            <button
                              disabled={actionLoading === `delete_${u.uid}`}
                              onClick={() => handleDeleteUser(u.uid)}
                              className="btn btn-outline btn-error btn-sm rounded-xl font-bold"
                            >
                              Delete User
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Create User Dialog Modal */}
        <dialog id="create_user_modal" className="modal">
          <div className="modal-box bg-base-200 border border-base-100 rounded-3xl max-w-md p-8">
            <h3 className="font-extrabold text-xl mb-4">Create Operator Profile</h3>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/70">Email Address</span>
                </label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="operator@company.com" 
                  className="input input-bordered w-full rounded-xl text-base-content"
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/70">Display Name</span>
                </label>
                <input 
                  type="text" 
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. John Doe" 
                  className="input input-bordered w-full rounded-xl text-base-content"
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/70">Account Role</span>
                </label>
                <select 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="select select-bordered w-full rounded-xl font-semibold text-base-content"
                >
                  <option value="operator">Operator</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="modal-action flex justify-end gap-2 mt-8">
                <button 
                  type="button" 
                  onClick={() => {
                    setNewEmail('');
                    setNewDisplayName('');
                    setNewRole('operator');
                    (document.getElementById('create_user_modal') as any)?.close();
                  }} 
                  className="btn btn-neutral rounded-xl btn-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creatingUser}
                  className="btn btn-primary rounded-xl btn-sm"
                >
                  {creatingUser ? 'Creating...' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => {
              setNewEmail('');
              setNewDisplayName('');
              setNewRole('operator');
            }}>close</button>
          </form>
        </dialog>

        {/* Device Access Configuration Dialog Modal */}
        <dialog id="device_access_modal" className="modal">
          <div className="modal-box bg-base-200 border border-base-100 rounded-3xl max-w-md p-8">
            <h3 className="font-extrabold text-xl mb-2">Configure Device Permissions</h3>
            <p className="text-xs text-base-content/75 mb-6">
              Toggle access authorization for <span className="font-semibold text-base-content">{selectedUser?.email}</span>.
            </p>
            
            <div className="space-y-3 max-h-72 overflow-y-auto mb-6 pr-2">
              {devices.length === 0 ? (
                <p className="text-sm text-base-content/70 text-center py-4">No registered hardware devices found.</p>
              ) : (
                devices.map((device) => {
                  const isChecked = tempAccessibleDevices.includes(device.uid);
                  return (
                    <div 
                      key={device._id} 
                      onClick={() => toggleDeviceSelection(device.uid)}
                      className={`flex justify-between items-center p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isChecked 
                          ? 'border-primary/50 bg-primary/5 text-primary-content' 
                          : 'border-base-100/50 hover:bg-base-300/30'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-base-content">{device.deviceName}</div>
                        <div className="text-xs text-base-content/70 font-mono mt-0.5">MAC: {device.uid} | Zone: {device.zoneCode}</div>
                      </div>
                      <div className="text-primary shrink-0">
                        {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 opacity-45" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-action flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => {
                  (document.getElementById('device_access_modal') as any)?.close();
                  setSelectedUser(null);
                }} 
                className="btn btn-neutral rounded-xl btn-sm"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveDeviceAccess}
                disabled={actionLoading === `devices_${selectedUser?.uid}`}
                className="btn btn-primary rounded-xl btn-sm gap-1.5"
              >
                {actionLoading === `devices_${selectedUser?.uid}` && (
                  <span className="loading loading-spinner loading-xs"></span>
                )}
                Save Access
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setSelectedUser(null)}>close</button>
          </form>
        </dialog>

        {/* Share Device Dialog Modal */}
        <dialog id="share_device_modal" className="modal">
          <div className="modal-box bg-base-200 border border-base-100 rounded-3xl max-w-md p-8">
            <h3 className="font-extrabold text-xl mb-4">Share Device via Email</h3>
            
            <form onSubmit={handleShareDevice} className="space-y-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/70">User Email Address</span>
                </label>
                <input 
                  type="email" 
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="operator@company.com" 
                  className="input input-bordered w-full rounded-xl text-base-content"
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/70">Select Device Node</span>
                </label>
                <select 
                  value={shareDeviceUid}
                  onChange={(e) => setShareDeviceUid(e.target.value)}
                  className="select select-bordered w-full rounded-xl font-semibold text-base-content"
                  required
                >
                  <option value="">-- Select a Device --</option>
                  {devices.map(d => (
                    <option key={d.uid} value={d.uid}>{d.deviceName} ({d.uid})</option>
                  ))}
                </select>
              </div>

              <div className="modal-action flex justify-end gap-2 mt-8">
                <button 
                  type="button" 
                  onClick={() => {
                    setShareEmail('');
                    setShareDeviceUid('');
                    (document.getElementById('share_device_modal') as any)?.close();
                  }} 
                  className="btn btn-neutral rounded-xl btn-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={sharingDevice}
                  className="btn btn-primary rounded-xl btn-sm"
                >
                  {sharingDevice ? 'Sharing...' : 'Share Access'}
                </button>
              </div>
            </form>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => {
              setShareEmail('');
              setShareDeviceUid('');
            }}>close</button>
          </form>
        </dialog>
      </main>
    </div>
  );
}
