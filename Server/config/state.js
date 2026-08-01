// Shared in-memory data store for development fallback when MongoDB is not running

const memDevices = [
  {
    _id: 'mock-device-id-123',
    uid: '00:11:22:33:44:55',
    deviceName: 'Simulated Entryway Camera',
    cameraUrl: 'http://161.248.205.218:1984/stream.html?src=camera_004',
    snapshotUrl: 'http://161.248.205.218:1984/api/frame.jpeg?src=camera_004',
    zoneCode: 'ZONE_01',
    institution: 'Barind Multipurpose Development Authority(BMDA)',
    location: 'Godagari, Rajshahi',
    latitude: '24.4712',
    longitude: '88.3308',
    phoneNumbers: [],
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
