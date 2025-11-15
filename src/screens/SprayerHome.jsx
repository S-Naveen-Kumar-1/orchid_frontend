import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/config';

export default function SprayerHome() {
  const [sprayerId, setSprayerId] = useState(null);
  const [activeTab, setActiveTab] = useState('Pending');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState({});
  const [selectedDates, setSelectedDates] = useState({});

  useEffect(() => {
    const loadSprayerId = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) return;
      const u = JSON.parse(userData);
      setSprayerId(u.id || u._id);
    };
    loadSprayerId();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      // Optionally use ?status=... server-side filtering later
      const res = await axios.get(`${BASE_URL}/sprayer/services`);
      const mapped = (res.data || []).map((s) => ({
        ...s,
        userName: s.user ? s.user.name : (s.userName || ''),
        userPhone: s.user ? s.user.phone : (s.userPhone || ''),
        assignedSprayerId: s.assignedSprayer ? (s.assignedSprayer._id || s.assignedSprayer) : null,
      }));
      mapped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setServices(mapped);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const onChangeDate = (event, date, serviceId) => {
    setShowPicker({ ...showPicker, [serviceId]: false });
    if (date) {
      setSelectedDates({ ...selectedDates, [serviceId]: date });
    }
  };

  /**
   * assignSlotAndClaim:
   * - Called for both "Assign Slot" (without claiming) and "Accept" (claim + assign)
   * - This endpoint (/sprayer/assign-slot) updates service.scheduleDate, status='In Progress', assignedSprayer
   */
  const assignSlotAndClaim = async (service, options = { claim: false }) => {
    if (!sprayerId) return Alert.alert('Error', 'Sprayer ID not available');

    const slot = selectedDates[service._id];
    if (!slot) return Alert.alert('Error', 'Select a date & time first');

    try {
      await axios.post(`${BASE_URL}/sprayer/assign-slot`, {
        serviceId: service._id,
        scheduleDate: slot,
        sprayerId,
      });

      // If this action is a claim (Accept), inform user accordingly.
      if (options.claim) {
        Alert.alert('Accepted', 'You accepted and scheduled the service.');
      } else {
        Alert.alert('Assigned', 'Slot assigned successfully.');
      }

      // clear selected date for this service (so Accept becomes disabled until new selection)
      setSelectedDates(prev => ({ ...prev, [service._id]: null }));
      fetchServices();
    } catch (err) {
      console.error('assign/claim error', err?.response?.data || err);
      Alert.alert('Error', err?.response?.data?.message || 'Something went wrong');
    }
  };

  /**
   * acceptService:
   * - Now requires a selected date; we call assign-slot endpoint (which assigns sprayer + schedule + sets In Progress)
   * - Accept button is disabled until a date is selected
   */
  const acceptService = async (service) => {
    if (!sprayerId) return Alert.alert('Error', 'Sprayer ID not available');

    // require a chosen date
    const slot = selectedDates[service._id];
    if (!slot) {
      return Alert.alert('Select Slot', 'Please select a date & time before accepting the service.');
    }

    // Confirm before claiming
    Alert.alert('Accept Service', `Accept and schedule for ${new Date(slot).toLocaleString()}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: () => assignSlotAndClaim(service, { claim: true }),
      },
    ]);
  };

  /**
   * Legacy assignSlot kept for explicit assign action when sprayer wants to assign without "Accept".
   * It uses the same assign-slot endpoint.
   */
  const assignSlot = async (service) => {
    // simply call assignSlotAndClaim without claim flag
    await assignSlotAndClaim(service, { claim: false });
  };

  const completeService = async (service) => {
    if (!sprayerId) return Alert.alert('Error', 'Sprayer ID not available');

    // Confirm
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

  const filteredServices = services.filter((s) => s.status === activeTab);

  const statusColors = {
    Pending: ['#36D1DC', '#5B86E5'],
    'In Progress': ['#f7971e', '#ffd200'],
    Completed: ['#8e2de2', '#4a00e0'],
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f8f5' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.heading}>Sprayer Dashboard</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['Pending', 'In Progress', 'Completed'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredServices.length === 0 && (
          <Text style={styles.noDataText}>No services in this category</Text>
        )}

        {filteredServices.map((service, idx) => {
          const hasSelectedSlot = !!selectedDates[service._id];
          return (
            <Animatable.View key={service._id} animation="fadeInUp" delay={idx * 100}>
              <LinearGradient
                colors={statusColors[service.status]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{service.field}</Text>
                    <Text style={styles.cardStatus}>{service.status}</Text>
                  </View>

                  <Text style={styles.cardText}>Orchid: {service.orchid}</Text>
                  <Text style={styles.cardText}>Sprays: {service.spraysCount}</Text>
                  <Text style={styles.cardText}>Farmer: {service.userName || '—'}</Text>
                  <Text style={styles.cardText}>Address: {service.address}</Text>
                  <Text style={styles.cardText}>Pincode: {service.pincode}</Text>

                  {/* Pending: Accept only after slot selected */}
                  {service.status === 'Pending' && (
                    <View style={{ marginTop: 10 }}>
                      {/* Accept button (disabled until a slot is chosen) */}
                      <TouchableOpacity
                        onPress={() => acceptService(service)}
                        disabled={!hasSelectedSlot}
                        style={[
                          styles.actionButton,
                          { backgroundColor: hasSelectedSlot ? '#1976d2' : 'rgba(25,118,210,0.4)' },
                        ]}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Accept</Text>
                      </TouchableOpacity>

                      {/* Pick date & assign slot (optional) */}
                      <TouchableOpacity
                        onPress={() => setShowPicker({ ...showPicker, [service._id]: true })}
                        style={[styles.actionButton, { backgroundColor: '#2e7d32', marginTop: 8 }]}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                          {selectedDates[service._id]
                            ? new Date(selectedDates[service._id]).toLocaleString()
                            : 'Select Date & Time'}
                        </Text>
                      </TouchableOpacity>

                      {showPicker[service._id] && (
                        <DateTimePicker
                          value={selectedDates[service._id] || new Date()}
                          mode="datetime"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          minimumDate={new Date()}
                          onChange={(event, date) => onChangeDate(event, date, service._id)}
                        />
                      )}

                      <TouchableOpacity
                        onPress={() => assignSlot(service)}
                        style={[styles.actionButton, { backgroundColor: '#388e3c', marginTop: 8 }]}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Assign Slot</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* In Progress: if this sprayer assigned -> show Complete */}
                  {service.status === 'In Progress' && String(service.assignedSprayerId) === String(sprayerId) && (
                    <View style={{ marginTop: 10 }}>
                      <TouchableOpacity
                        onPress={() => completeService(service)}
                        style={[styles.actionButton, { backgroundColor: '#6a1b9a' }]}
                      >
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Complete Service</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Show farmer contact */}
                  {service.userPhone && (
                    <View style={styles.contactCard}>
                      <Text style={styles.contactText}>Farmer Contact: {service.userPhone}</Text>
                      <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => Linking.openURL(`tel:${service.userPhone}`)}
                      >
                        <Text style={styles.contactButtonText}>Call Farmer</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {service.scheduleDate && (
                    <Text style={{ marginTop: 8, fontWeight: '600', color: '#fff' }}>
                      Scheduled: {new Date(service.scheduleDate).toLocaleString()}
                    </Text>
                  )}

                  {service.completedAt && (
                    <Text style={{ marginTop: 6, fontWeight: '600', color: '#fff' }}>
                      Completed: {new Date(service.completedAt).toLocaleString()}
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </Animatable.View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 28, fontWeight: 'bold', color: '#2e7d32', marginBottom: 20 },
  tabs: { flexDirection: 'row', marginBottom: 15 },
  tabButton: {
    flex: 1,
    padding: 10,
    margin: 2,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  activeTabButton: { backgroundColor: '#2e7d32' },
  tabText: { color: '#555', fontWeight: '600' },
  activeTabText: { color: '#fff' },
  noDataText: { textAlign: 'center', marginVertical: 20, fontSize: 16, color: '#555' },
  cardGradient: { borderRadius: 15, marginBottom: 15 },
  card: { padding: 15, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.1)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  cardStatus: { fontSize: 16, fontWeight: '600', color: '#fff' },
  cardText: { color: '#fff', marginVertical: 1 },
  actionButton: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  contactCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  contactText: { color: '#fff', fontWeight: '600', marginBottom: 6 },
  contactButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  contactButtonText: { color: '#2e7d32', fontWeight: 'bold' },
});
