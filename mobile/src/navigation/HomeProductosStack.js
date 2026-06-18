import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DetalleProducto from '../screens/home/DetalleProducto';
import DetalleCompra from '../screens/home/DetalleCompra';
import HomeProductosScreen from '../screens/home/HomeProductosScreen';
import AgregarProducto from '../screens/home/AgregarProducto';
import NotificationsScreen from '../screens/home/NotificationsScreen';

const Stack = createNativeStackNavigator();

export function HomeProductosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="HomeProductos" component={HomeProductosScreen} />
      <Stack.Screen name="AgregarProducto" component={AgregarProducto} />
      <Stack.Screen name="DetalleCompra" component={DetalleCompra} />
      <Stack.Screen name="DetalleProducto" component={DetalleProducto} />
      <Stack.Screen name="Notificaciones" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}