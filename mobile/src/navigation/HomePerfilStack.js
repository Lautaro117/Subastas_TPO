import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomePerfilScreen from '../screens/home/HomePerfilScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import AddBankAccountScreen from '../screens/payments/AddBankAccountScreen';
import AddCreditCardScreen from '../screens/payments/AddCreditCardScreen';
import AddCertifiedCheckScreen from '../screens/payments/AddCertifiedCheckScreen';

const Stack = createNativeStackNavigator();

export function HomePerfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="HomePerfil" component={HomePerfilScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="AddBankAccount" component={AddBankAccountScreen} />
      <Stack.Screen name="AddCreditCard" component={AddCreditCardScreen} />
      <Stack.Screen name="AddCertifiedCheck" component={AddCertifiedCheckScreen} />
    </Stack.Navigator>
  );
}
