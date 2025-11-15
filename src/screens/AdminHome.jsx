// screens/AdminDashboard.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  Linking,
  Platform,
  FlatList,
  SafeAreaView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Ionicons from "react-native-vector-icons/Ionicons";
import axios from "axios";
import { BASE_URL } from "../config/config";

const { width } = Dimensions.get("window");

/* -------------------------
   Small helper components
   ------------------------- */
function Badge({ label, color = "#2e7d32" }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

function SmallStat({ title, value, accent }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: accent || "#2e7d32" }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

/* -------------------------
   Screen
   ------------------------- */
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Farmers"); // Farmers | Sprayers | Bookings
  const [farmers, setFarmers] = useState([]);
  const [sprayers, setSprayers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // user-edit modal
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // service modal
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // search
  const [query, setQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // users
      const usersRes = await axios.get(`${BASE_URL}/users`);
      const allUsers = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.users || []);
      setFarmers(allUsers.filter((u) => u.type === "farmer"));
      setSprayers(allUsers.filter((u) => u.type === "sprayer"));

      // services
      const servicesRes = await axios.get(`${BASE_URL}/sprayer/services`);
      const raw = Array.isArray(servicesRes.data) ? servicesRes.data : (servicesRes.data.services || []);
      const mapped = raw.map((s) => ({
        _id: s._id,
        serviceTitle: s.serviceTitle || s.title || "Service",
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
        userName: s.user ? s.user.name : (s.userName || ""),
        userPhone: s.user ? s.user.phone : (s.userPhone || ""),
        assignedSprayerName: s.assignedSprayer ? (s.assignedSprayer.name || "") : "",
      }));
      mapped.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setServices(mapped);
    } catch (err) {
      console.error("fetchData error", err?.response?.data || err);
      Alert.alert("Error", "Failed to fetch admin data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditPhone(user.phone || "");
    setModalVisible(true);
  };

  const saveUserDetails = async () => {
    if (!editingUser || !editingUser._id) return;
    try {
      await axios.put(`${BASE_URL}/users/${editingUser._id}`, {
        name: editName,
        email: editEmail,
        phone: editPhone,
      });
      Alert.alert("Success", "User updated");
      setModalVisible(false);
      fetchData();
    } catch (err) {
      console.error("saveUserDetails", err?.response?.data || err);
      Alert.alert("Error", "Failed to update user");
    }
  };

  const openServiceModal = (service) => {
    setSelectedService(service);
    setServiceModalVisible(true);
  };
  const closeServiceModal = () => {
    setServiceModalVisible(false);
    setSelectedService(null);
  };

  const callNumber = (phone) => {
    if (!phone) return Alert.alert("No phone", "Phone not available");
    const url = `tel:${phone}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (!supported) return Alert.alert("Error", "Dialer not available");
        return Linking.openURL(url);
      })
      .catch(() => Alert.alert("Error", "Could not open dialer"));
  };

  const openMap = (address, pincode) => {
    const q = encodeURIComponent(`${address} ${pincode || ""}`.trim());
    const url = Platform.OS === "ios" ? `http://maps.apple.com/?q=${q}` : `geo:0,0?q=${q}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) return Linking.openURL(url);
        return Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
      })
      .catch(() => Alert.alert("Error", "Could not open maps"));
  };

  const statusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#0288d1";
      case "In Progress":
        return "#f57c00";
      case "Completed":
        return "#6a1b9a";
      case "Cancelled":
        return "#9e9e9e";
      default:
        return "#2e7d32";
    }
  };

  /* Filtering lists based on query */
  const filteredFarmers = farmers.filter((f) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (f.name || "").toLowerCase().includes(q) || (f.email || "").toLowerCase().includes(q) || (f.phone || "").includes(q);
  });
  const filteredSprayers = sprayers.filter((s) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (s.name || "").toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q) || (s.phone || "").includes(q);
  });
  const filteredServices = services.filter((s) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (s.field || "").toLowerCase().includes(q) || (s.userName || "").toLowerCase().includes(q) || (s.address || "").toLowerCase().includes(q);
  });

  /* -------------------------
     Render helpers
     ------------------------- */
  const renderUserCard = ({ item: user }) => (
    <LinearGradient
      colors={user.type === "farmer" ? ["#E8F7FF", "#E6F4FF"] : ["#FFF0F6", "#FFEFF2"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardGradient}
    >
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <FontAwesome5 name={user.type === "farmer" ? "user-friends" : "user-tie"} size={26} color="#2e7d32" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.cardTitleDark}>{user.name}</Text>
              <Text style={styles.cardSubtitleDark}>{user.email} • {user.phone}</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => openEditModal(user)} style={styles.smallIcon}>
            <Ionicons name="create-outline" size={18} color="#2e7d32" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  const renderServiceCard = ({ item: s }) => (
    <LinearGradient
      colors={["#ffffff", "#ffffff"]}
      style={[styles.cardGradient, { backgroundColor: "transparent" }]}
    >
      <View style={[styles.card, styles.serviceCard]}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitleDark}>{s.serviceTitle}</Text>
            <Text style={styles.cardSubtitleDark}>{s.field} • {s.orchid}</Text>
            <Text style={styles.cardTextDark}>Farmer: {s.userName || "—"} • {s.userPhone || "—"}</Text>
            <Text style={styles.cardTextDark}>Address: {s.address || "—"}, {s.pincode || ""}</Text>
            {s.scheduleDate && <Text style={styles.cardTextDark}>Scheduled: {new Date(s.scheduleDate).toLocaleString()}</Text>}
            {s.completedAt && <Text style={styles.cardTextDark}>Completed: {new Date(s.completedAt).toLocaleString()}</Text>}

            <View style={{ flexDirection: "row", marginTop: 6, alignItems: "center" }}>
              <Text style={[styles.statusLabel, { color: statusColor(s.status) }]}>{s.status}</Text>
              {s.assignedSprayerName ? <Text style={styles.assignedText}> • Assigned: {s.assignedSprayerName}</Text> : null}
            </View>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Badge label={s.status} color={statusColor(s.status)} />
            <TouchableOpacity onPress={() => openServiceModal(s)} style={[styles.smallIcon, { marginTop: 10 }]}>
              <Ionicons name="eye" size={18} color="#2e7d32" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: "row", marginTop: 12 }}>
          <TouchableOpacity onPress={() => callNumber(s.userPhone)} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Call Farmer</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => openMap(s.address, s.pincode)} style={[styles.actionBtn, { marginLeft: 8 }]}>
            <Text style={styles.actionBtnText}>View Map</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );

  /* Header component shown above list items */
  const ListHeader = () => (
    <View style={{ width: "100%" }}>
      <Text style={styles.heading}>Admin Dashboard</Text>

      <View style={styles.statsRow}>
        <SmallStat title="Farmers" value={farmers.length} accent="#1E88E5" />
        <SmallStat title="Sprayers" value={sprayers.length} accent="#E53935" />
        <SmallStat title="Bookings" value={services.length} accent="#2e7d32" />
      </View>

      <View style={styles.tabsRow}>
        {["Farmers", "Sprayers", "Bookings"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => { setActiveTab(tab); setQuery(""); }}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          placeholder="Search name, email, phone, field, address..."
          placeholderTextColor="#9aa0a6"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        <TouchableOpacity onPress={() => fetchData()} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 12 }} />
    </View>
  );

  /* data & render function for FlatList depending on tab */
  const data = activeTab === "Farmers" ? filteredFarmers : activeTab === "Sprayers" ? filteredSprayers : filteredServices;
  const renderItem = activeTab === "Bookings" ? renderServiceCard : renderUserCard;

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={data}
        keyExtractor={(i) => i._id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: 40, alignItems: "center" }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={!loading && <Text style={styles.noDataText}>No {activeTab.toLowerCase()} found.</Text>}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      )}

      {/* Edit user modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeading}>Edit User</Text>
            <TextInput style={styles.input} placeholder="Name" value={editName} onChangeText={setEditName} />
            <TextInput style={styles.input} placeholder="Email" value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Phone" value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />
            <View style={{ flexDirection: "row", marginTop: 12 }}>
              <TouchableOpacity onPress={saveUserDetails} style={[styles.modalBtn, { backgroundColor: "#2e7d32" }]}>
                <Text style={styles.modalBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalBtn, { backgroundColor: "#9e9e9e", marginLeft: 10 }]}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Service details modal */}
      <Modal visible={serviceModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: "82%" }]}>
            {selectedService ? (
              <>
                <Text style={styles.modalHeading}>Service details</Text>
                <Text style={styles.detailLabel}>{selectedService.serviceTitle}</Text>
                <Text style={styles.detailText}>Farmer: {selectedService.userName} • {selectedService.userPhone}</Text>
                <Text style={styles.detailText}>Field: {selectedService.field} • {selectedService.orchid}</Text>
                <Text style={styles.detailText}>Address: {selectedService.address}, {selectedService.pincode}</Text>
                <Text style={styles.detailText}>Status: {selectedService.status}</Text>
                {selectedService.scheduleDate && <Text style={styles.detailText}>Scheduled: {new Date(selectedService.scheduleDate).toLocaleString()}</Text>}
                {selectedService.completedAt && <Text style={styles.detailText}>Completed: {new Date(selectedService.completedAt).toLocaleString()}</Text>}

                <View style={{ flexDirection: "row", marginTop: 14 }}>
                  <TouchableOpacity onPress={() => callNumber(selectedService.userPhone)} style={[styles.modalBtn, { backgroundColor: "#2e7d32", flex: 1 }]}>
                    <Text style={styles.modalBtnText}>Call Farmer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => openMap(selectedService.address, selectedService.pincode)} style={[styles.modalBtn, { backgroundColor: "#1976d2", flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.modalBtnText}>Open Map</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={closeServiceModal} style={[styles.modalBtn, { backgroundColor: "#9e9e9e", marginTop: 12 }]}>
                  <Text style={styles.modalBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <ActivityIndicator />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* -------------------------
   Styles (accessible, high-contrast)
   ------------------------- */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3FBF6" },
  heading: { fontSize: 32, fontWeight: "800", color: "#1b5e20", paddingHorizontal: 14, marginTop: 10 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 6, marginTop: 12 },
  stat: { flex: 1, backgroundColor: "#fff", padding: 12, borderRadius: 12, alignItems: "center", marginHorizontal: 6, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: "900" },
  statTitle: { fontSize: 12, color: "#666", marginTop: 4 },
  tabsRow: { flexDirection: "row", marginTop: 12, paddingHorizontal: 6 },
  tabBtn: { flex: 1, paddingVertical: 10, marginHorizontal: 6, borderRadius: 10, backgroundColor: "#e9ecef", alignItems: "center" },
  tabBtnActive: { backgroundColor: "#2e7d32" },
  tabBtnText: { color: "#303030", fontWeight: "700" },
  tabBtnTextActive: { color: "#fff" },
  searchRow: { flexDirection: "row", marginTop: 12, paddingHorizontal: 6, alignItems: "center" },
  searchInput: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "#e0e0e0" },
  refreshBtn: { marginLeft: 8, backgroundColor: "#2e7d32", padding: 12, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  cardGradient: { borderRadius: 14, marginBottom: 12, width: width * 0.94, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  card: { padding: 14, borderRadius: 14, backgroundColor: "#fff" },
  serviceCard: { backgroundColor: "#fff", borderWidth: 0.5, borderColor: "#eef5ef" },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  cardTitleDark: { fontSize: 18, fontWeight: "800", color: "#1b5e20" },
  cardSubtitleDark: { fontSize: 13, color: "#4b4b4b", marginTop: 2 },
  cardTextDark: { color: "#4b4b4b", marginTop: 6 },
  statusLabel: { fontWeight: "800", fontSize: 13 },
  assignedText: { color: "#555", marginLeft: 8 },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: "#fff", fontWeight: "800" },

  smallIcon: { backgroundColor: "rgba(46,125,50,0.08)", padding: 8, borderRadius: 10 },
  actionBtn: { flex: 1, backgroundColor: "#1b5e20", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  actionBtnText: { color: "#fff", fontWeight: "800" },

  noDataText: { textAlign: "center", color: "#666", marginTop: 20 },

  loadingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalCard: { width: "92%", backgroundColor: "#fff", borderRadius: 12, padding: 16 },
  modalHeading: { fontSize: 18, fontWeight: "900", color: "#1b5e20", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#e0e0e0", padding: 10, borderRadius: 10, marginTop: 8 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center" },
  modalBtnText: { color: "#fff", fontWeight: "800" },

  detailLabel: { fontSize: 16, fontWeight: "800", color: "#333", marginTop: 8 },
  detailText: { color: "#333", marginTop: 6 },
});
