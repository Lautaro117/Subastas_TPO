import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from 'react-native-paper';

import {
  AuthGhostButton,
  AuthLinkText,
  AuthPrimaryButton,
  AuthTextInput,
} from '../components';
import { useAppSession } from '../navigation/AppSessionContext';
import { loginRequest } from '../services/authApi';

export default function LoginScreen({ navigation }) {
  const theme = useTheme();
  const { enterApp } = useAppSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validateEmail = (value) => {
    const normalized = value.trim();
    if (!normalized) return 'El email es requerido';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) return 'Ingresa un email valido';
    return '';
  };

  const validatePassword = (value) => {
    if (!value.trim()) return 'La contrasena es requerida';
    return '';
  };

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);

  const shouldShowEmailError = (touched.email || submitted) && !!emailError;
  const shouldShowPasswordError = (touched.password || submitted) && !!passwordError;

  const isFormValid = useMemo(() => !emailError && !passwordError, [emailError, passwordError]);

  const handleEmailChange = (value) => { setEmail(value); setSubmitError(''); };
  const handlePasswordChange = (value) => { setPassword(value); setSubmitError(''); };
  const handleEmailBlur = () => setTouched((prev) => ({ ...prev, email: true }));
  const handlePasswordBlur = () => setTouched((prev) => ({ ...prev, password: true }));

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setSubmitted(true);
    setSubmitError('');

    if (!isFormValid) {
      setTouched({ email: true, password: true });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginRequest({
        email: email.trim().toLowerCase(),
        password,
      });

      // El usuario ingresó su token de registro — debe setear su contraseña
      if (result?.estado === 'PENDING_PASSWORD') {
        navigation.navigate('RegisterFinalizePassword', {
          tokenRegistro: result.token,
          email: email.trim().toLowerCase(),
        });
        return;
      }

      await enterApp('auth', result?.token ?? null);
    } catch (error) {
      setSubmitError(error.message || 'No se pudo iniciar sesion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <View>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>Bienvenido</Text>

          <View style={styles.inputsSection}>
            <AuthTextInput
              value={email}
              onChangeText={handleEmailChange}
              onBlur={handleEmailBlur}
              label="Email"
              placeholder="tucorreo@dominio.com"
              icon="email-outline"
              error={shouldShowEmailError}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
            {shouldShowEmailError ? (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{emailError}</Text>
            ) : null}

            <View style={styles.inputGap} />

            <AuthTextInput
              value={password}
              onChangeText={handlePasswordChange}
              onBlur={handlePasswordBlur}
              label="Contraseña"
              placeholder="Ingresa tu contraseña o token"
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

          {submitError ? (
            <Text style={[styles.submitErrorText, { color: theme.colors.error }]}>{submitError}</Text>
          ) : null}

          <AuthPrimaryButton disabled={!isFormValid || isSubmitting} loading={isSubmitting} onPress={handleSubmit}>
            Iniciar Sesion
          </AuthPrimaryButton>

          <View style={styles.linksGap} />

          <View style={styles.linksSection}>
            <AuthLinkText onPress={() => navigation.navigate('ForgotPasswordEmail')}>Olvide mi contrasena</AuthLinkText>
            <AuthLinkText onPress={() => navigation.navigate('RegisterPersonalData')}>Crear cuenta</AuthLinkText>
          </View>
        </View>

        <View style={styles.guestButtonSection}>
          <AuthGhostButton onPress={async () => { await enterApp('guest-login'); }}>
            Continuar como invitado
          </AuthGhostButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  title: { fontSize: 34, lineHeight: 40, fontWeight: '700', marginBottom: 40, letterSpacing: 0.2 },
  inputsSection: { width: '100%' },
  inputGap: { height: 16 },
  errorText: { fontSize: 12, lineHeight: 16, marginTop: 6, marginBottom: 2 },
  primaryButtonGap: { height: 24 },
  submitErrorText: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  linksGap: { height: 20 },
  linksSection: { gap: 10 },
  guestButtonSection: { marginTop: 72 },
});