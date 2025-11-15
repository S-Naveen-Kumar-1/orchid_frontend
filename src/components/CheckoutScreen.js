// CheckoutScreen.js
import React, { useState } from 'react';
import { View, Button, Alert, ActivityIndicator } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import axios from 'axios';
import { BASE_URL } from '../config/config';

const API = axios.create({ baseURL: `${BASE_URL}/api/payments`, timeout: 15000 });
const TEST_USER = { id: '69180ffebc175a195c96d401', name: 'Naveen', email: 'navee1110@gmail.com', phone: '7829881674' };
const TEST_PLAN = { planId: 'starter_1', title: 'Starter Plan', price: 49.0 };
const FALLBACK_KEY = 'rzp_test_RfuG7wxkYPeLZr';

export default function CheckoutScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const startPayment = async () => {
    if (!TEST_USER.id || !/^[0-9a-fA-F]{24}$/.test(TEST_USER.id)) { Alert.alert('Invalid user id'); return; }
    setLoading(true);
    try {
      const createResp = await API.post('/create-order', { userId: TEST_USER.id, planId: TEST_PLAN.planId, title: TEST_PLAN.title, price: TEST_PLAN.price });
      const order = createResp.data?.order;
      const serverKey = createResp.data?.key || null;
      if (!order) throw new Error('No order returned');

      const options = { description: TEST_PLAN.title, currency: order.currency || 'INR', key: serverKey || FALLBACK_KEY, amount: order.amount, order_id: order.id, name: 'Kash Spray', prefill: { email: TEST_USER.email, contact: TEST_USER.phone, name: TEST_USER.name }, notes: { planId: TEST_PLAN.planId } };
      const paymentResult = await RazorpayCheckout.open(options);
      const verifyResp = await API.post('/verify-payment', { razorpay_order_id: paymentResult.razorpay_order_id, razorpay_payment_id: paymentResult.razorpay_payment_id, razorpay_signature: paymentResult.razorpay_signature });
      if (verifyResp.data?.ok) { Alert.alert('Success', 'Payment verified and plan activated'); navigation.navigate('BuyPlans'); } else { Alert.alert('Verification failed', verifyResp.data?.message || 'Unknown'); }
    } catch (err) {
      console.error('Payment error:', err);
      Alert.alert('Payment failed', err?.response?.data?.message || err?.message || 'Error');
    } finally { setLoading(false); }
  };

  return (<View style={{ padding: 20, flex: 1, justifyContent: 'center', alignItems: 'center' }}>{loading ? <ActivityIndicator /> : <Button title={`Pay ₹${TEST_PLAN.price}`} onPress={startPayment} />}</View>);
}
