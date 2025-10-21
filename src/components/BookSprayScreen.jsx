// screens/BookSprayScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Animatable from 'react-native-animatable';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function BookSprayScreen({ navigation }) {
  const services = [
    {
      id: 1,
      title: 'Fertilizer Spray',
      description: 'Boost your crops with essential nutrients',
      icon: 'leaf',
      colors: ['#00c6ff', '#0072ff'],
      buttonColors: ['#00b09b', '#96c93d'],
    },
    {
      id: 2,
      title: 'Pesticide Spray',
      description: 'Protect your crops from pests and diseases',
      icon: 'bug',
      colors: ['#f7971e', '#ffd200'],
      buttonColors: ['#f7971e', '#ffb347'],
    },
    {
      id: 3,
      title: 'Herbicide Spray',
      description: 'Eliminate unwanted weeds efficiently',
      icon: 'spray-can',
      colors: ['#8e2de2', '#4a00e0'],
      buttonColors: ['#6a11cb', '#2575fc'],
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f8f5' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back icon */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIcon}
        >
          <Ionicons name="arrow-back" size={28} color="#2e7d32" />
        </TouchableOpacity>

        <Text style={styles.heading}>Book Spray Service</Text>

        {services.map((service, index) => (
          <Animatable.View
            key={service.id}
            animation="fadeInUp"
            delay={index * 150}
            style={{ width: '100%' }}
            useNativeDriver
          >
            <LinearGradient
              colors={service.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <FontAwesome5 name={service.icon} size={28} color="#fff" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: '#fff' }]}>
                      {service.title}
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: '#f0f0f0' }]}>
                      {service.description}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => alert(`Booked ${service.title}`)}
                  activeOpacity={0.8}
                  style={{ width: '100%' }}
                >
                  <LinearGradient
                    colors={service.buttonColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cardButton}
                  >
                    <Text style={styles.cardButtonText}>Book Now</Text>
                  </LinearGradient>
                </TouchableOpacity>
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
    elevation: 8,
  },
  card: {
    width: width * 0.9,
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
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
