import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-paper';

import { HomeProductosScreen, HomeSubastasScreen } from '../screens';
import { HomePerfilStack } from './HomePerfilStack';
import { paperTheme } from '../theme/theme';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="HomeSubastas"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: paperTheme.colors.primary,
        tabBarInactiveTintColor: paperTheme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: paperTheme.colors.surfaceContainerLow,
          borderTopColor: paperTheme.colors.outlineVariant,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveBackgroundColor: paperTheme.colors.primaryContainer,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'circle-outline';

          if (route.name === 'HomeSubastas') {
            iconName = 'currency-usd';
          } else if (route.name === 'HomeProductos') {
            iconName = 'cube-outline';
          } else if (route.name === 'HomePerfil') {
            iconName = 'account-cog-outline';
          }

          return <TabIcon name={iconName} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="HomeSubastas" component={HomeSubastasScreen} options={{ title: 'Subastas' }} />
      <Tab.Screen name="HomeProductos" component={HomeProductosScreen} options={{ title: 'Productos' }} />
      <Tab.Screen name="HomePerfil" component={HomePerfilStack} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

function TabIcon({ name, color, size }) {
  return <Icon source={name} color={color} size={size} />;
}
