// Shared in-memory data store for development fallback when MongoDB is not running

const memDevices = [
  {
    _id: 'mock-device-id-123',
    uid: '00:11:22:33:44:55',
    deviceName: 'Simulated Entryway Camera',
    cameraUrl: 'https://picsum.photos/800/600',
    zoneCode: 'ZONE_01',
    userId: 'mock-user-123',
    createdAt: new Date()
  }
];

const memEvents = [];

const memUsers = [
  {
    _id: 'mock-user-123',
    uid: 'mock-user-123',
    email: 'operator@example.com',
    displayName: 'Operator User',
    role: 'operator',
    accessibleDevices: []
  },
  {
    _id: 'mock-admin-999',
    uid: 'mock-google-user-999',
    email: 'admin@example.com',
    displayName: 'Admin User',
    role: 'admin',
    accessibleDevices: []
  }
];

module.exports = {
  memDevices,
  memEvents,
  memUsers
};
