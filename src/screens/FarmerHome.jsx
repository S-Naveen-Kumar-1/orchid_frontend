// screens/FarmerHome.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { BASE_URL } from '../config/config';

const { width } = Dimensions.get('window');
const H_GAP = 18;
const CARD_WIDTH = width - H_GAP * 2;

export default function FarmerHome({ navigation }) {
  const [user, setUser] = useState(null); // full user from backend
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const cards = [
    {
      key: 'buy',
      title: 'Buy Plan',
      subtitle: 'Choose subscription & benefits',
      icon: 'shopping-cart',
      screen: 'BuyPlansScreen',
      colors: ['#00b09b', '#96c93d'],
    },
    {
      key: 'book',
      title: 'Book Spray',
      subtitle: 'Schedule spraying for your field',
      icon: 'spray-can',
      screen: 'BookSprayScreen',
      colors: ['#ff8a65', '#ff7043'],
    },
    {
      key: 'track',
      title: 'Track Sprayer',
      subtitle: 'Live location & status',
      icon: 'map-marker-alt',
      screen: 'TrackSprayerScreen',
      colors: ['#6a1b9a', '#8e24aa'],
    },
  ];

  // fetch user id from async storage and then full user from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('user');
        if (!raw) {
          // not logged in, redirect to Login
          navigation.replace('Login');
          return;
        }
        const parsed = JSON.parse(raw);
        const userId = parsed.id || parsed._id;
        if (!userId) {
          navigation.replace('Login');
          return;
        }

        // fetch user from backend
        const resp = await axios.get(`${BASE_URL}/users/${userId}`);
        if (cancelled) return;
        // `getUserById` endpoint earlier returned { user } or user directly.
        // handle both shapes
        const backendUser = resp.data?.user || resp.data;
        setUser(backendUser);
      } catch (err) {
        console.error('Failed to load user:', err?.response?.data || err.message || err);
        Alert.alert('Error', 'Could not load user details. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [navigation]);

  const confirmLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await AsyncStorage.removeItem('user');
            setLoggingOut(false);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  // Derive header stats from user object safely
  const computeStats = (u) => {
    if (!u) return { activePlanCount: 0, pendingBookingCount: 0, spraysLeft: 0 };
    const purchasedPlans = u.purchasedPlans || [];
    const activePlans = purchasedPlans.filter(p => p && (p.status === 'Active' || (p.endDate && new Date(p.endDate) > new Date()) ));
    const activePlanCount = activePlans.length;

    // bookedServices may be populated by getUserById endpoint
    const bookedServices = u.bookedServices || [];
    const pendingBookingCount = (bookedServices.filter && bookedServices.filter(s => s.status === 'Pending').length) || 0;

    // spraysLeft: pick first active plan (or activePlans[0]) and compute allowed - used
    let spraysLeft = 0;
    if (activePlans.length) {
      const p = activePlans[0];
      const allowed = Number(p.spraysAllowed || 0);
      const used = Number(p.spraysUsed || 0);
      spraysLeft = Math.max(0, allowed - used);
    } else {
      spraysLeft = 0;
    }

    return { activePlanCount, pendingBookingCount, spraysLeft };
  };

  const { activePlanCount, pendingBookingCount, spraysLeft } = computeStats(user);

  // Avatar URL fallback (Dicebear) — safe encoding for name
  const avatarUri = user && (user.avatar || `https://api.dicebear.com/6.x/avataaars/png?seed=${encodeURIComponent(user.name || 'farmer')}`);

  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <LinearGradient
          colors={['#eaf7ef', '#f6fbf9']}
          style={styles.header}
        >
          {/* header content row (avatar + greeting) */}
          <View style={styles.headerTop}>
            {/* Avatar */}
            <View style={styles.avatarWrap}>
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>

            {/* Greeting */}
            <View style={styles.greetingWrap}>
              <Text style={styles.greeting}>Hi, {user?.name || 'Farmer'} 👋</Text>
              <Text style={styles.greetingSub}>{user?.email || user?.phone || 'Manage your plans & sprays'}</Text>
            </View>
          </View>

          {/* Right header buttons - absolutely positioned so they don't get clipped */}
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={confirmLogout}
              activeOpacity={0.9}
            >
              <FontAwesome5 name="sign-out-alt" size={14} color="#b71c1c" />
              <Text style={styles.logoutText}>{loggingOut ? '...' : 'Logout'}</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{activePlanCount}</Text>
              <Text style={styles.statLabel}>Active Plan</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{pendingBookingCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>{spraysLeft}</Text>
              <Text style={styles.statLabel}>Sprays Left</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ACTION CARDS */}
        <View style={styles.cardsList}>
          {cards.map(card => (
            <LinearGradient
              key={card.key}
              colors={card.colors}
              style={styles.cardGradient}
            >
              <TouchableOpacity
                style={styles.cardInner}
                onPress={() => navigation.navigate(card.screen)}
                activeOpacity={0.9}
              >
                {/* Icon */}
                <View style={styles.cardLeft}>
                  <View style={styles.iconCircle}>
                    <FontAwesome5 name={card.icon} size={22} color="#fff" />
                  </View>
                </View>

                {/* Labels */}
                <View style={styles.cardCenter}>
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                </View>

                <FontAwesome5 name="chevron-right" size={18} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>
          ))}
        </View>

        {/* INFO CARD */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Tips</Text>
          <Text style={styles.infoText}>• Save more with 3-month plans.</Text>
          <Text style={styles.infoText}>• Update your address for faster service.</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ----------------------
// STYLES
// ----------------------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f4fbf6' },
  container: { padding: H_GAP, paddingBottom: 40 },

  header: {
    borderRadius: 14,
    paddingTop: 18,
    paddingBottom: 18,
    paddingLeft: 14,
    paddingRight: 14,
    marginBottom: 18,
    elevation: 2,
    overflow: 'visible', // allow absolute children to show
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // absolutely positioned icons so they don't get clipped by rounded corner
  headerIcons: {
    position: 'absolute',
    right: H_GAP / 2,
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  avatar: { width: 60, height: 60 },

  greetingWrap: { flex: 1, marginLeft: 12 },
  greeting: { fontSize: 20, fontWeight: '800', color: '#174b2f' },
  greetingSub: { color: '#386b4a', marginTop: 4 },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // make logout button compact so it never reaches header edge
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8, // reduced padding
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#b71c1c',
    marginLeft: 8,
    minWidth: 82,
    justifyContent: 'center',
  },
  logoutText: {
    marginLeft: 6,
    color: '#b71c1c',
    fontWeight: '700',
  },

  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '900', color: '#2e7d32' },
  statLabel: { fontSize: 12, color: '#444', marginTop: 4 },

  cardsList: { marginTop: 8 },
  cardGradient: {
    borderRadius: 14,
    marginBottom: 14,
    width: CARD_WIDTH,
    elevation: 4,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 14,
  },
  cardLeft: { width: 56, alignItems: 'center' },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCenter: { flex: 1, paddingLeft: 10 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  cardSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 },

  infoCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  infoTitle: { fontSize: 18, fontWeight: '800', color: '#1b5e20' },
  infoText: { marginTop: 8, color: '#444', lineHeight: 20 },
});
