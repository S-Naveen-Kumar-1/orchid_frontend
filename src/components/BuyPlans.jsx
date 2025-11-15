// BuyPlansScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as Animatable from "react-native-animatable";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import RazorpayCheckout from "react-native-razorpay";
import { BASE_URL } from "../config/config";

const { width } = Dimensions.get("window");
const PAY_API = axios.create({ baseURL: `${BASE_URL}/api/payments`, timeout: 15000 });
const APP_API = axios.create({ baseURL: BASE_URL, timeout: 15000 });
const FALLBACK_KEY = "rzp_test_RfuG7wxkYPeLZr";

export default function BuyPlansScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [purchasedPlans, setPurchasedPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState({});

  const plans = [
    { id: 1, planKey: "starter_1", title: "Starter Plan", coverage: "Up to 50 Orchids", sprays: "2 Sprays / Month", duration: "1 Month", price: 799, icon: "leaf", colors: ["#43cea2", "#185a9d"], buttonColors: ["#36d1dc", "#5b86e5"] },
    { id: 2, planKey: "pro_1", title: "Pro Plan", coverage: "Up to 150 Orchids", sprays: "3 Sprays / Month", duration: "3 Months", price: 1999, icon: "seedling", colors: ["#f7971e", "#ffd200"], buttonColors: ["#f857a6", "#ff5858"] },
    { id: 3, planKey: "premium_1", title: "Premium Plan", coverage: "Up to 500 Orchids", sprays: "4 Sprays / Month", duration: "6 Months", price: 3999, icon: "tree", colors: ["#8e2de2", "#4a00e0"], buttonColors: ["#ff6a00", "#ee0979"] },
  ];

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        const parsed = userData ? JSON.parse(userData) : null;
        setUser(parsed);

        if (parsed && (parsed.id || parsed._id)) {
          const id = parsed.id || parsed._id;
          try {
            const res = await axios.get(`${BASE_URL}/users/${id}`);
            if (res?.data?.purchasedPlans) setPurchasedPlans(res.data.purchasedPlans || []);
            else if (res?.data) {
              // older servers: maybe full user object returned
              setPurchasedPlans(res.data.purchasedPlans || []);
            }
          } catch (e) {
            console.warn("Could not fetch purchases:", e?.response?.data || e.message || e);
          }
        }
      } catch (err) {
        console.error("loadUser error:", err);
      }
    };
    loadUser();
  }, []);

  const setPlanLoading = (planId, val) => setLoadingPlans(prev => ({ ...prev, [planId]: val }));

  const getPlanStatus = (planId) => {
    const p = purchasedPlans.find(x => String(x.planId) === String(planId));
    if (!p) return null;
    if (p.endDate) {
      const end = new Date(p.endDate);
      return { ...p, status: end > new Date() ? "Active" : "Expired" };
    }
    return p;
  };

  const hasActivePlan = () => {
    if (!Array.isArray(purchasedPlans) || purchasedPlans.length === 0) return false;
    const now = new Date();
    return purchasedPlans.some(p => {
      if (p.status === "Active") {
        if (p.endDate) return new Date(p.endDate) > now;
        return true;
      }
      if (p.endDate) return new Date(p.endDate) > now;
      return false;
    });
  };

  const startPayment = async (plan) => {
    // frontend guard
    if (hasActivePlan()) {
      Alert.alert("Active plan found", "You already have an active plan. You cannot purchase another plan until it expires.");
      return;
    }

    if (!user || !(user.id || user._id)) { Alert.alert("Error", "User not found. Please login."); return; }
    const userId = user.id || user._id;
    setPlanLoading(plan.id, true);

    try {
      // 1) create order on server (includes duration in notes)
      const createResp = await PAY_API.post("/create-order", {
        userId,
        planId: plan.planKey || plan.id,
        title: plan.title,
        price: Number(plan.price),
        duration: plan.duration,
      });

      const order = createResp?.data?.order;
      const serverKey = createResp?.data?.key_id || createResp?.data?.key || null;
      if (!order || !order.id || order.amount == null) throw new Error("Invalid order response from server");

      // 2) open Razorpay checkout
      const amountPaise = Number(order.amount);
      const options = {
        description: plan.title,
        currency: order.currency || "INR",
        key: serverKey || FALLBACK_KEY,
        amount: amountPaise,
        order_id: order.id,
        name: "KashSpray",
        prefill: {
          email: user.email || user.mobile || "",
          contact: user.mobile || user.phone || "",
          name: user.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user.name || "",
        },
        notes: { planId: String(plan.planKey || plan.id), userId },
      };

      const paymentResult = await RazorpayCheckout.open(options);

      // 3) verify on server
      const verifyResp = await PAY_API.post("/verify-payment", {
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature,
      });

      console.log("verifyResp:", verifyResp?.status, verifyResp?.data);

      if (!verifyResp?.data?.ok) {
        Alert.alert("Verification failed", verifyResp?.data?.message || "Payment verification failed");
        return;
      }

      // If server returned plan (verifyPayment created plan), use it
      if (verifyResp.data.plan) {
        const serverPlan = verifyResp.data.plan;
        setPurchasedPlans(prev => [
          ...prev.map(p => p.status === "Active" ? { ...p, status: "Expired" } : p),
          serverPlan,
        ]);
        Alert.alert("Success", `${plan.title} activated`);
        return;
      }

      // Fallback: if server didn't return plan, try app activation endpoint (best-effort)
      try {
        const activateResp = await APP_API.post(`/purchase-plan/${userId}`, {
          planId: plan.planKey || plan.id,
          title: plan.title,
          price: plan.price,
          duration: plan.duration,
        });

        if (activateResp.status === 200) {
          const activatedPlan = activateResp.data.plan;
          setPurchasedPlans(prev => [
            ...prev.map(p => p.status === "Active" ? { ...p, status: "Expired" } : p),
            activatedPlan,
          ]);
          Alert.alert("Success", `${plan.title} activated`);
        } else {
          console.warn("Activation fallback returned non-200:", activateResp?.status, activateResp?.data);
          Alert.alert("Payment verified", "Payment verified but activation may not be saved on server. Check purchases.");
        }
      } catch (activateErr) {
        console.warn("Activation error (frontend):", {
          status: activateErr?.response?.status,
          data: activateErr?.response?.data,
          message: activateErr?.message,
        });
        Alert.alert("Payment verified", activateErr?.response?.data?.message || "Payment verified but activation failed to save. Contact support.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      let friendly = err?.message || "Payment failed";
      try {
        if (err && typeof err.description === "string") {
          const parsed = JSON.parse(err.description);
          friendly = parsed?.error?.description || parsed?.message || JSON.stringify(parsed);
        } else if (err?.response?.data) {
          friendly = err.response.data?.message || JSON.stringify(err.response.data);
        }
      } catch (parseErr) {
        console.warn("Failed to parse razorpay error description", parseErr);
      }
      Alert.alert("Payment failed", friendly);
    } finally {
      setPlanLoading(plan.id, false);
    }
  };

  const activeExists = hasActivePlan();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f0f8f5" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}><Ionicons name="arrow-back" size={28} color="#2e7d32" /></TouchableOpacity>
        <Text style={styles.heading}>Orchid Spray Plans</Text>

        {plans.map((plan, index) => {
          const purchased = getPlanStatus(plan.planKey || plan.id);
          const disabledBecauseOtherActive = activeExists && !(purchased && purchased.status === "Active");
          return (
            <Animatable.View key={plan.id} animation="fadeInUp" delay={index * 120} style={{ width: "100%" }} useNativeDriver>
              <LinearGradient colors={plan.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardGradient}>
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <FontAwesome5 name={plan.icon} size={28} color="#fff" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: "#fff" }]}>{plan.title}</Text>
                      <Text style={[styles.cardSubtitle, { color: "#f0f0f0" }]}>{plan.coverage}</Text>
                      <Text style={[styles.cardSubtitle, { color: "#f0f0f0" }]}>{plan.sprays}</Text>
                    </View>
                  </View>

                  <View style={styles.row}>
                    <Text style={[styles.cardPrice, { color: "#fff" }]}>₹{plan.price}</Text>
                    <Text style={[styles.cardDuration, { color: "#fff" }]}>{plan.duration}</Text>
                  </View>

                  {purchased ? (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ color: "#fff", fontWeight: "600" }}>Status: {purchased.status}</Text>
                      {purchased.endDate && <Text style={{ color: "#fff" }}>Ends on: {new Date(purchased.endDate).toLocaleDateString("en-GB")}</Text>}
                    </View>
                  ) : (
                    <Animatable.View animation="pulse" iterationCount="infinite" iterationDelay={1000} style={{ width: "100%" }}>
                      <TouchableOpacity
                        style={[styles.subscribeButton, disabledBecauseOtherActive && { opacity: 0.6 }]}
                        onPress={() => startPayment(plan)}
                        activeOpacity={0.9}
                        disabled={loadingPlans[plan.id] || disabledBecauseOtherActive}
                      >
                        <LinearGradient colors={plan.buttonColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}>
                          {loadingPlans[plan.id] ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Subscribe</Text>}
                        </LinearGradient>
                      </TouchableOpacity>

                      {disabledBecauseOtherActive && (
                        <Text style={{ color: "#fff", marginTop: 8 }}>
                          You already have an active plan — you cannot buy another plan until it expires.
                        </Text>
                      )}
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
  container: { padding: 20, paddingBottom: 40, alignItems: "center" },
  backIcon: { alignSelf: "flex-start", marginBottom: 10 },
  heading: { fontSize: 26, fontWeight: "bold", color: "#2e7d32", marginBottom: 20, alignSelf: "flex-start" },
  cardGradient: { borderRadius: 20, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  card: { width: width - 40, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, padding: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: "700", marginBottom: 2 },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  cardPrice: { fontSize: 20, fontWeight: "bold" },
  cardDuration: { fontSize: 14, alignSelf: "flex-end" },
  subscribeButton: { width: "100%", marginTop: 8 },
  gradientButton: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", width: "100%", shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16, textAlign: "center" },
});
