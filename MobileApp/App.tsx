import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import DevicesScreen from './src/screens/DevicesScreen';
import ThreatLogsScreen from './src/screens/ThreatLogsScreen';
import SupportScreen from './src/screens/SupportScreen';
import SettingsScreen from './src/screens/SettingsScreen';

import { Shield, Cpu, ShieldAlert, LifeBuoy, Settings as SettingsIcon } from 'lucide-react-native';

function MainApp() {
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<'login' | 'signup'>('login');
  const [currentTab, setCurrentTab] = useState<'Home' | 'Devices' | 'Logs' | 'Support' | 'Settings'>('Home');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Initializing AEGIS EYE AI...</Text>
      </View>
    );
  }

  // Auth Navigation Guard
  if (!user) {
    return authScreen === 'login' ? (
      <LoginScreen onNavigateSignup={() => setAuthScreen('signup')} />
    ) : (
      <SignupScreen onNavigateLogin={() => setAuthScreen('login')} />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />

      {/* Main Content Area */}
      <View style={styles.content}>
        {currentTab === 'Home' && <HomeScreen onNavigateTab={(tab) => setCurrentTab(tab as any)} />}
        {currentTab === 'Devices' && <DevicesScreen />}
        {currentTab === 'Logs' && <ThreatLogsScreen />}
        {currentTab === 'Support' && <SupportScreen />}
        {currentTab === 'Settings' && <SettingsScreen />}
      </View>

      {/* Cool Dark Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setCurrentTab('Home')}
        >
          <Shield size={22} color={currentTab === 'Home' ? '#818cf8' : '#64748b'} />
          <Text style={[styles.tabLabel, currentTab === 'Home' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setCurrentTab('Devices')}
        >
          <Cpu size={22} color={currentTab === 'Devices' ? '#818cf8' : '#64748b'} />
          <Text style={[styles.tabLabel, currentTab === 'Devices' && styles.tabLabelActive]}>Devices</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setCurrentTab('Logs')}
        >
          <ShieldAlert size={22} color={currentTab === 'Logs' ? '#818cf8' : '#64748b'} />
          <Text style={[styles.tabLabel, currentTab === 'Logs' && styles.tabLabelActive]}>Threats</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setCurrentTab('Support')}
        >
          <LifeBuoy size={22} color={currentTab === 'Support' ? '#818cf8' : '#64748b'} />
          <Text style={[styles.tabLabel, currentTab === 'Support' && styles.tabLabelActive]}>Support</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setCurrentTab('Settings')}
        >
          <SettingsIcon size={22} color={currentTab === 'Settings' ? '#818cf8' : '#64748b'} />
          <Text style={[styles.tabLabel, currentTab === 'Settings' && styles.tabLabelActive]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#818cf8',
    fontWeight: '700',
  },
});
