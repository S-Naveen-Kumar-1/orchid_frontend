import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { BASE_URL } from '../config/config';

const { width } = Dimensions.get('window');

export default function AdminHome({ navigation }) {
  const [activeTab, setActiveTab] = useState('Farmers');
  const [farmers, setFarmers] = useState([]);
  const [sprayers, setSprayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/users`);
      const allUsers = response.data;

      setFarmers(allUsers.filter(u => u.type === 'farmer'));
      setSprayers(allUsers.filter(u => u.type === 'sprayer'));
    } catch (error) {
      console.error('Fetch users error:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone);
    setModalVisible(true);
  };

  const saveUserDetails = async () => {
    try {
      const updatedUser = {
        name: editName,
        email: editEmail,
        phone: editPhone,
      };
      await axios.put(`${BASE_URL}/users/${editingUser._id}`, updatedUser);
      Alert.alert('Success', 'User details updated');
      setModalVisible(false);
      fetchUsers(); // refresh list
    } catch (error) {
      console.error('Update user error:', error);
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const renderUserCard = (user) => (
    <LinearGradient
      key={user._id}
      colors={user.type === 'farmer' ? ['#36D1DC', '#5B86E5'] : ['#FF512F', '#DD2476']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FontAwesome5
            name={user.type === 'farmer' ? 'user-friends' : 'user-tie'}
            size={28}
            color="#fff"
          />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.cardTitle}>{user.name}</Text>
            <Text style={styles.cardSubtitle}>
              {user.email} | {user.phone}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => openEditModal(user)}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  const displayedUsers = activeTab === 'Farmers' ? farmers : sprayers;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f8f5' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Admin Dashboard</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['Farmers', 'Sprayers'].map(tab => (
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

        {loading ? (
          <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 20 }} />
        ) : displayedUsers.length === 0 ? (
          <Text style={styles.noDataText}>No {activeTab.toLowerCase()} found.</Text>
        ) : (
          displayedUsers.map(user => renderUserCard(user))
        )}
      </ScrollView>

      {/* Edit User Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>Edit User</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#2e7d32' }]}
                onPress={saveUserDetails}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#aaa' }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
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
    alignItems: 'flex-start',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 14,
    marginTop: 2,
    color: '#f0f0f0',
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 12,
    justifyContent: 'flex-end',
    width: '100%',
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FFC107',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  modalHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2e7d32',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
