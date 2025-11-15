import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import Screens
import LoginScreen from '../screens/Login';
import FarmerHome from '../screens/FarmerHome';
import BuyPlansScreen from '../components/BuyPlans';
import BookSprayScreen from '../components/BookSprayScreen';
import TrackSprayerScreen from '../components/TrackSprayerScreen';
import SprayerHome from '../screens/SprayerHome';
import RegisterScreen from '../screens/RegisterScreen';
import AdminHome from '../screens/AdminHome';




const Stack = createNativeStackNavigator();

export default function AppMainStack() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="FarmerHome"
          component={FarmerHome}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BuyPlansScreen"
          component={BuyPlansScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BookSprayScreen"
          component={BookSprayScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TrackSprayerScreen"
          component={TrackSprayerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SprayerHome"
          component={SprayerHome}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RegisterScreen"
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AdminHome"
          component={AdminHome}
          options={{ headerShown: false }}
        />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}
