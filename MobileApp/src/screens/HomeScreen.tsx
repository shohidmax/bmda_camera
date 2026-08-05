import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  Linking,
  Alert,
  Modal
} from 'react-native';
import { WebView } from 'react-native-webview';
import { 
  ShieldAlert, 
  Cpu, 
  Activity, 
  CheckCircle, 
  Shield,
  Video,
  Camera,
  MapPin,
  ChevronRight,
  X,
  Play
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { fetchDevices, fetchThreatEvents } from '../services/api';

export default function HomeScreen({ onNavigateTab }: { onNavigateTab: (tab: string) => void }) {
  const { user } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      const [devList, evtList] = await Promise.all([
        fetchDevices(user.uid),
        fetchThreatEvents(user.uid)
      ]);
      setDevices(devList || []);
      setEvents(evtList || []);
    } catch (e) {
      console.error('Error loading home data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const [activeStream, setActiveStream] = useState<{ title: string; url: string } | null>(null);

  const openStreamPlayer = (title: string, url: string) => {
    if (!url) return;
    setActiveStream({ title, url });
  };

  const highThreatCount = events.filter(e => (e.threatScore || 0) >= 80).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
      >
        {/* Header Banner with fixed top padding */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.displayName || 'Security Operator'}</Text>
          </View>
          <View style={styles.roleBadge}>
            <Shield size={14} color="#818cf8" />
            <Text style={styles.roleBadgeText}>{user?.role?.toUpperCase() || 'OPERATOR'}</Text>
          </View>
        </View>

        {/* Live System Status Pill */}
        <View style={styles.systemStatusPill}>
          <View style={styles.liveDot} />
          <Text style={styles.systemStatusText}>SYSTEM ONLINE • REAL-TIME MONITORING</Text>
        </View>

        {/* 1. CCTV DEVICES SECTION (DISPLAYED FIRST) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active CCTV Camera Nodes</Text>
          <TouchableOpacity onPress={() => onNavigateTab('Devices')}>
            <Text style={styles.seeAllText}>Manage All ({devices.length})</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#6366f1" size="large" style={{ marginVertical: 20 }} />
        ) : devices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Cpu size={36} color="#6366f1" />
            <Text style={styles.emptyTitle}>No Camera Nodes Paired</Text>
            <Text style={styles.emptyDesc}>Go to Devices tab to pair a new CCTV camera.</Text>
          </View>
        ) : (
          devices.map((dev, idx) => {
            const streamUrl = dev.cameraUrl || `http://161.248.205.218:1984/stream.html?src=camera_001`;
            const snapshotUrl = dev.snapshotUrl || `http://161.248.205.218:1984/api/frame.jpeg?src=camera_001`;

            return (
              <View key={dev._id || `home-dev-${idx}`} style={styles.deviceCard}>
                <View style={styles.cardTop}>
                  <View style={styles.titleRow}>
                    <Video size={20} color="#818cf8" />
                    <Text style={styles.deviceName}>{dev.deviceName}</Text>
                  </View>
                  <View style={styles.onlineBadge}>
                    <View style={styles.greenDot} />
                    <Text style={styles.onlineText}>ONLINE</Text>
                  </View>
                </View>

                <View style={styles.specsBox}>
                  <Text style={styles.specLine}>MAC: <Text style={styles.specValue}>{dev.uid}</Text> | Zone: <Text style={styles.specValue}>{dev.zoneCode || 'ZONE_01'}</Text></Text>
                  {dev.institution ? (
                    <Text style={styles.specLine}>Institution: <Text style={styles.specValue}>{dev.institution}</Text></Text>
                  ) : null}
                  {dev.location ? (
                    <View style={styles.locationRow}>
                      <MapPin size={12} color="#94a3b8" />
                      <Text style={styles.locationText}>{dev.location}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.btnGrid}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openStreamPlayer(dev.deviceName, streamUrl)}>
                    <Play size={14} color="#818cf8" fill="#818cf8" />
                    <Text style={styles.btnLabel}>Play Stream In-App ▶</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtnSec} onPress={() => openStreamPlayer(`${dev.deviceName} Snapshot`, snapshotUrl)}>
                    <Camera size={14} color="#34d399" />
                    <Text style={styles.btnLabelSec}>View Snapshot</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* 2. STAT CARDS METRICS */}
        <View style={[styles.sectionHeader, { marginTop: 12 }]}>
          <Text style={styles.sectionTitle}>Security Overview</Text>
        </View>

        <View style={styles.statsGrid}>
          {/* Active Nodes Stat */}
          <View style={styles.statCard}>
            <View style={styles.statIconBox}>
              <Cpu size={22} color="#818cf8" />
            </View>
            <Text style={styles.statNumber}>{devices.length}</Text>
            <Text style={styles.statLabel}>Active Nodes</Text>
          </View>

          {/* High Threat Stat */}
          <View style={[styles.statCard, { borderColor: '#ef4444' }]}>
            <View style={[styles.statIconBox, { backgroundColor: '#451a1a' }]}>
              <ShieldAlert size={22} color="#f87171" />
            </View>
            <Text style={[styles.statNumber, { color: '#f87171' }]}>{highThreatCount}</Text>
            <Text style={styles.statLabel}>High Threats</Text>
          </View>

          {/* AI Incidents Stat */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#3b2d14' }]}>
              <Activity size={22} color="#fbbf24" />
            </View>
            <Text style={[styles.statNumber, { color: '#fbbf24' }]}>{events.length}</Text>
            <Text style={styles.statLabel}>AI Logs</Text>
          </View>

          {/* Health Stat */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#143823' }]}>
              <CheckCircle size={22} color="#34d399" />
            </View>
            <Text style={[styles.statNumber, { color: '#34d399' }]}>100%</Text>
            <Text style={styles.statLabel}>Health OK</Text>
          </View>
        </View>

        {/* 3. RECENT THREAT LOGS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent AI Threat Incidents</Text>
          <TouchableOpacity onPress={() => onNavigateTab('Logs')}>
            <Text style={styles.seeAllText}>See All ({events.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Events List */}
        {loading ? (
          <ActivityIndicator color="#6366f1" size="large" style={{ marginVertical: 20 }} />
        ) : events.length === 0 ? (
          <View style={styles.emptyCard}>
            <CheckCircle size={36} color="#34d399" />
            <Text style={styles.emptyTitle}>All Systems Safe</Text>
            <Text style={styles.emptyDesc}>No unauthorized intruder or transformer theft detected.</Text>
          </View>
        ) : (
          events.slice(0, 3).map((item, idx) => {
            const score = item.threatScore || 0;
            const isHigh = score >= 80;
            const isMed = score >= 50 && score < 80;

            return (
              <TouchableOpacity 
                key={item._id || `home-evt-${idx}`} 
                style={styles.eventCard}
                onPress={() => onNavigateTab('Logs')}
              >
                <View style={styles.eventHeader}>
                  <View style={[
                    styles.badge, 
                    isHigh ? styles.badgeHigh : isMed ? styles.badgeMed : styles.badgeLow
                  ]}>
                    <Text style={styles.badgeText}>Score: {score}%</Text>
                  </View>
                  <Text style={styles.eventTime}>
                    {new Date(item.createdAt || item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <Text style={styles.eventMessage}>{item.message}</Text>
                <Text style={styles.eventReport} numberOfLines={2}>
                  {item.aiReport || 'Gemini AI analysis pending...'}
                </Text>
              </TouchableOpacity>
            );
          })
        )}

        {/* IN-APP STREAM PLAYER MODAL */}
        <Modal 
          visible={!!activeStream} 
          animationType="slide" 
          transparent={false}
          onRequestClose={() => setActiveStream(null)}
        >
          <SafeAreaView style={styles.playerContainer}>
            <View style={styles.playerHeader}>
              <View style={styles.playerTitleRow}>
                <View style={styles.liveRedDot} />
                <Text style={styles.playerTitle}>{activeStream?.title || 'Live CCTV Feed'}</Text>
              </View>
              <TouchableOpacity style={styles.closePlayerBtn} onPress={() => setActiveStream(null)}>
                <X size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {activeStream ? (
              <View style={styles.webContainer}>
                <WebView 
                  source={{ uri: activeStream.url }}
                  style={styles.webView}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  mixedContentMode="always"
                  originWhitelist={['*']}
                  scalesPageToFit={true}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator color="#6366f1" size="large" />
                      <Text style={styles.loadingText}>Connecting to Live CCTV Feed...</Text>
                    </View>
                  )}
                />
              </View>
            ) : null}

            <TouchableOpacity style={styles.stopBtn} onPress={() => setActiveStream(null)}>
              <X size={16} color="#ffffff" />
              <Text style={styles.stopBtnText}>Stop & Close Video Stream</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090d16',
    paddingTop: 35,
  },
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  greeting: {
    color: '#94a3b8',
    fontSize: 13,
  },
  userName: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  roleBadgeText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '700',
  },
  systemStatusPill: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399',
  },
  systemStatusText: {
    color: '#a7f3d0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  deviceCard: {
    backgroundColor: '#131b2e',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34d399',
  },
  onlineText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '800',
  },
  specsBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  specLine: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 2,
  },
  specValue: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  btnGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1e1b4b',
    borderColor: '#4338ca',
    borderWidth: 1,
    height: 38,
    borderRadius: 10,
  },
  btnLabel: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtnSec: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 1,
    height: 38,
    borderRadius: 10,
  },
  btnLabelSec: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#131b2e',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1e1b4b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f8fafc',
  },
  seeAllText: {
    fontSize: 13,
    color: '#818cf8',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#131b2e',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34d399',
    marginTop: 10,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  eventCard: {
    backgroundColor: '#131b2e',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeHigh: {
    backgroundColor: '#991b1b',
  },
  badgeMed: {
    backgroundColor: '#92400e',
  },
  badgeLow: {
    backgroundColor: '#065f46',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  eventTime: {
    color: '#64748b',
    fontSize: 12,
  },
  eventMessage: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  eventReport: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  playerContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    paddingTop: 10,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  playerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  playerTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  closePlayerBtn: {
    padding: 6,
    backgroundColor: '#1e293b',
    borderRadius: 20,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
  },
  stopBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
