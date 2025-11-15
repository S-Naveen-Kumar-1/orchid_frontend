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
      setSprayerId(u.id);
    };
    loadSprayerId();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BASE_URL}/sprayer/services`);
      setServices(
        res.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      );
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

  const assignSlot = async service => {
    if (!sprayerId) return Alert.alert('Error', 'Sprayer ID not available');

    const slot = selectedDates[service._id];
    if (!slot) return Alert.alert('Error', 'Select a date & time');

    try {
      await axios.post(`${BASE_URL}/sprayer/assign-slot`, {
        serviceId: service._id,
        userId: service.userId,
        sprayerId,
        scheduleDate: slot,
      });

      Alert.alert('Success', 'Slot assigned successfully');
      setSelectedDates({ ...selectedDates, [service._id]: null });
      fetchServices();
    } catch (err) {
      console.error(err, err.response?.data?.message);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Something went wrong'
      );
    }
  };

  const filteredServices = services.filter(s => s.status === activeTab);

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
          {['Pending', 'In Progress', 'Completed'].map(tab => (
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

        {filteredServices.map((service, idx) => (
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
                <Text style={styles.cardText}>Farmer: {service.userName}</Text>
                <Text style={styles.cardText}>Address: {service.address}</Text>
                <Text style={styles.cardText}>Pincode: {service.pincode}</Text>

                {/* Pending: Assign slot */}
                {service.status === 'Pending' && (
                  <View style={{ marginTop: 10 }}>
                    <TouchableOpacity
                      onPress={() => setShowPicker({ ...showPicker, [service._id]: true })}
                      style={styles.assignButton}
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
                      style={[styles.assignButton, { marginTop: 6 }]}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Assign Slot</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Show farmer contact once slot assigned */}
                {service.status !== 'Pending' && service.userPhone && (
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
              </View>
            </LinearGradient>
          </Animatable.View>
        ))}
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
  assignButton: {
    backgroundColor: '#2e7d32',
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
