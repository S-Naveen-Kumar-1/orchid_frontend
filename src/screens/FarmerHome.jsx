// screens/FarmerHome.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function FarmerHome({ navigation }) {
   const cards = [
     {
       title: 'Buy Plan',
       subtitle: 'Choose your subscription',
       icon: 'shopping-cart',
       screen: 'BuyPlansScreen',
       colors: ['#00c6ff', '#0072ff'], // cyan to blue
       buttonColors: ['#00b09b', '#96c93d'], // teal to green
     },
     {
       title: 'Book Spray Service',
       subtitle: 'Schedule your spray',
       icon: 'spray-can',
       screen: 'BookSprayScreen',
       colors: ['#ff512f', '#dd2476'], // red to pink
       buttonColors: ['#f7971e', '#ffd200'], // orange to yellow
     },
     {
       title: 'Track Sprayer',
       subtitle: 'See sprayer location',
       icon: 'map-marker-alt',
       screen: 'TrackSprayerScreen',
       colors: ['#8e2de2', '#4a00e0'], // purple shades
       buttonColors: ['#6a11cb', '#2575fc'], // purple to blue
     },
   ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f8f5' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.greeting}>Hi Naveen 👋</Text>
        <Text style={styles.subText}>Ready to spray today?</Text>

        {cards.map((card, index) => (
          <LinearGradient
            key={index}
            colors={card.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <FontAwesome5 name={card.icon} size={28} color="#fff" />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: '#fff' }]}>
                    {card.title}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: '#f0f0f0' }]}>
                    {card.subtitle}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate(card.screen)}
                activeOpacity={0.8}
                style={{ width: '100%' }}
              >
                <LinearGradient
                  colors={card.buttonColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardButton}
                >
                  <Text style={styles.cardButtonText}>
                    {card.title.includes('Buy')
                      ? 'View Plans'
                      : card.title.includes('Book')
                      ? 'Book Now'
                      : 'Track'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2e7d32',
  },
  subText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#444',
  },
  cardGradient: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  card: {
    width: width - 40,
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  cardButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
});
