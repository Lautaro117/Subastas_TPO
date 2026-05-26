import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, Pressable, Surface, Text, useTheme } from 'react-native-paper';

import { useAppSession } from '../../navigation/AppSessionContext';
import { COLORS } from '../../theme/colors';

export default function HomePerfilScreen({ navigation }) {
  const theme = useTheme();
  const { session, exitApp } = useAppSession();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>Perfil</Text>

        <View style={styles.menuSection}>
          <Pressable onPress={() => navigation.navigate('PaymentMethods', { isOnboarding: false })}>
            {({ pressed }) => (
              <Surface
                style={[
                  styles.menuCard,
                  pressed && { backgroundColor: COLORS.surfaceContainerHigh },
                ]}
                elevation={0}
              >
                <View style={styles.menuIconContainer}>
                  <Icon source="credit-card-outline" size={24} color={COLORS.primary} />
                </View>
                <Text style={[styles.menuCardTitle, { color: theme.colors.onSurface }]}>Medios de pago</Text>
                <Icon source="chevron-right" size={22} color={COLORS.onSurfaceVariant} />
              </Surface>
            )}
          </Pressable>
        </View>

        <Button
          mode="contained-tonal"
          onPress={exitApp}
          style={[styles.logoutButton, { backgroundColor: theme.colors.surfaceContainerLow }]}
          contentStyle={styles.logoutContent}
          labelStyle={[styles.logoutLabel, { color: theme.colors.onSurface }]}
        >
          Cerrar sesion
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    marginBottom: 32,
  },
  menuSection: {
    gap: 12,
    flex: 1,
  },
  menuCard: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
  },
  logoutButton: {
    borderRadius: 999,
  },
  logoutContent: {
    minHeight: 50,
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
});
