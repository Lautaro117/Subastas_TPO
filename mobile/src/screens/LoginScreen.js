import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Snackbar, Text, useTheme } from 'react-native-paper';

import {
  AuthGhostButton,
  AuthLinkText,
  AuthPrimaryButton,
  AuthTextInput,
} from '../components';

export default function LoginScreen({ navigation }) {
  const theme = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ username: false, password: false });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  const validateUsername = (value) => {
    const normalized = value.trim();

    if (!normalized) {
      return 'El usuario es requerido';
    }

    if (normalized.length > 20) {
      return 'El usuario no puede superar los 20 caracteres';
    }

    return '';
  };

  const validatePassword = (value) => {
    if (!value.trim()) {
      return 'La contrasena es requerida';
    }

    return '';
  };

  const usernameError = validateUsername(username);
  const passwordError = validatePassword(password);

  const shouldShowUsernameError = (touched.username || submitted) && !!usernameError;
  const shouldShowPasswordError = (touched.password || submitted) && !!passwordError;

  const isFormValid = useMemo(() => !usernameError && !passwordError, [usernameError, passwordError]);

  const handleUsernameChange = (value) => {
    setUsername(value);
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
  };

  const handleUsernameBlur = () => {
    setTouched((prev) => ({ ...prev, username: true }));
  };

  const handlePasswordBlur = () => {
    setTouched((prev) => ({ ...prev, password: true }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    setSubmitted(true);

    if (!isFormValid) {
      setTouched({ username: true, password: true });
      return;
    }

    setIsSubmitting(true);

    await new Promise((resolve) => {
      setTimeout(resolve, 1200);
    });

    setIsSubmitting(false);
    setShowSuccessSnackbar(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <View>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>Bienvenido</Text>

          <View style={styles.inputsSection}>
            <AuthTextInput
              value={username}
              onChangeText={handleUsernameChange}
              onBlur={handleUsernameBlur}
              label="Usuario"
              placeholder="Ingresa tu usuario"
              icon="account-outline"
              error={shouldShowUsernameError}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            {shouldShowUsernameError ? (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{usernameError}</Text>
            ) : null}

            <View style={styles.inputGap} />

            <AuthTextInput
              value={password}
              onChangeText={handlePasswordChange}
              onBlur={handlePasswordBlur}
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              icon="lock-outline"
              secureTextEntry
              error={shouldShowPasswordError}
              returnKeyType="done"
            />

            {shouldShowPasswordError ? (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{passwordError}</Text>
            ) : null}
          </View>

          <View style={styles.primaryButtonGap} />

          <AuthPrimaryButton disabled={!isFormValid || isSubmitting} loading={isSubmitting} onPress={handleSubmit}>
            Iniciar Sesion
          </AuthPrimaryButton>

          <View style={styles.linksGap} />

          <View style={styles.linksSection}>
            <AuthLinkText>Olvide mi contrasena</AuthLinkText>
            <AuthLinkText onPress={() => navigation.navigate('RegisterPersonalData')}>
              Crear cuenta
            </AuthLinkText>
          </View>
        </View>

        <View style={styles.guestButtonSection}>
          <AuthGhostButton onPress={() => {}}>Continuar como invitado</AuthGhostButton>
        </View>
      </View>

      <Snackbar
        visible={showSuccessSnackbar}
        onDismiss={() => setShowSuccessSnackbar(false)}
        duration={2200}
        style={{ backgroundColor: theme.colors.surfaceContainerHigh }}
      >
        Inicio de sesion simulado con exito
      </Snackbar>
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
  errorText: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
    marginBottom: 2,
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
