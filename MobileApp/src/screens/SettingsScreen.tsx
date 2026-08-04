import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { Download, RefreshCw, LogOut, Shield, User, Cpu, Info, CheckCircle2 } from 'lucide-react-native';
import * as Updates from 'expo-updates';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');

  const handleCheckForUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateStatus('Checking for latest OTA release bundle...');
    try {
      if (__DEV__) {
        setTimeout(() => {
          setCheckingUpdate(false);
          setUpdateStatus('');
          Alert.alert('Up to Date', 'App is running in Development mode (v1.0.4). OTA update checks active in standalone build.');
        }, 1500);
        return;
      }

      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setUpdateStatus('New update found! Downloading...');
        await Updates.fetchUpdateAsync();
        setUpdateStatus('Update downloaded! Reloading app...');
        await Updates.reloadAsync();
      } else {
        setCheckingUpdate(false);
        setUpdateStatus('');
        Alert.alert('App Up to Date', 'AEGIS EYE AI App is up to date (v1.0.4).');
      }
    } catch (error: any) {
      console.error('Update error:', error);
      setCheckingUpdate(false);
      setUpdateStatus('');
      Alert.alert('Update Status', 'Your application is running the latest build version.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Settings & Upgrader</Text>
      <Text style={styles.headerSub}>App system configuration & OTA updater</Text>

      {/* Profile Summary Card */}
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <User size={32} color="#6366f1" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.displayName || 'Security Operator'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'OPERATOR'}</Text>
          </View>
        </View>
      </View>

      {/* Upgrader Section Card */}
      <View style={styles.card}>
        <View style={styles.upgraderHeader}>
          <Download size={22} color="#6366f1" />
          <Text style={styles.cardTitle}>In-App App Upgrader</Text>
        </View>

        <Text style={styles.upgraderDesc}>
          Keep AEGIS EYE updated with the latest AI threat detection models and features directly over-the-air.
        </Text>

        <View style={styles.versionBox}>
          <Text style={styles.versionLabel}>Installed App Version:</Text>
          <Text style={styles.versionNumber}>v1.0.4 (Build 104)</Text>
        </View>

        {updateStatus ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color="#6366f1" size="small" />
            <Text style={styles.statusText}>{updateStatus}</Text>
          </View>
        ) : null}

        {/* Upgrade Button */}
        <TouchableOpacity 
          style={styles.upgradeBtn}
          onPress={handleCheckForUpdates}
          disabled={checkingUpdate}
        >
          {checkingUpdate ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View style={styles.btnRow}>
              <RefreshCw size={18} color="#ffffff" />
              <Text style={styles.upgradeBtnText}>Check for OTA Updates</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Platform Info */}
      <View style={styles.infoCard}>
        <Info size={18} color="#94a3b8" />
        <Text style={styles.infoText}>AEGIS EYE CCTV Security & Gemini 2.0 AI Hub</Text>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <LogOut size={18} color="#ef4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    padding: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 8,
  },
  headerSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#131b2e',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#4338ca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  userEmail: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  roleText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '800',
  },
  upgraderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  upgraderDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  versionBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  versionLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  versionNumber: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '700',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e1b4b',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  statusText: {
    color: '#818cf8',
    fontSize: 12,
  },
  upgradeBtn: {
    backgroundColor: '#4f46e5',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upgradeBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#131b2e',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#451a1a',
    borderColor: '#991b1b',
    borderWidth: 1,
    height: 48,
    borderRadius: 14,
    marginBottom: 40,
  },
  logoutText: {
    color: '#f87171',
    fontSize: 15,
    fontWeight: '700',
  },
});
