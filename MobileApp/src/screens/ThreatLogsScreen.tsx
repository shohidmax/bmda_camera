import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Modal, 
  ActivityIndicator 
} from 'react-native';
import { ShieldAlert, Image as ImageIcon, X, AlertTriangle, Calendar, Clock, MapPin } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { fetchThreatEvents } from '../services/api';

export default function ThreatLogsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      const evtList = await fetchThreatEvents(user.uid);
      setEvents(evtList || []);
    } catch (e) {
      console.error('Error loading events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Threat Activity Log</Text>
      <Text style={styles.headerSub}>Gemini 2.0 AI electric pole & transformer security incident stream</Text>

      {loading ? (
        <ActivityIndicator color="#6366f1" size="large" style={{ marginVertical: 40 }} />
      ) : events.length === 0 ? (
        <View style={styles.emptyCard}>
          <ShieldAlert size={40} color="#6366f1" />
          <Text style={styles.emptyTitle}>No Incidents Logged</Text>
          <Text style={styles.emptySub}>All security zones report clean status.</Text>
        </View>
      ) : (
        events.map((evt, idx) => {
          const score = evt.threatScore || 0;
          const isHigh = score >= 80;
          const isMed = score >= 50 && score < 80;
          const images = evt.capturedImages || [];

          return (
            <View key={evt._id || `evt-${idx}`} style={styles.card}>
              {/* Top Bar */}
              <View style={styles.cardHeader}>
                <View style={[
                  styles.scoreBadge, 
                  isHigh ? styles.bgRed : isMed ? styles.bgAmber : styles.bgGreen
                ]}>
                  <AlertTriangle size={13} color="#ffffff" />
                  <Text style={styles.scoreText}>Threat Score: {score}%</Text>
                </View>

                <View style={styles.timeRow}>
                  <Clock size={12} color="#94a3b8" />
                  <Text style={styles.timeText}>
                    {new Date(evt.createdAt || evt.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </Text>
                </View>
              </View>

              {/* Title & Zone */}
              <Text style={styles.eventMessage}>{evt.message}</Text>
              <View style={styles.zoneRow}>
                <MapPin size={12} color="#64748b" />
                <Text style={styles.zoneText}>Zone: {evt.zoneCode || 'ZONE_01'} | MAC: {evt.uid}</Text>
              </View>

              {/* Gemini AI Analysis Box */}
              <View style={styles.reportBox}>
                <Text style={styles.reportTitle}>Gemini AI Threat Analysis Report:</Text>
                <Text style={styles.reportContent}>{evt.aiReport || 'Analysis in progress...'}</Text>
              </View>

              {/* Captured Snapshots Gallery */}
              {images.length > 0 ? (
                <View style={styles.galleryContainer}>
                  <Text style={styles.galleryTitle}>Captured High-Res Snapshots ({images.length}):</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                    {images.map((imgUrl: string, idx: number) => (
                      <TouchableOpacity key={idx} onPress={() => setSelectedImage(imgUrl)}>
                        <Image source={{ uri: imgUrl }} style={styles.thumbImage} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          );
        })
      )}

      {/* Image Preview Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedImage(null)}>
            <X size={28} color="#ffffff" />
          </TouchableOpacity>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
          ) : null}
        </View>
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
  card: {
    backgroundColor: '#131b2e',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  bgRed: {
    backgroundColor: '#991b1b',
  },
  bgAmber: {
    backgroundColor: '#92400e',
  },
  bgGreen: {
    backgroundColor: '#065f46',
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  eventMessage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  zoneText: {
    color: '#64748b',
    fontSize: 12,
  },
  reportBox: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  reportTitle: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  reportContent: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
  galleryContainer: {
    marginTop: 4,
  },
  galleryTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  imageScroll: {
    flexDirection: 'row',
  },
  thumbImage: {
    width: 84,
    height: 64,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#1e293b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 48,
    right: 24,
    zIndex: 10,
    padding: 8,
    backgroundColor: '#334155',
    borderRadius: 20,
  },
  fullImage: {
    width: '100%',
    height: '80%',
    borderRadius: 16,
  },
});
