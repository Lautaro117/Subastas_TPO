import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';

import { useAppSession } from '../../navigation/AppSessionContext';
import { registerSharedStyles } from './sharedStyles';

export default function RegisterVerificationScreen({ navigation }) {
  const theme = useTheme();
  const { enterApp } = useAppSession();

  return (
    <SafeAreaView style={[registerSharedStyles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={registerSharedStyles.container}>
        <View style={registerSharedStyles.titleRow}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onSurface}
            size={22}
            onPress={() => navigation.goBack()}
          />
        </View>

        <View style={styles.centerContent}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>Validando datos</Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Recibimos tu informacion. Esto puede demorar hasta 24 horas y es parte del proceso de
            revision manual.
          </Text>
        </View>

        <View style={styles.bottomArea}>
          <Button
            mode="contained-tonal"
            onPress={() => enterApp('guest')}
            style={[styles.secondaryButton, { backgroundColor: theme.colors.surfaceContainerLow }]}
            labelStyle={[styles.secondaryLabel, { color: theme.colors.onSurface }]}
            contentStyle={styles.secondaryContent}
          >
            Continuar como invitado
          </Button>

          <Button
            mode="contained"
            onPress={() => navigation.navigate('RegisterFinalizePassword')}
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            labelStyle={[styles.primaryLabel, { color: theme.colors.onPrimary }]}
            contentStyle={styles.primaryContent}
          >
            Seguir
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  bottomArea: {
    gap: 12,
    paddingBottom: 6,
  },
  secondaryButton: {
    borderRadius: 999,
  },
  secondaryContent: {
    minHeight: 52,
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  primaryButton: {
    borderRadius: 999,
  },
  primaryContent: {
    minHeight: 54,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
