import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';

import { useAppSession } from '../../navigation/AppSessionContext';

export default function HomePerfilScreen() {
  const theme = useTheme();
  const { session, exitApp } = useAppSession();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>Perfil</Text>

        <View style={styles.placeholder}>
          <IconButton icon="account-cog-outline" iconColor={theme.colors.onSurfaceVariant} size={34} />
          <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>Seccion en preparacion</Text>
          <Text style={[styles.modeText, { color: theme.colors.onSurfaceVariant }]}>
            Modo actual: {session.entryMode || 'sin sesion'}
          </Text>
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
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  modeText: {
    fontSize: 13,
    lineHeight: 18,
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
