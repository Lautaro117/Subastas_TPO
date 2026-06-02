import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeProductosScreen from '../screens/home/HomeProductosScreen';
import AgregarProducto from '../screens/home/AgregarProducto';

const Stack = createNativeStackNavigator();

export function HomeProductosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="HomeProductos" component={HomeProductosScreen} />
      <Stack.Screen name="AgregarProducto" component={AgregarProducto} />
    </Stack.Navigator>
  );
}