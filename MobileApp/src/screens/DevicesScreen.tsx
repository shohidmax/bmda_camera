import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  ActivityIndicator, 
  Linking,
  Alert,
  Modal,
  SafeAreaView
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Camera, Video, PhoneCall, ExternalLink, MapPin, Cpu, CheckCircle, X, Play } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { fetchDevices, toggleInstantCall } from '../services/api';

export default function DevicesScreen() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    try {
      const devList = await fetchDevices(user.uid);
      setDevices(devList || []);
    } catch (e) {
      console.error('Error loading devices:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleToggleCall = async (devId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    // Optimistic UI update
    setDevices(prev => prev.map(d => d._id === devId ? { ...d, instantCallOnTrigger: newVal } : d));
    
    const res = await toggleInstantCall(devId, newVal);
    if (!res || res.success === false) {
      Alert.alert('Error', 'Failed to update instant call setting.');
      // Revert
      setDevices(prev => prev.map(d => d._id === devId ? { ...d, instantCallOnTrigger: currentVal } : d));
    }
  };

  const [activeStream, setActiveStream] = useState<{ title: string; url: string } | null>(null);

  const openStreamPlayer = (title: string, url: string) => {
    if (!url) return;
    setActiveStream({ title, url });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Paired CCTV Camera Nodes</Text>
      <Text style={styles.headerSub}>Manage live stream feeds & instant call alerts</Text>

      {loading ? (
        <ActivityIndicator color="#6366f1" size="large" style={{ marginVertical: 40 }} />
      ) : devices.length === 0 ? (
        <View style={styles.emptyCard}>
          <Cpu size={40} color="#6366f1" />
          <Text style={styles.emptyTitle}>No Devices Paired</Text>
          <Text style={styles.emptySub}>No active camera nodes associated with your account.</Text>
        </View>
      ) : (
        devices.map((dev, idx) => {
          const streamUrl = dev.cameraUrl || `http://161.248.205.218:1984/stream.html?src=camera_001`;
          const snapshotUrl = dev.snapshotUrl || `http://161.248.205.218:1984/api/frame.jpeg?src=camera_001`;
          const isCallEnabled = dev.instantCallOnTrigger !== undefined ? dev.instantCallOnTrigger : true;

          return (
            <View key={dev._id || `dev-${idx}`} style={styles.deviceCard}>
              {/* Top Header */}
              <View style={styles.cardTop}>
                <View style={styles.titleRow}>
                  <Video size={22} color="#6366f1" />
                  <Text style={styles.deviceName}>{dev.deviceName}</Text>
                </View>
                <View style={styles.onlineBadge}>
                  <View style={styles.greenDot} />
                  <Text style={styles.onlineText}>ONLINE</Text>
                </View>
              </View>

              {/* Specs Grid */}
              <View style={styles.specsBox}>
                <Text style={styles.specLine}>MAC ID: <Text style={styles.specValue}>{dev.uid}</Text></Text>
                <Text style={styles.specLine}>Zone: <Text style={styles.specValue}>{dev.zoneCode || 'ZONE_01'}</Text></Text>
                <Text style={styles.specLine}>Institution: <Text style={styles.specValue}>{dev.institution || 'BMDA'}</Text></Text>
                {dev.location ? (
                  <View style={styles.locationRow}>
                    <MapPin size={13} color="#94a3b8" />
                    <Text style={styles.locationText}>{dev.location}</Text>
                  </View>
                ) : null}
              </View>

              {/* Instant Call Alert Switch */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <PhoneCall size={18} color="#ef4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleTitle}>Instant Phone Call Alerts</Text>
                    <Text style={styles.toggleDesc}>Auto-place voice call on D4 hardware signal</Text>
                  </View>
                </View>
                <Switch 
                  value={isCallEnabled}
                  onValueChange={() => handleToggleCall(dev._id, isCallEnabled)}
                  trackColor={{ false: '#334155', true: '#ef4444' }}
                  thumbColor={isCallEnabled ? '#ffffff' : '#94a3b8'}
                />
              </View>

              {/* Action Buttons */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
    padding: 16,
    paddingTop: 45,
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
  emptyCard: {
    backgroundColor: '#131b2e',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  deviceCard: {
    backgroundColor: '#131b2e',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#064e3b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  specLine: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  specValue: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  toggleTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleDesc: {
    color: '#94a3b8',
    fontSize: 11,
  },
  btnGrid: {
    flexDirection: 'row',
    gap: 10,
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
    height: 42,
    borderRadius: 12,
  },
  btnLabel: {
    color: '#818cf8',
    fontSize: 12,
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
    height: 42,
    borderRadius: 12,
  },
  btnLabelSec: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '700',
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
