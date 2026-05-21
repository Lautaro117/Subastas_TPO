import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from 'react-native-paper';

import {
  AuthGhostButton,
  AuthLinkText,
  AuthPrimaryButton,
  AuthTextInput,
} from '../components';

export default function LoginScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <View>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>Bienvenido</Text>

          <View style={styles.inputsSection}>
            <AuthTextInput
              value=""
              onChangeText={() => {}}
              label="Usuario"
              placeholder="Ingresa tu usuario"
              icon="account-outline"
            />

            <View style={styles.inputGap} />

            <AuthTextInput
              value=""
              onChangeText={() => {}}
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              icon="lock-outline"
              secureTextEntry
            />
          </View>

          <View style={styles.primaryButtonGap} />

          <AuthPrimaryButton disabled onPress={() => {}}>
            Iniciar Sesion
          </AuthPrimaryButton>

          <View style={styles.linksGap} />

          <View style={styles.linksSection}>
            <AuthLinkText>Olvide mi contrasena</AuthLinkText>
            <AuthLinkText>Crear cuenta</AuthLinkText>
          </View>
        </View>

        <View style={styles.guestButtonSection}>
          <AuthGhostButton onPress={() => {}}>Continuar como invitado</AuthGhostButton>
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    marginBottom: 40,
    letterSpacing: 0.2,
  },
  inputsSection: {
    width: '100%',
  },
  inputGap: {
    height: 16,
  },
  primaryButtonGap: {
    height: 24,
  },
  linksGap: {
    height: 20,
  },
  linksSection: {
    gap: 10,
  },
  guestButtonSection: {
    marginTop: 72,
  },
});
