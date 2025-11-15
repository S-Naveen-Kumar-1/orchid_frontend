// screens/SprayerHome.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { BASE_URL } from '../config/config';

export default function SprayerHome({ navigation }) {
  const insets = useSafeAreaInsets();

  // user details
  const [user, setUser] = useState(null);
  const [sprayerId, setSprayerId] = useState(null);

  const [activeTab, setActiveTab] = useState('Pending');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // per-service UI state:
  const [showPicker, setShowPicker] = useState({});
  const [selectedDates, setSelectedDates] = useState({});

  // load logged-in user id & fetch user profile
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (!raw) {
          navigation.replace('Login');
          return;
        }
        const parsed = JSON.parse(raw);
        const id = parsed.id || parsed._id;
        if (!id) {
          navigation.replace('Login');
          return;
        }
        setSprayerId(id);

        // fetch full user profile from backend (GET /users/:id)
        try {
          const resp = await axios.get(`${BASE_URL}/users/${id}`);
          const fetched = resp.data?.user || resp.data;
          if (!cancelled) setUser(fetched);
        } catch (err) {
          console.warn('Could not fetch user profile:', err?.response?.data || err.message || err);
          // still allow app to continue with parsed basic user info
          if (!cancelled) setUser(parsed);
        }
      } catch (err) {
        console.error('load user', err);
      }
    })();

    return () => { cancelled = true; };
  }, [navigation]);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/sprayer/services`);
      const mapped = (res.data || []).map((s) => ({
        ...s,
        userName: s.user ? s.user.name : s.userName || '—',
        userPhone: s.user ? s.user.phone : s.userPhone || null,
        assignedSprayerId:
          s.assignedSprayer && s.assignedSprayer._id ? s.assignedSprayer._id : s.assignedSprayer || null,
      }));
      mapped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setServices(mapped);
    } catch (err) {
      console.error('fetchServices', err?.response?.data || err);
      Alert.alert('Error', 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  const onChangeDate = (event, date, serviceId) => {
    setShowPicker((p) => ({ ...p, [serviceId]: false }));
    if (date) {
      setSelectedDates((s) => ({ ...s, [serviceId]: date }));
    }
  };

  const requireSprayerId = () => {
    if (!sprayerId) {
      Alert.alert('Error', 'Sprayer ID not available. Please login again.');
      return false;
    }
    return true;
  };

  const assignSlotAndClaim = async (service, { claim = false } = {}) => {
    if (!requireSprayerId()) return;
    const slot = selectedDates[service._id];
    if (!slot) return Alert.alert('Select Slot', 'Please select a date & time first');

    try {
      await axios.post(`${BASE_URL}/sprayer/assign-slot`, {
        serviceId: service._id,
        scheduleDate: slot,
        sprayerId,
      });

      if (claim) {
        Alert.alert('Accepted', 'You accepted and scheduled the service.');
      } else {
        Alert.alert('Assigned', 'Slot assigned successfully.');
      }

      setSelectedDates((p) => ({ ...p, [service._id]: null }));
      fetchServices();
    } catch (err) {
      console.error('assignSlot', err?.response?.data || err);
      Alert.alert('Error', err?.response?.data?.message || 'Could not assign slot');
    }
  };

  const acceptService = (service) => {
    if (!requireSprayerId()) return;
    const slot = selectedDates[service._id];
    if (!slot) return Alert.alert('Select Slot', 'Please select a date & time before accepting the service.');

    Alert.alert('Accept Service', `Accept and schedule for ${new Date(slot).toLocaleString()}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: () => assignSlotAndClaim(service, { claim: true }) },
    ]);
  };

  const assignSlot = (service) => assignSlotAndClaim(service, { claim: false });

  const completeService = (service) => {
    if (!requireSprayerId()) return;
    Alert.alert('Complete Service', 'Mark this service as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: async () => {
          try {
            await axios.post(`${BASE_URL}/sprayer/complete-service`, {
              serviceId: service._id,
              sprayerId,
            });
            Alert.alert('Completed', 'Service marked as completed.');
            fetchServices();
          } catch (err) {
            console.error('complete error', err?.response?.data || err);
            Alert.alert('Error', err?.response?.data?.message || 'Could not complete service');
          }
        },
      },
    ]);
  };

  const logout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('user');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const counts = {
    Pending: services.filter((s) => s.status === 'Pending').length,
    'In Progress': services.filter((s) => s.status === 'In Progress').length,
    Completed: services.filter((s) => s.status === 'Completed').length,
  };

  const filteredServices = services.filter((s) => s.status === activeTab);

  // avatar fallback — prefer user.avatar, else dicebear seeded by name/email
  const avatarUri = user && (user.avatar || `https://api.dicebear.com/6.x/identicon/png?seed=${encodeURIComponent(user.name || user.email || 'sprayer')}`);

  const renderServiceItem = ({ item: service }) => {
    const hasSelectedSlot = !!selectedDates[service._id];
    const isAssignedToMe = String(service.assignedSprayerId) === String(sprayerId);

    const statusColors = {
      Pending: ['#36D1DC', '#5B86E5'],
      'In Progress': ['#f7971e', '#ffd200'],
      Completed: ['#8e2de2', '#4a00e0'],
    };

    return (
      <LinearGradient colors={statusColors[service.status] || ['#ccc', '#999']} style={styles.cardGradient}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{service.field}</Text>
            <Text style={styles.cardStatus}>{service.status}</Text>
          </View>

          <Text style={styles.cardText}>Orchid: {service.orchid}</Text>
          <Text style={styles.cardText}>Sprays: {service.spraysCount}</Text>
          <Text style={styles.cardText}>Farmer: {service.userName}</Text>
          <Text style={styles.cardText}>Address: {service.address}</Text>
          <Text style={styles.cardText}>Pincode: {service.pincode}</Text>

          {/* Actions for Pending */}
          {service.status === 'Pending' && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => acceptService(service)}
                disabled={!hasSelectedSlot}
                style={[styles.primaryButton, !hasSelectedSlot && styles.disabledButton]}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Accept</Text>}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowPicker((p) => ({ ...p, [service._id]: true }))}
                style={styles.secondaryButton}
              >
                <Text style={styles.btnTextSecondary}>
                  {selectedDates[service._id] ? new Date(selectedDates[service._id]).toLocaleString() : 'Pick slot'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => assignSlot(service)} style={styles.tertiaryButton}>
                <Text style={styles.btnText}>Assign</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* In Progress - show complete if assigned to me */}
          {service.status === 'In Progress' && isAssignedToMe && (
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={() => completeService(service)} style={styles.primaryButton}>
                <Text style={styles.btnText}>Complete Service</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* contact card */}
          {service.userPhone && (
            <View style={styles.contactCard}>
              <Text style={styles.contactText}>Farmer: {service.userPhone}</Text>
              <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL(`tel:${service.userPhone}`)}>
                <FontAwesome5 name="phone" size={14} color="#fff" />
                <Text style={styles.callText}>Call</Text>
              </TouchableOpacity>
            </View>
          )}

          {service.scheduleDate && (
            <Text style={styles.scheduledText}>Scheduled: {new Date(service.scheduleDate).toLocaleString()}</Text>
          )}

          {service.completedAt && <Text style={styles.scheduledText}>Completed: {new Date(service.completedAt).toLocaleString()}</Text>}

          {/* DateTimePicker */}
          {showPicker[service._id] && (
            <DateTimePicker
              value={selectedDates[service._id] || new Date()}
              mode="datetime"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(ev, d) => onChangeDate(ev, d, service._id)}
            />
          )}
        </View>
      </LinearGradient>
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { paddingTop: insets.top }]}>
      {/* header */}
      <LinearGradient colors={['#e8f7f6', '#f3fbfb']} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* avatar */}
            <View style={styles.avatarWrap}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} resizeMode="cover" />
            </View>

            <View style={{ marginLeft: 12 }}>
              <Text style={styles.heading}>Sprayer Dashboard</Text>
              <Text style={styles.userName}>{user?.name || user?.first_name || 'Sprayer'}</Text>
              {user?.phone ? <Text style={styles.userPhone}>{user.phone}</Text> : null}
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Logout pill: icon + text */}
            <TouchableOpacity onPress={logout} style={styles.logoutPill} activeOpacity={0.85}>
              <FontAwesome5 name="sign-out-alt" size={16} color="#b71c1c" />
              <Text style={styles.logoutPillText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.countsRow}>
          <View style={styles.countCard}>
            <Text style={styles.countNum}>{counts.Pending}</Text>
            <Text style={styles.countLabel}>Pending</Text>
          </View>
          <View style={styles.countCard}>
            <Text style={styles.countNum}>{counts['In Progress']}</Text>
            <Text style={styles.countLabel}>In Progress</Text>
          </View>
          <View style={styles.countCard}>
            <Text style={styles.countNum}>{counts.Completed}</Text>
            <Text style={styles.countLabel}>Completed</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['Pending', 'In Progress', 'Completed'].map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setActiveTab(t)}
            style={[styles.tabButton, activeTab === t && styles.activeTabButton]}
          >
            <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* list */}
      <FlatList
        data={filteredServices}
        keyExtractor={(i) => String(i._id)}
        renderItem={renderServiceItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color="#2e7d32" />
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No services in this category.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5fbf9' },

  header: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    elevation: 2,
    overflow: 'visible',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 64, height: 64 },

  heading: { fontSize: 18, fontWeight: '800', color: '#0b6b58' },
  userName: { fontSize: 14, fontWeight: '700', color: '#174b2f', marginTop: 4 },
  userPhone: { fontSize: 12, color: '#4d7a63', marginTop: 2 },

  headerRight: { flexDirection: 'row', alignItems: 'center' },

  logoutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f1cacc',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  logoutPillText: {
    marginLeft: 8,
    color: '#b71c1c',
    fontWeight: '700',
    fontSize: 14,
  },

  countsRow: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  countCard: {
    flex: 1,
    backgroundColor: '#fff',
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  countNum: { fontSize: 18, fontWeight: '900', color: '#0b6b58' },
  countLabel: { fontSize: 12, color: '#444', marginTop: 4 },

  tabs: { flexDirection: 'row', padding: 12, justifyContent: 'space-around' },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  activeTabButton: { backgroundColor: '#0b6b58' },
  tabText: { color: '#555', fontWeight: '700' },
  activeTabText: { color: '#fff' },

  listContent: { paddingHorizontal: 16, paddingBottom: 28 },

  cardGradient: { borderRadius: 12, marginBottom: 14 },
  card: { padding: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  cardStatus: { fontSize: 13, color: '#fff', fontWeight: '700' },

  cardText: { color: '#fff', marginTop: 2 },

  actionsRow: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  primaryButton: {
    flex: 1.2,
    backgroundColor: '#1976d2',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  disabledButton: { backgroundColor: 'rgba(25,118,210,0.4)' },
  secondaryButton: {
    flex: 1.6,
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  tertiaryButton: {
    width: 84,
    backgroundColor: '#388e3c',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '800' },
  btnTextSecondary: { color: '#fff', fontWeight: '700' },

  contactCard: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactText: { color: '#fff', fontWeight: '600' },
  callButton: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignItems: 'center' },
  callText: { marginLeft: 8, color: '#0b6b58', fontWeight: '700' },

  scheduledText: { marginTop: 8, color: '#fff', fontWeight: '700' },

  empty: { padding: 28, alignItems: 'center' },
  emptyText: { color: '#666' },
});
