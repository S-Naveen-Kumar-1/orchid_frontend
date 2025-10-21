// screens/RegisterScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { BASE_URL } from '../config/config';
import { showMessage } from 'react-native-flash-message';
import axios from 'axios';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [type, setType] = useState('farmer'); // default type
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    // Name validation
    if (!name) newErrors.name = 'Name is required';
    else if (name.trim().length < 3)
      newErrors.name = 'Name must be at least 3 characters';

    // Email validation
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = 'Enter a valid email';

    // Phone validation
    if (!phone) newErrors.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(phone))
      newErrors.phone = 'Phone number must be 10 digits';

    // Password validation
    if (!password) newErrors.password = 'Password is required';
   
    // Confirm Password validation
    if (!confirmPassword)
      newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    // Type validation
    if (!type) newErrors.type = 'Type is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleRegister = async () => {
  if (!validate()) return;
  setLoading(true);
  console.log(`${BASE_URL}register`)


  try {
    // ✅ Send registration data
    const response = await axios.post(`${BASE_URL}/register`, {
      name,
      email,
      phone,
      password,
      type,
    });


    // ✅ Success response
    showMessage({
      message: response.data.message || 'Registration successful!',
      type: 'success',
      icon: 'success',
      duration: 2500,
    });

    // ✅ Navigate based on role
    if (type === 'farmer') {
      navigation.replace('FarmerHome');
    } else if (type === 'sprayer') {
      navigation.replace('SprayerHome');
    } else {
      navigation.replace('Login');
    }
  } catch (error) {
    console.error('Registration error:', error);

    // Handle backend or network error
    const errorMessage =
      error.response?.data?.message ||
      'Unable to connect to server. Please try again later.';

    showMessage({
      message: errorMessage,
      type: 'danger',
      icon: 'danger',
      duration: 2500,
    });
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Register</Text>
        <Text style={styles.title}>KASHSPRAY</Text>

        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          placeholder="Full Name"
          placeholderTextColor="#888"
          value={name}
          onChangeText={text => {
            setName(text);
            if (errors.name) setErrors({ ...errors, name: null });
          }}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Email"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={text => {
            setEmail(text);
            if (errors.email) setErrors({ ...errors, email: null });
          }}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <TextInput
          style={[styles.input, errors.phone && styles.inputError]}
          placeholder="Phone Number"
          placeholderTextColor="#888"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={text => {
            setPhone(text);
            if (errors.phone) setErrors({ ...errors, phone: null });
          }}
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={password}
          onChangeText={text => {
            setPassword(text);
            if (errors.password) setErrors({ ...errors, password: null });
          }}
        />
        {errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}

        <TextInput
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          placeholder="Confirm Password"
          placeholderTextColor="#888"
          secureTextEntry
          value={confirmPassword}
          onChangeText={text => {
            setConfirmPassword(text);
            if (errors.confirmPassword)
              setErrors({ ...errors, confirmPassword: null });
          }}
        />
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}

        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'farmer' && styles.typeButtonSelected,
            ]}
            onPress={() => setType('farmer')}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === 'farmer' && styles.typeButtonTextSelected,
              ]}
            >
              Farmer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'sprayer' && styles.typeButtonSelected,
            ]}
            onPress={() => setType('sprayer')}
          >
            <Text
              style={[
                styles.typeButtonText,
                type === 'sprayer' && styles.typeButtonTextSelected,
              ]}
            >
              Sprayer
            </Text>
          </TouchableOpacity>
        </View>
        {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2e7d32"
            style={{ marginTop: 20 }}
          />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginTop: 15 }}
        >
          <Text style={{ color: '#2e7d32', fontWeight: '600' }}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f0f8f5',
    paddingVertical: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    alignSelf: 'flex-start',
    color: 'red',
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 13,
  },
  button: {
    width: '100%',
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 12,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: '#2e7d32',
  },
  typeButtonText: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  typeButtonTextSelected: {
    color: '#fff',
  },
});
