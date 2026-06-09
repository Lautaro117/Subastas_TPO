import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, HelperText, IconButton, Text, useTheme } from 'react-native-paper';

import { AuthTextInput } from '../../components';
import { registerSharedStyles } from './sharedStyles';
import { loginRequest, resetPasswordApi } from '../../services/authApi';
import { useRegisterFlow } from '../../navigation/RegisterFlowContext';
import { useAppSession } from '../../navigation/AppSessionContext';

export default function RegisterFinalizePasswordScreen({ navigation, route }) {
  const theme = useTheme();
  const { registerForm } = useRegisterFlow();
  const { setAuthToken, enterApp } = useAppSession();

  // Token y email pueden venir como params (desde LoginScreen)
  // o el token puede venir del contexto (flujo legacy)
  const tokenParam = route?.params?.tokenRegistro ?? null;
  const emailParam = route?.params?.email ?? registerForm.email ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const passwordStrength = useMemo(() => {
    const trimmed = password.trim();
    if (!trimmed) return '';
    if (trimmed.length < 8) return 'Baja';
    if (trimmed.length < 12) return 'Media';
    return 'Alta';
  }, [password]);

  const strengthColor = useMemo(() => {
    if (passwordStrength === 'Baja') return theme.colors.error;
    if (passwordStrength === 'Media') return '#F4B942';
    return '#4CAF50';
  }, [passwordStrength, theme.colors.error]);

  const passwordError = useMemo(() => {
    if (!password.trim()) return 'La contraseña es requerida';
    if (password.trim().length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(password)) return 'Debe tener al menos una mayúscula';
    if (!/[0-9]/.test(password)) return 'Debe tener al menos un número';
    return '';
  }, [password]);

  const confirmError = useMemo(() => {
    if (!confirmPassword.trim()) return 'Confirmá tu contraseña';
    if (password !== confirmPassword) return 'Las contraseñas no coinciden';
    return '';
  }, [password, confirmPassword]);

  const isValid = !passwordError && !confirmError;
  const showPasswordError = (touched.password || submitted) && !!passwordError;
  const showConfirmError = (touched.confirmPassword || submitted) && !!confirmError;

  const handleFinish = async () => {
    setSubmitted(true);
    setSubmitError('');

    if (!isValid || !tokenParam) return;

    setIsSubmitting(true);
    try {
      await resetPasswordApi({ token: tokenParam, password });

      // Auto-login después de setear la contraseña
      try {
        const loginResult = await loginRequest({ email: emailParam, password });
        if (loginResult?.token) {
          await enterApp('auth', loginResult.token);
          navigation.navigate('RegisterEntering');
          return;
        }
      } catch {
        // Auto-login fallido — ir al login manual
        navigation.replace('Login');
        return;
      }

      navigation.navigate('RegisterEntering');
    } catch (error) {
      setSubmitError(error.message || 'Token inválido o expirado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[registerSharedStyles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={registerSharedStyles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={registerSharedStyles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={registerSharedStyles.container}>
            <View style={registerSharedStyles.titleRow}>
              <IconButton
                icon="arrow-left"
                iconColor={theme.colors.onSurface}
                size={22}
                onPress={() => navigation.goBack()}
              />
              <Text style={[registerSharedStyles.title, { color: theme.colors.onBackground }]}>
                Finalizar
              </Text>
            </View>

            <Text style={[registerSharedStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Último paso para activar tu cuenta. Elegí una contraseña segura.
            </Text>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={password}
                onChangeText={(v) => { setPassword(v); setSubmitError(''); }}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                label="Contraseña"
                placeholder="Ingresá tu contraseña"
                icon="lock-outline"
                secureTextEntry
                error={showPasswordError}
              />
              <HelperText type="error" visible={showPasswordError} style={{ color: theme.colors.error }}>
                {passwordError}
              </HelperText>
            </View>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); setSubmitError(''); }}
                onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                label="Confirmar contraseña"
                placeholder="Repetí tu contraseña"
                icon="lock-outline"
                secureTextEntry
                error={showConfirmError}
              />
              <HelperText type="error" visible={showConfirmError} style={{ color: theme.colors.error }}>
                {confirmError}
              </HelperText>
            </View>

            {passwordStrength ? (
              <Text style={[styles.strength, { color: strengthColor }]}>
                Fortaleza: {passwordStrength}
              </Text>
            ) : null}

            {submitError ? (
              <Text style={[styles.submitError, { color: theme.colors.error }]}>
                {submitError}
              </Text>
            ) : null}

            <View style={styles.bottomAction}>
              <Button
                mode="contained"
                compact
                onPress={handleFinish}
                loading={isSubmitting}
                disabled={!isValid || !tokenParam || isSubmitting}
                style={[styles.finishButton, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.finishContent}
                labelStyle={[styles.finishLabel, { color: theme.colors.onPrimary }]}
              >
                Finalizar
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputBlock: { marginBottom: 14 },
  strength: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
  submitError: { fontSize: 13, lineHeight: 18, marginBottom: 10 },
  bottomAction: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 24,
  },
  finishButton: { borderRadius: 999 },
  finishContent: { height: 48, paddingHorizontal: 20 },
  finishLabel: { fontSize: 16, fontWeight: '600' },
});