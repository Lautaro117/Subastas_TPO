import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HelperText, IconButton, Text, useTheme } from 'react-native-paper';

import { AuthPrimaryButton, AuthTextInput } from '../components';
import { registerSharedStyles } from './register/sharedStyles';
import { resetRequestApi } from '../services/authApi';

export default function ForgotPasswordEmailScreen({ navigation }) {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const emailError = useMemo(() => {
    const normalized = email.trim();
    if (!normalized) return 'El email es requerido';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) return 'Ingresa un email válido';
    return '';
  }, [email]);

  const showEmailError = (touched || submitted) && !!emailError;
  const isFormValid = !emailError;

  const handleEmailChange = (value) => {
    setEmail(value);
    setSubmitError('');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmitted(true);
    setSubmitError('');

    if (!isFormValid) {
      setTouched(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await resetRequestApi({ email: email.trim().toLowerCase() });

      if (!token) {
        setSubmitError('El email no está registrado');
        return;
      }

      navigation.navigate('ForgotPasswordNewPassword', { token });
    } catch (error) {
      setSubmitError(error.message || 'No se pudo procesar la solicitud');
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
                Recuperar contraseña
              </Text>
            </View>

            <Text style={[registerSharedStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Ingresá el email asociado a tu cuenta. Te enviaremos las instrucciones para restablecer tu contraseña.
            </Text>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={email}
                onChangeText={handleEmailChange}
                onBlur={() => setTouched(true)}
                label="Email"
                placeholder="tucorreo@dominio.com"
                icon="email-outline"
                error={showEmailError}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <HelperText type="error" visible={showEmailError} style={{ color: theme.colors.error }}>
                {emailError}
              </HelperText>
            </View>

            {submitError ? (
              <Text style={[styles.submitError, { color: theme.colors.error }]}>{submitError}</Text>
            ) : null}

            <View style={registerSharedStyles.bottomRow}>
              <AuthPrimaryButton
                loading={isSubmitting}
                disabled={!isFormValid || isSubmitting}
                onPress={handleSubmit}
              >
                Enviar
              </AuthPrimaryButton>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  inputBlock: {
    marginBottom: 8,
  },
  submitError: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
});
