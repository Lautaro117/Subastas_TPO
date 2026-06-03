import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeSubastasScreen from '../screens/home/HomeSubastasScreen';
import SalaSubastaScreen from '../screens/home/SalaSubastaScreen';
import CatalogoExtendidoScreen from '../screens/home/CatalogoExtendidoScreen';
import DetalleProductoSubastaScreen from '../screens/home/DetalleProductoSubastaScreen';

const Stack = createNativeStackNavigator();

export function HomeSubastasStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeSubastasMain" component={HomeSubastasScreen} />
      <Stack.Screen name="SalaSubasta" component={SalaSubastaScreen} />
      <Stack.Screen name="CatalogoExtendido" component={CatalogoExtendidoScreen} />
      <Stack.Screen name="DetalleProductoSubasta" component={DetalleProductoSubastaScreen} />
    </Stack.Navigator>
  );
}