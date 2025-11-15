// screens/TrackSprayerScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
  Platform,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Animatable from 'react-native-animatable';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { BASE_URL } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

function StarRow({ value = 0, onChange, disabled = false }) {
  // simple star row
  return (
    <View style={{ flexDirection: 'row', marginTop: 8 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => !disabled && onChange && onChange(n)}
          activeOpacity={0.7}
          style={{ paddingHorizontal: 4 }}
        >
          <FontAwesome5 name={n <= value ? 'star' : 'star'} solid={n <= value} size={20} color={n <= value ? '#ffd700' : '#fff'} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function TrackSprayerScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Pending');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [feedbackInputs, setFeedbackInputs] = useState({}); // { [serviceId]: { rating, comment, submitting } }

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (!userData) return;
    const u = JSON.parse(userData);
    setUserId(u.id || u._id);
  };

  useEffect(() => { loadUser(); }, []);

  const fetchServices = useCallback(async (status = '') => {
    try {
      setLoading(true);
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await axios.get(`${BASE_URL}/sprayer/services${query}`);
      const mapped = (res.data || []).map((s) => ({
        _id: s._id,
        serviceTitle: s.serviceTitle,
        field: s.field,
        orchid: s.orchid,
        spraysCount: s.spraysCount,
        address: s.address,
        pincode: s.pincode,
        status: s.status,
        scheduleDate: s.scheduleDate,
        createdAt: s.createdAt,
        completedAt: s.completedAt,
        notes: s.notes,
        feedback: s.feedback || [],
        userName: s.user ? s.user.name : (s.userName || ''),
        userPhone: s.user ? s.user.phone : (s.userPhone || ''),
        userId: s.user ? (s.user._id || s.user.id) : s.userId,
        assignedSprayerName: s.assignedSprayer ? (s.assignedSprayer.name || '') : '',
        assignedSprayerId: s.assignedSprayer ? (s.assignedSprayer._id || s.assignedSprayer) : null,
      }));
      mapped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setServices(mapped);
    } catch (err) {
      console.error('fetchServices error', err?.response?.data || err);
      Alert.alert('Error', 'Could not fetch services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServices(activeTab);
  }, [activeTab, fetchServices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices(activeTab);
  };

  const openMap = (address, pincode) => {
    const q = encodeURIComponent(`${address} ${pincode || ''}`.trim());
    const url = Platform.OS === 'ios' ? `http://maps.apple.com/?q=${q}` : `geo:0,0?q=${q}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) return Linking.openURL(url);
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;
        return Linking.openURL(webUrl);
      })
      .catch(() => Alert.alert('Error', 'Could not open maps'));
  };

  const callNumber = (phone) => {
    if (!phone) return Alert.alert('No phone', 'Phone number not available');
    const url = `tel:${phone}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) return Alert.alert('Error', 'Dialer not available');
        return Linking.openURL(url);
      })
      .catch(() => Alert.alert('Error', 'Could not open dialer'));
  };

  const setFeedbackField = (serviceId, field, value) => {
    setFeedbackInputs((prev) => ({
      ...prev,
      [serviceId]: { ...(prev[serviceId] || {}), [field]: value },
    }));
  };

  const submitFeedback = async (service) => {
    const sid = service._id;
    const input = feedbackInputs[sid] || {};
    const rating = Number(input.rating || 0);
    const comment = input.comment ? String(input.comment).trim() : '';

    if (!rating || rating < 1 || rating > 5) return Alert.alert('Rating required', 'Please select a star rating (1-5).');

    setFeedbackInputs(prev => ({ ...prev, [sid]: { ...(prev[sid] || {}), submitting: true } }));

    try {
      const payload = { rating, comment, byUserId: userId };
      const resp = await axios.post(`${BASE_URL}/service/${sid}/feedback`, payload);
      Alert.alert('Thanks!', 'Feedback submitted.');
      // refresh services to get new feedback shown
      await fetchServices(activeTab);
      // clear local input for this service
      setFeedbackInputs(prev => ({ ...prev, [sid]: { rating: 0, comment: '' } }));
    } catch (err) {
      console.error('submitFeedback error', err?.response?.data || err);
      Alert.alert('Error', err?.response?.data?.message || 'Could not submit feedback');
    } finally {
      setFeedbackInputs(prev => ({ ...prev, [sid]: { ...(prev[sid] || {}), submitting: false } }));
    }
  };

  const alreadyFeedbackByUser = (service, uid) => {
    if (!service.feedback || !Array.isArray(service.feedback)) return false;
    return service.feedback.some(f => String(f.byUser || '') === String(uid));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f8f5' }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={28} color="#2e7d32" />
        </TouchableOpacity>

        <Text style={styles.heading}>Track Services</Text>

        <View style={styles.tabs}>
          {['Pending', 'In Progress', 'Completed'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View style={{ width: '100%', alignItems: 'center', marginVertical: 12 }}>
            <ActivityIndicator size="small" color="#2e7d32" />
          </View>
        )}

        {!loading && services.length === 0 && (
          <Text style={styles.noDataText}>No services found for "{activeTab}"</Text>
        )}

        {services.map((s, i) => (
          <Animatable.View key={s._id} animation="fadeInUp" delay={i * 80} style={{ width: '100%' }} useNativeDriver>
            <LinearGradient
              colors={s.status === 'Pending' ? ['#36D1DC', '#5B86E5'] : s.status === 'In Progress' ? ['#f7971e', '#ffd200'] : ['#8e2de2', '#4a00e0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <FontAwesome5 name="tasks" size={22} color="#fff" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: '#fff' }]}>{s.serviceTitle || 'Service'}</Text>
                    <Text style={[styles.cardSubtitle, { color: '#fff' }]}>{s.field} — {s.orchid}</Text>
                  </View>
                </View>

                <View style={{ marginTop: 8 }}>
                  <Text style={styles.infoText}>Farmer: {s.userName || '—'}</Text>
                  <Text style={styles.infoText}>Phone: {s.userPhone || '—'}</Text>
                  <Text style={styles.infoText}>Address: {s.address || '—'}</Text>
                  <Text style={styles.infoText}>Sprays: {s.spraysCount || 1}</Text>

                  <View style={{ flexDirection: 'row', marginTop: 6, justifyContent: 'space-between' }}>
                    <Text style={styles.smallText}>Status: {s.status}</Text>
                    <Text style={styles.smallText}>Created: {s.createdAt ? new Date(s.createdAt).toLocaleString() : '—'}</Text>
                  </View>

                  {s.scheduleDate && <Text style={[styles.smallText, { marginTop: 6 }]}>Scheduled: {new Date(s.scheduleDate).toLocaleString()}</Text>}
                  {s.completedAt && <Text style={[styles.smallText, { marginTop: 6 }]}>Completed: {new Date(s.completedAt).toLocaleString()}</Text>}

                  <Text style={[styles.smallText, { marginTop: 6 }]}>Assigned Sprayer: {s.assignedSprayerName || 'Not assigned'}</Text>
                </View>

                {/* Existing feedback list */}
                {Array.isArray(s.feedback) && s.feedback.length > 0 && (
                  <View style={{ marginTop: 10, backgroundColor: 'rgba(255,255,255,0.06)', padding: 8, borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', marginBottom: 6 }}>Feedback</Text>
                    {s.feedback.map((f, idx) => (
                      <View key={String(f._id || idx)} style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <StarRow value={f.rating || 0} disabled />
                          <Text style={{ color: '#fff', marginLeft: 8 }}>{f.byUser ? (f.byUser.name || '') : ''}</Text>
                        </View>
                        {f.comment ? <Text style={{ color: '#fff', marginTop: 4 }}>{f.comment}</Text> : null}
                        <Text style={{ color: '#ddd', fontSize: 12, marginTop: 4 }}>{f.createdAt ? new Date(f.createdAt).toLocaleString() : ''}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Feedback UI for Completed services (if user hasn't left feedback) */}
                {s.status === 'Completed' && !alreadyFeedbackByUser(s, userId) && (
                  <View style={{ marginTop: 10, padding: 8, backgroundColor: 'rgba(0,0,0,0.07)', borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Leave Feedback</Text>

                    <StarRow
                      value={(feedbackInputs[s._id] && feedbackInputs[s._id].rating) || 0}
                      onChange={(val) => setFeedbackField(s._id, 'rating', val)}
                    />

                    <TextInput
                      placeholder="Write a short comment (optional)"
                      placeholderTextColor="rgba(255,255,255,0.6)"
                      value={(feedbackInputs[s._id] && feedbackInputs[s._id].comment) || ''}
                      onChangeText={(txt) => setFeedbackField(s._id, 'comment', txt)}
                      style={{
                        marginTop: 8,
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        padding: 8,
                        borderRadius: 6,
                        minHeight: 44,
                      }}
                      multiline
                    />

                    <View style={{ flexDirection: 'row', marginTop: 8 }}>
                      <TouchableOpacity
                        onPress={() => submitFeedback(s)}
                        activeOpacity={0.8}
                        style={[styles.cardButton, { flex: 1 }]}
                      >
                        <Text style={styles.cardButtonText}>
                          {feedbackInputs[s._id] && feedbackInputs[s._id].submitting ? 'Submitting...' : 'Submit Feedback'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={{ flexDirection: 'row', marginTop: 12 }}>
                  <TouchableOpacity style={[styles.cardButton, { flex: 1, marginRight: 8 }]} onPress={() => callNumber(s.userPhone)}>
                    <Text style={styles.cardButtonText}>Call Farmer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.cardButton, { flex: 1, marginLeft: 8 }]} onPress={() => openMap(s.address, s.pincode)}>
                    <Text style={styles.cardButtonText}>View on Map</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </Animatable.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  backIcon: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 12,
    width: '100%',
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#2e7d32',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  activeTabText: {
    color: '#fff',
  },
  noDataText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginVertical: 20,
  },
  cardGradient: {
    borderRadius: 14,
    marginBottom: 14,
    width: width * 0.94,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  card: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  infoText: {
    color: '#fff',
    marginTop: 4,
  },
  smallText: {
    color: '#fff',
    fontSize: 13,
  },
  cardButton: {
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginTop: 8,
  },
  cardButtonText: {
    color: '#2e7d32',
    fontWeight: '700',
  },
});
