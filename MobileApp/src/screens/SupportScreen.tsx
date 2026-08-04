import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Linking, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { PhoneCall, Mail, MessageSquare, Send, MapPin, LifeBuoy, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { submitSupportComplaint } from '../services/api';

export default function SupportScreen() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleCallEmergency = () => {
    Linking.openURL('tel:+8801793496030').catch(() => {
      Alert.alert('Call Failed', 'Unable to place call to +8801793496030');
    });
  };

  const handleSubmit = async () => {
    if (!subject || !message) {
      Alert.alert('Required', 'Please fill in both Subject and Message.');
      return;
    }
    setLoading(true);
    try {
      const res = await submitSupportComplaint({
        name: user?.displayName || 'App User',
        email: user?.email || 'user@example.com',
        subject,
        message,
        phone
      });
      if (res && res.success) {
        setSubmitted(true);
        setSubject('');
        setMessage('');
        setPhone('');
      } else {
        Alert.alert('Error', res?.error || 'Failed to submit inquiry.');
      }
    } catch (e) {
      console.error('Submit error:', e);
      Alert.alert('Error', 'Network error submitting support request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Get Support & Contact Us</Text>
      <Text style={styles.headerSub}>AEGIS EYE 24/7 Security Helpline & Complaint Desk</Text>

      {/* Emergency Call Action */}
      <TouchableOpacity style={styles.emergencyCard} onPress={handleCallEmergency}>
        <View style={styles.emergencyIconBox}>
          <PhoneCall size={24} color="#ffffff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.emergencyTitle}>24/7 Security Emergency Hotline</Text>
          <Text style={styles.emergencyNumber}>+880 1793 496030</Text>
          <Text style={styles.emergencySub}>Tap to call Control Room immediately</Text>
        </View>
      </TouchableOpacity>

      {/* Info Boxes */}
      <View style={styles.infoRow}>
        <View style={styles.infoBox}>
          <Mail size={20} color="#818cf8" />
          <Text style={styles.infoBoxTitle}>Email Support</Text>
          <Text style={styles.infoBoxValue}>support@bmda.gov.bd</Text>
        </View>

        <View style={styles.infoBox}>
          <MapPin size={20} color="#34d399" />
          <Text style={styles.infoBoxTitle}>Headquarters</Text>
          <Text style={styles.infoBoxValue}>BMDA, Rajshahi</Text>
        </View>
      </View>

      {/* Complaint / Ticket Form */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>File Complaint / Inquiry Ticket</Text>

        {submitted ? (
          <View style={styles.successBox}>
            <CheckCircle2 size={32} color="#34d399" />
            <Text style={styles.successTitle}>Ticket Submitted Successfully!</Text>
            <Text style={styles.successDesc}>Our security dispatch team will review your report shortly.</Text>
            <TouchableOpacity style={styles.newBtn} onPress={() => setSubmitted(false)}>
              <Text style={styles.newBtnText}>Submit Another Ticket</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contact Phone (Optional)</Text>
              <TextInput 
                style={styles.input}
                placeholder="+8801XXXXXXXXX"
                placeholderTextColor="#475569"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subject *</Text>
              <TextInput 
                style={styles.input}
                placeholder="e.g. Camera 1 Feed Issue or Theft Suspicion"
                placeholderTextColor="#475569"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Detailed Description / Message *</Text>
              <TextInput 
                style={[styles.input, styles.textArea]}
                placeholder="Describe your issue or emergency report in detail..."
                placeholderTextColor="#475569"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity 
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.btnRow}>
                  <Send size={18} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Submit Ticket to Control Room</Text>
                </View>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
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
    marginBottom: 16,
  },
  emergencyCard: {
    backgroundColor: '#991b1b',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  emergencyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7f1d1d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '700',
  },
  emergencyNumber: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  emergencySub: {
    color: '#fecaca',
    fontSize: 11,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#131b2e',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  infoBoxTitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
  },
  infoBoxValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#131b2e',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 30,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    height: 46,
    color: '#f8fafc',
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  submitBtn: {
    backgroundColor: '#4f46e5',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34d399',
    marginTop: 12,
  },
  successDesc: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  newBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  newBtnText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '600',
  },
});
