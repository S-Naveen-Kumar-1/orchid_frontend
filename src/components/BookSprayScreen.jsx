// screens/BookSprayScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../config/config';
import { SafeAreaView } from 'react-native-safe-area-context';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BookSprayScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [booking, setBooking] = useState(null);
  const [field, setField] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [canBook, setCanBook] = useState(false);
  const [serviceType, setServiceType] = useState('');
  const [editMode, setEditMode] = useState(false); // toggle form visibility

  const planServiceMap = {
    'Starter Plan': 'Fertilizer Spray',
    'Pesticide Plan': 'Pesticide Spray',
    'Herbicide Plan': 'Herbicide Spray',
  };

  // Load user data & booking info
  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) return;

      const u = JSON.parse(userData);
      setUser(u);

      try {
        const res = await axios.get(`${BASE_URL}/${u.id}`);
        const data = res.data;

        // Check active plan
        const activePlan = data.purchasedPlans?.find(p => p.status === 'Active');
        const hasActivePlan = data.planActive || !!activePlan;
        setCanBook(hasActivePlan);

        if (!hasActivePlan) return;

        // Determine service type from active plan
        const planTitle = activePlan ? activePlan.title : '';
        setServiceType(planServiceMap[planTitle] || 'Fertilizer Spray');

        // Get existing booking (Pending or In Progress)
        const pending = data.bookedServices?.find(
          b => b.status === 'Pending' || b.status === 'In Progress'
        );
        if (pending) {
          setBooking(pending);
          setField(pending.field);
          setAddress(pending.address);
          setPincode(pending.pincode || '');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUser();
  }, []);

  const toggleEdit = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditMode(!editMode);
  };

  const submitBooking = async () => {
    if (!user) return Alert.alert('Error', 'User not found.');
    if (!canBook) return Alert.alert('Info', 'You need an active plan to book a service.');
    if (!field || !address || !pincode) return Alert.alert('Error', 'Please fill all fields.');

    try {
      setLoading(true);
      const payload = { serviceTitle: serviceType, field, address, pincode };

      if (booking) {
        if (booking.status !== 'Pending') {
          return Alert.alert('Info', 'Booking already accepted. Cannot edit.');
        }

        // Update existing booking
        const res = await axios.put(`${BASE_URL}/edit-booking/${user.id}/${booking._id}`, payload);
        if (res.status === 200) {
          setBooking(res.data.service);
          setEditMode(false);
          Alert.alert('Success', 'Booking updated. Sprayer will contact you soon.');
        }
      } else {
        // Create new booking
        const res = await axios.post(`${BASE_URL}/book-service/${user.id}`, payload);
        if (res.status === 200) {
          setBooking(res.data.service);
          setEditMode(false);
          Alert.alert('Success', 'Service booked successfully. Sprayer will contact you soon.');
        }
      }
    } catch (error) {
      console.error('Booking Error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f8f5' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={28} color="#2e7d32" />
        </TouchableOpacity>

        <Text style={styles.heading}>Book Spray Service</Text>

        {!canBook ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>
              You need to purchase an active plan to book a service.
            </Text>
          </View>
        ) : booking && !editMode ? (
          // Pending/In-Progress booking card view
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{serviceType}</Text>
              {booking.status === 'Pending' && (
                <TouchableOpacity onPress={toggleEdit}>
                  <Ionicons name="create-outline" size={22} color="#2e7d32" />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.infoText}>Field: {booking.field}</Text>
            <Text style={styles.infoText}>Address: {booking.address}</Text>
            <Text style={styles.infoText}>Pincode: {booking.pincode}</Text>
            <Text style={[styles.statusText, { marginTop: 8 }]}>Status: {booking.status}</Text>

            {/* Show assigned sprayer and schedule */}
            {booking.status !== 'Pending' && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.infoText}>
                  Assigned Sprayer: {booking.assignedSprayer?.name || 'Not assigned yet'}
                </Text>
                <Text style={styles.infoText}>
                  Scheduled Date:{' '}
                  {booking.scheduleDate
                    ? new Date(booking.scheduleDate).toLocaleString()
                    : 'Not scheduled'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          // Booking form (new or editing)
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{serviceType}</Text>
            </View>

            <TextInput
              placeholder="Field Name"
              value={field}
              onChangeText={setField}
              style={styles.input}
            />
            <TextInput
              placeholder="Address"
              value={address}
              onChangeText={setAddress}
              style={styles.input}
            />
            <TextInput
              placeholder="Pincode"
              value={pincode}
              onChangeText={setPincode}
              keyboardType="numeric"
              style={styles.input}
            />

            <TouchableOpacity
              onPress={submitBooking}
              activeOpacity={0.8}
              style={[styles.cardButton, { backgroundColor: '#2e7d32' }]}
              disabled={loading}
            >
              <Text style={styles.cardButtonText}>
                {loading ? 'Processing...' : booking ? 'Update Booking' : 'Book Now'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  backIcon: { marginBottom: 10 },
  heading: { fontSize: 28, fontWeight: 'bold', color: '#2e7d32', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  input: { width: '100%', backgroundColor: '#f2f2f2', borderRadius: 10, padding: 12, marginBottom: 12 },
  cardButton: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statusText: { fontWeight: 'bold', color: '#2e7d32' },
  infoText: { color: '#555', fontSize: 16, marginBottom: 4 },
  messageCard: { backgroundColor: '#fff3f3', padding: 15, borderRadius: 12 },
  messageText: { color: '#d32f2f', fontWeight: 'bold' },
});
