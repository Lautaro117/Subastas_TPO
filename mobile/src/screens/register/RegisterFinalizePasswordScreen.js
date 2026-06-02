import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, HelperText, IconButton, Text, useTheme } from 'react-native-paper';

import { AuthTextInput } from '../../components';
import { registerSharedStyles } from './sharedStyles';
import { getRegisterStatus, loginRequest, resetPasswordApi } from '../../services/authApi';
import { useRegisterFlow } from '../../navigation/RegisterFlowContext';
import { useAppSession } from '../../navigation/AppSessionContext';

export default function RegisterFinalizePasswordScreen({ navigation }) {
  const theme = useTheme();
  const { registerStatus, registerForm } = useRegisterFlow();
  const { session, setAuthToken, completeRegistrationFromGuest, pendingRegistration } = useAppSession();

  const isFinalizing = session.entryMode === 'finalizing';

  // Resolve the registration token from all possible sources in priority order:
  //  1. pendingRegistration.registroToken  — set by AppSessionContext polling when approved
  //  2. registerStatus.token              — set by RegisterVerificationScreen (Path 1, normal flow)
  //  3. fetchedToken                      — lazy-fetched below when both above are null
  const resolvedToken = pendingRegistration.registroToken ?? registerStatus.token ?? null;

  const [fetchedToken, setFetchedToken] = useState(null);
  const [fetchingToken, setFetchingToken] = useState(false);
  const [tokenFetchError, setTokenFetchError] = useState('');

  // Lazy-fetch the token when neither in-memory source has it but we know the solicitudId.
  // This covers: app restarted, navigated to RegisterFinalizePassword with stale context.
  const solicitudId = pendingRegistration.solicitudId;
  const registroToken = resolvedToken ?? fetchedToken;

  useEffect(() => {
    if (registroToken) return;     // already have it
    if (!solicitudId) return;      // no way to fetch

    let cancelled = false;
    setFetchingToken(true);
    setTokenFetchError('');

    getRegisterStatus(solicitudId)
      .then((response) => {
        if (cancelled) return;
        if (response?.tokenRegistro) {
          setFetchedToken(response.tokenRegistro);
        } else {
          setTokenFetchError('No se pudo obtener el token de registro. Contactá a soporte.');
        }
      })
      .catch(() => {
        if (!cancelled) setTokenFetchError('Error de red al obtener el token. Intentá de nuevo.');
      })
      .finally(() => {
        if (!cancelled) setFetchingToken(false);
      });

    return () => { cancelled = true; };
  }, [registroToken, solicitudId]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const passwordStrength = useMemo(() => {
    const trimmed = password.trim();

    if (!trimmed) return '';
    if (trimmed.length < 8) return 'Baja';
    if (trimmed.length < 12) return 'Media';
    return 'Alta';
  }, [password]);

  const passwordError = useMemo(() => {
    if (!password.trim()) {
      return 'La contrasena es requerida';
    }

    if (password.trim().length < 8) {
      return 'Minimo 8 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
    return 'Debe tener al menos una mayuscula';
  }
  if (!/[0-9]/.test(password)) {
    return 'Debe tener al menos un numero';
  }

    return '';
  }, [password]);

  const confirmError = useMemo(() => {
    if (!confirmPassword.trim()) {
      return 'Confirma tu contrasena';
    }

    if (password !== confirmPassword) {
      return 'Las contrasenas no coinciden';
    }

    return '';
  }, [password, confirmPassword]);

  const isValid = !passwordError && !confirmError;

  const showPasswordError = (touched.password || submitted) && !!passwordError;
  const showConfirmError = (touched.confirmPassword || submitted) && !!confirmError;

  const handleFinish = async () => {
    setSubmitted(true);

    if (!isValid || !registroToken) return;

    setSubmitting(true);
    try {
      await resetPasswordApi({ token: registroToken, password });

      try {
        const loginResult = await loginRequest({ email: registerForm.email, password });
        if (loginResult?.token) {
          if (isFinalizing) {
            completeRegistrationFromGuest(loginResult.token);
            // completeRegistrationFromGuest flips isAuthenticated → MainTabs remounts automatically
            return;
          }
          setAuthToken(loginResult.token);
        }
      } catch (_loginError) {
        // auto-login fallido: el usuario podrá hacer login manual después
      }

      if (!isFinalizing) {
        navigation.navigate('RegisterEntering');
      }
    } catch (error) {
      // error al establecer contraseña — silent por ahora, la navegación no avanza
    } finally {
      setSubmitting(false);
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
              <Text style={[registerSharedStyles.title, { color: theme.colors.onBackground }]}>Finalizar</Text>
            </View>

            <Text style={[registerSharedStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}> 
              Ultimo paso para activar tu cuenta y continuar a la app.
            </Text>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={password}
                onChangeText={setPassword}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                label="Contrasena"
                placeholder="Ingresa tu contrasena"
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
                onChangeText={setConfirmPassword}
                onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                label="Confirmar contrasena"
                placeholder="Repite tu contrasena"
                icon="lock-outline"
                secureTextEntry
                error={showConfirmError}
              />
              <HelperText type="error" visible={showConfirmError} style={{ color: theme.colors.error }}>
                {confirmError}
              </HelperText>
            </View>

            {passwordStrength ? (
              <Text style={[styles.strength, { color: theme.colors.onSurfaceVariant }]}>
                Fortaleza: {passwordStrength}
              </Text>
            ) : null}

            {tokenFetchError ? (
              <Text style={[styles.tokenError, { color: theme.colors.error }]}>{tokenFetchError}</Text>
            ) : null}

            <View style={styles.bottomAction}>
              {fetchingToken ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={styles.tokenLoader} />
              ) : (
                <Button
                  mode="contained"
                  compact
                  onPress={handleFinish}
                  loading={submitting}
                  disabled={!isValid || !registroToken || submitting}
                  style={[styles.finishButton, { backgroundColor: theme.colors.primary }]}
                  contentStyle={styles.finishContent}
                  labelStyle={[styles.finishLabel, { color: theme.colors.onPrimary }]}
                >
                  Finalizar
                </Button>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputBlock: {
    marginBottom: 14,
  },
  strength: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  tokenError: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  tokenLoader: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  bottomAction: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 24,
  },
  finishButton: {
    borderRadius: 999,
  },
  finishContent: {
    height: 48,
    paddingHorizontal: 20,
  },
  finishLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
