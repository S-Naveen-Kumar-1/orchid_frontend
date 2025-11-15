import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Animatable from 'react-native-animatable';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/config';

const { width } = Dimensions.get('window');

export default function BuyPlansScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [purchasedPlans, setPurchasedPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState({}); // per-plan loading

  const plans = [
    {
      id: 1,
      title: 'Starter Plan',
      coverage: 'Up to 50 Orchids',
      sprays: '2 Sprays / Month',
      duration: '1 Month',
      price: '₹799',
      icon: 'leaf',
      colors: ['#43cea2', '#185a9d'],
      buttonColors: ['#36d1dc', '#5b86e5'],
    },
    {
      id: 2,
      title: 'Pro Plan',
      coverage: 'Up to 150 Orchids',
      sprays: '3 Sprays / Month',
      duration: '3 Months',
      price: '₹1999',
      icon: 'seedling',
      colors: ['#f7971e', '#ffd200'],
      buttonColors: ['#f857a6', '#ff5858'],
    },
    {
      id: 3,
      title: 'Premium Plan',
      coverage: 'Up to 500 Orchids',
      sprays: '4 Sprays / Month',
      duration: '6 Months',
      price: '₹3999',
      icon: 'tree',
      colors: ['#8e2de2', '#4a00e0'],
      buttonColors: ['#ff6a00', '#ee0979'],
    },
  ];

  useEffect(() => {
    const loadUser = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log(parsedUser, 'check parsedUser..');

        try {
          const url = `${BASE_URL}/${parsedUser.id}`;
          const res = await axios.get(url);
          setPurchasedPlans(res.data.purchasedPlans || []);
        } catch (error) {
          console.error('Error fetching user data:', error.message || error);
        }
      }
    };
    loadUser();
  }, []);

  // Purchase plan
  const purchasePlan = async plan => {
    if (!user) return Alert.alert('Error', 'User not found.');

    try {
      setLoadingPlans(prev => ({ ...prev, [plan.id]: true }));

      const response = await axios.post(
        `${BASE_URL}/purchase-plan/${user.id}`,
        {
          planId: plan.id,
          title: plan.title,
          price: plan.price,
          duration: plan.duration,
        },
      );

      if (response.status === 200) {
        Alert.alert('Success', `You purchased ${plan.title}!`);

        // Update purchased plans locally
        setPurchasedPlans(prev => [
          ...prev.map(p =>
            p.status === 'Active' ? { ...p, status: 'Expired' } : p,
          ),
          response.data.plan,
        ]);
      } else {
        Alert.alert('Error', 'Failed to purchase plan.');
      }
    } catch (error) {
      console.error('Purchase plan error:', error);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoadingPlans(prev => ({ ...prev, [plan.id]: false }));
    }
  };

  // Check if plan is purchased
  const getPlanStatus = planId => {
    return purchasedPlans.find(p => p.planId === planId.toString()) || null;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f8f5' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIcon}
        >
          <Ionicons name="arrow-back" size={28} color="#2e7d32" />
        </TouchableOpacity>

        <Text style={styles.heading}>Orchid Spray Plans</Text>

        {plans.map((plan, index) => {
          const purchased = getPlanStatus(plan.id);
          return (
            <Animatable.View
              key={plan.id}
              animation="fadeInUp"
              delay={index * 150}
              style={{ width: '100%' }}
              useNativeDriver
            >
              <LinearGradient
                colors={plan.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <FontAwesome5 name={plan.icon} size={28} color="#fff" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: '#fff' }]}>
                        {plan.title}
                      </Text>
                      <Text style={[styles.cardSubtitle, { color: '#f0f0f0' }]}>
                        {plan.coverage}
                      </Text>
                      <Text style={[styles.cardSubtitle, { color: '#f0f0f0' }]}>
                        {plan.sprays}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.row}>
                    <Text style={[styles.cardPrice, { color: '#fff' }]}>
                      {plan.price}
                    </Text>
                    <Text style={[styles.cardDuration, { color: '#fff' }]}>
                      {plan.duration}
                    </Text>
                  </View>

                  {purchased ? (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ color: '#fff', fontWeight: '600' }}>
                        Status: {purchased.status}
                      </Text>
                      <Text style={{ color: '#fff' }}>
                        Ends on:{' '}
                        {new Date(purchased.endDate).toLocaleDateString(
                          'en-GB',
                        )}
                      </Text>
                    </View>
                  ) : (
                    <Animatable.View
                      animation="pulse"
                      iterationCount="infinite"
                      iterationDelay={1000}
                      style={{ width: '100%' }}
                    >
                      <TouchableOpacity
                        style={styles.subscribeButton}
                        onPress={() => purchasePlan(plan)}
                        activeOpacity={0.9}
                        disabled={loadingPlans[plan.id]}
                      >
                        <LinearGradient
                          colors={plan.buttonColors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.gradientButton}
                        >
                          {loadingPlans[plan.id] ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text style={styles.buttonText}>Subscribe</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animatable.View>
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
  container: { padding: 20, paddingBottom: 40, alignItems: 'center' },
  backIcon: { alignSelf: 'flex-start', marginBottom: 10 },
  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  cardGradient: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  card: {
    width: width - 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardPrice: { fontSize: 20, fontWeight: 'bold' },
  cardDuration: { fontSize: 14, alignSelf: 'flex-end' },
  subscribeButton: { width: '100%', marginTop: 8 },
  gradientButton: {
    height: 45,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
});
