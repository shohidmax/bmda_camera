// API Service connecting to Express Backend

export const BACKEND_URL = 'http://192.168.0.220:5050'; 
export const FALLBACK_BACKEND_URL = 'https://tcam.maxapi.esp32.site';

export async function fetchDevices(userId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/devices/${userId}`);
    const data = await res.json();
    if (data.success) return data.devices;
  } catch (err) {
    try {
      const res = await fetch(`${FALLBACK_BACKEND_URL}/api/devices/${userId}`);
      const data = await res.json();
      if (data.success) return data.devices;
    } catch (e) {
      console.error('API Error fetchDevices:', e);
    }
  }
  return [];
}

export async function fetchThreatEvents(userId: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/events/${userId}`);
    const data = await res.json();
    if (data.success) return data.events;
  } catch (err) {
    try {
      const res = await fetch(`${FALLBACK_BACKEND_URL}/api/events/${userId}`);
      const data = await res.json();
      if (data.success) return data.events;
    } catch (e) {
      console.error('API Error fetchThreatEvents:', e);
    }
  }
  return [];
}

export async function toggleInstantCall(deviceId: string, enabled: boolean) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/devices/${deviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instantCallOnTrigger: enabled })
    });
    return await res.json();
  } catch (err) {
    console.error('Error toggling instant call:', err);
    return { success: false };
  }
}

export async function submitSupportComplaint(payload: { name: string; email: string; subject: string; message: string; phone?: string }) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/complain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error('API Error submitSupportComplaint:', err);
    return { success: false, error: 'Network connection failed.' };
  }
}

export async function syncUserProfile(uid: string, email: string, displayName?: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, email, displayName })
    });
    return await res.json();
  } catch (err) {
    console.error('API Error syncUserProfile:', err);
    return { success: false };
  }
}
