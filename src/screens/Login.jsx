// LoginScreen.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverOk, setServerOk] = useState(true);

  useEffect(() => {
    console.log("sdcds")
    let cancelled = false;
    const check = async () => {
      try {
        const resp = await axios.get(`${BASE_URL}/`, { timeout: 7000 });
        console.log(resp,"fevsdf")
        if (!cancelled) setServerOk(resp.status >= 200 && resp.status < 300);
      } catch (err) {
        console.log(err)
        if (!cancelled) setServerOk(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    if (!serverOk) { Alert.alert('Server Unreachable', 'Cannot reach server right now.'); return; }

    setLoading(true);
    try {
      if (email === 'orchidadmin213@gmail.com' && password === 'orchid@123') {
        const adminUser = { id: 'admin-local', email, type: 'admin', first_name: 'Admin' };
        await AsyncStorage.setItem('user', JSON.stringify(adminUser));
        navigation.replace('AdminHome');
        return;
      }
      const resp = await axios.post(`${BASE_URL}/login`, { email, password }, { timeout: 10000 });
      if (!resp?.data?.user) throw new Error('Invalid server response (missing user)');
      const user = resp.data.user;
      await AsyncStorage.setItem('user', JSON.stringify(user));
      if (user.type === 'farmer') navigation.replace('FarmerHome');
      else if (user.type === 'sprayer') navigation.replace('SprayerHome');
      else if (user.type === 'admin') navigation.replace('AdminHome');
      else { Alert.alert('Login OK', 'Unknown user type'); navigation.replace('FarmerHome'); }
    } catch (err) {
      console.error('Login error:', { message: err.message, response: err.response?.data });
      if (err.response) Alert.alert('Login failed', err.response.data?.message || JSON.stringify(err.response.data));
      else if (err.request) { Alert.alert('No response', 'Server did not respond.'); setServerOk(false); }
      else Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={60}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.loginText}>Login</Text>
        <Text style={styles.title}>KASHSPRAY</Text>

        {!serverOk && <View style={styles.serverBanner}><Text style={styles.serverBannerText}>Server unreachable — some features may not work</Text></View>}

        <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="Email" placeholderTextColor="#888" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={t => { setEmail(t); if (errors.email) setErrors(prev => ({ ...prev, email: null })); }} />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <TextInput style={[styles.input, errors.password && styles.inputError]} placeholder="Password" placeholderTextColor="#888" secureTextEntry value={password} onChangeText={t => { setPassword(t); if (errors.password) setErrors(prev => ({ ...prev, password: null })); }} />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        {loading ? <ActivityIndicator size="large" color="#2e7d32" style={{ marginTop: 20 }} /> :
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={!serverOk}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        }

        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate('RegisterScreen')}>
          <Text style={{ color: '#2e7d32', fontWeight: '600' }}>Don't have an account? Create Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: '#f0f8f5', paddingVertical: 40 },
  loginText: { fontSize: 22, fontWeight: '600', marginBottom: 6 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  serverBanner: { backgroundColor: '#fff4e5', padding: 8, borderRadius: 8, marginBottom: 12, width: '100%' },
  serverBannerText: { color: '#8a6d3b', textAlign: 'center' },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 8, backgroundColor: '#fff', fontSize: 16 },
  inputError: { borderColor: 'red' },
  errorText: { alignSelf: 'flex-start', color: 'red', marginBottom: 8, marginLeft: 4, fontSize: 13 },
  button: { width: '100%', backgroundColor: '#2e7d32', paddingVertical: 14, borderRadius: 8, marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 16, textAlign: 'center', fontWeight: '600' },
});
