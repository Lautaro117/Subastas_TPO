import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomePerfilScreen from '../screens/home/HomePerfilScreen';
import EditProfileScreen from '../screens/home/EditProfileScreen';
import PlaceholderScreen from '../screens/home/PlaceholderScreen';
import NotificationsScreen from '../screens/home/NotificationsScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import AddBankAccountScreen from '../screens/payments/AddBankAccountScreen';
import AddCreditCardScreen from '../screens/payments/AddCreditCardScreen';
import AddCertifiedCheckScreen from '../screens/payments/AddCertifiedCheckScreen';
import PaymentMethodDetalle from '../screens/payments/PaymentMethodDetalle';
import PenalizacionesScreen from '../screens/home/PenalizacionesScreen';
import AuctionHistoryScreen from '../screens/home/AuctionHistoryScreen';
import DetalleCompra from '../screens/home/DetalleCompra';


const Stack = createNativeStackNavigator();

export function HomePerfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="HomePerfil" component={HomePerfilScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="AddBankAccount" component={AddBankAccountScreen} />
      <Stack.Screen name="AddCreditCard" component={AddCreditCardScreen} />
      <Stack.Screen name="AddCertifiedCheck" component={AddCertifiedCheckScreen} />
      <Stack.Screen name="PaymentMethodDetalle" component={PaymentMethodDetalle} />
      <Stack.Screen name="AuctionHistory" component={AuctionHistoryScreen} />
      <Stack.Screen name="DetalleCompra" component={DetalleCompra} />
      <Stack.Screen name="Penalizaciones" component={PenalizacionesScreen} />      
      <Stack.Screen name="Notificaciones" component={NotificationsScreen} />
      <Stack.Screen name="Apariencia" component={PlaceholderScreen} />
    </Stack.Navigator>
  );
}
