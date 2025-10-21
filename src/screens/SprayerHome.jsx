// screens/SprayerHome.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as Animatable from 'react-native-animatable';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function SprayerHome({ navigation }) {
  const [activeTab, setActiveTab] = useState('Pending');

  const sprays = [
    {
      id: 1,
      field: 'Field A',
      orchid: 'Phalaenopsis',
      spraysCount: 3,
      status: 'Pending',
      colors: ['#36D1DC', '#5B86E5'],
      buttonColors: ['#43cea2', '#185a9d'],
    },
    {
      id: 2,
      field: 'Field B',
      orchid: 'Dendrobium',
      spraysCount: 2,
      status: 'In Progress',
      colors: ['#f7971e', '#ffd200'],
      buttonColors: ['#f7961e', '#ffb347'],
    },
    {
      id: 3,
      field: 'Field C',
      orchid: 'Cattleya',
      spraysCount: 4,
      status: 'Completed',
      colors: ['#8e2de2', '#4a00e0'],
      buttonColors: ['#6a11cb', '#2575fc'],
    },
  ];

  const filteredSprays = sprays.filter(s => s.status === activeTab);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f8f5' }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backIcon}
        >
          <Ionicons name="arrow-back" size={28} color="#2e7d32" />
        </TouchableOpacity>

        <Text style={styles.heading}>My Sprays</Text>

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

        {filteredSprays.length === 0 && (
          <Text style={styles.noDataText}>No sprays in this category.</Text>
        )}

        {filteredSprays.map((spray, index) => (
          <Animatable.View
            key={spray.id}
            animation="fadeInUp"
            delay={index * 150}
            style={{ width: '100%' }}
            useNativeDriver
          >
            <LinearGradient
              colors={spray.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <FontAwesome5 name="leaf" size={28} color="#fff" />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: '#fff' }]}>
                      {spray.field}
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: '#f0f0f0' }]}>
                      Orchid: {spray.orchid}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.statusText, { color: '#fff' }]}>
                  Sprays Count: {spray.spraysCount}
                </Text>
                <Text style={[styles.statusText, { color: '#fff' }]}>
                  Status: {spray.status}
                </Text>

                <TouchableOpacity
                  onPress={() => alert(`Viewing ${spray.field} details`)}
                  activeOpacity={0.8}
                  style={{ width: '100%', marginTop: 12 }}
                >
                  <LinearGradient
                    colors={spray.buttonColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.cardButton}
                  >
                    <Text style={styles.cardButtonText}>View Details</Text>
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
  tabs: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 12,
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
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
