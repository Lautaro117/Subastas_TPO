import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HelperText, IconButton, SegmentedButtons, Text, useTheme } from 'react-native-paper';

import { AuthPrimaryButton, AuthTextInput } from '../../components';
import { registerSharedStyles } from '../register/sharedStyles';
import { useAppSession } from '../../navigation/AppSessionContext';
import { addCreditCard } from '../../services/paymentApi';

const EXPIRY_REGEX = /^(0[1-9]|1[0-2])\/\d{2}$/;

export default function AddCreditCardScreen({ navigation, route }) {
  const theme = useTheme();
  const { session, enterApp } = useAppSession();
  const isOnboarding = route?.params?.isOnboarding ?? false;

  const [form, setForm] = useState({
    tipo: 'nacional',
    numero: '',
    vencimiento: '',
    cvv: '',
    titular: '',
    pais_emisor: '',
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSubmitError('');
  };

  const markTouched = (key) => setTouched((prev) => ({ ...prev, [key]: true }));

  const formatExpiry = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  };

  const errors = useMemo(() => ({
    numero: !form.numero.trim()
      ? 'El número de tarjeta es requerido'
      : form.numero.replace(/\s/g, '').length !== 16
        ? 'Debe tener 16 dígitos'
        : '',
    vencimiento: !form.vencimiento.trim()
      ? 'El vencimiento es requerido'
      : !EXPIRY_REGEX.test(form.vencimiento)
        ? 'Formato MM/AA'
        : '',
    cvv: !form.cvv.trim()
      ? 'El CVV es requerido'
      : form.cvv.length < 3 || form.cvv.length > 4
        ? 'CVV inválido'
        : '',
    titular: !form.titular.trim() ? 'El nombre del titular es requerido' : '',
    pais_emisor: !form.pais_emisor.trim() ? 'El país emisor es requerido' : '',
  }), [form]);

  const isValid = Object.values(errors).every((e) => !e);
  const showError = (key) => (touched[key] || submitted) && !!errors[key];

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmitted(true);
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await addCreditCard(
        {
          tipo: form.tipo,
          numero: form.numero.replace(/\s/g, ''),
          vencimiento: form.vencimiento,
          cvv: form.cvv,
          titular: form.titular.trim(),
          pais_emisor: form.pais_emisor.trim(),
        },
        session.token,
      );

      if (isOnboarding) {
        await enterApp('registered');
      } else {
        navigation.goBack();
      }
    } catch (error) {
      setSubmitError(error.message || 'No se pudo registrar la tarjeta');
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
                Tarjeta de crédito
              </Text>
            </View>

            <Text style={[registerSharedStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Registrá tu tarjeta nacional o internacional.
            </Text>

            <View style={styles.inputBlock}>
              <Text style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>Tipo de tarjeta</Text>
              <SegmentedButtons
                value={form.tipo}
                onValueChange={(v) => setField('tipo', v)}
                buttons={[
                  { value: 'nacional', label: 'Nacional' },
                  { value: 'internacional', label: 'Internacional' },
                ]}
                style={styles.segmented}
              />
            </View>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={form.numero}
                onChangeText={(v) => setField('numero', v.replace(/\D/g, '').slice(0, 16))}
                onBlur={() => markTouched('numero')}
                label="Número de tarjeta"
                placeholder="16 dígitos"
                icon="credit-card-outline"
                keyboardType="numeric"
                error={showError('numero')}
              />
              <HelperText type="error" visible={showError('numero')} style={{ color: theme.colors.error }}>
                {errors.numero}
              </HelperText>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputBlock, styles.halfWidth]}>
                <AuthTextInput
                  value={form.vencimiento}
                  onChangeText={(v) => setField('vencimiento', formatExpiry(v))}
                  onBlur={() => markTouched('vencimiento')}
                  label="Vencimiento"
                  placeholder="MM/AA"
                  icon="calendar-outline"
                  keyboardType="numeric"
                  error={showError('vencimiento')}
                />
                <HelperText type="error" visible={showError('vencimiento')} style={{ color: theme.colors.error }}>
                  {errors.vencimiento}
                </HelperText>
              </View>

              <View style={[styles.inputBlock, styles.halfWidth]}>
                <AuthTextInput
                  value={form.cvv}
                  onChangeText={(v) => setField('cvv', v.replace(/\D/g, '').slice(0, 4))}
                  onBlur={() => markTouched('cvv')}
                  label="CVV"
                  placeholder="3-4 dígitos"
                  icon="lock-outline"
                  keyboardType="numeric"
                  secureTextEntry
                  error={showError('cvv')}
                />
                <HelperText type="error" visible={showError('cvv')} style={{ color: theme.colors.error }}>
                  {errors.cvv}
                </HelperText>
              </View>
            </View>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={form.titular}
                onChangeText={(v) => setField('titular', v)}
                onBlur={() => markTouched('titular')}
                label="Titular"
                placeholder="Nombre como figura en la tarjeta"
                icon="account-outline"
                autoCapitalize="characters"
                error={showError('titular')}
              />
              <HelperText type="error" visible={showError('titular')} style={{ color: theme.colors.error }}>
                {errors.titular}
              </HelperText>
            </View>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={form.pais_emisor}
                onChangeText={(v) => setField('pais_emisor', v)}
                onBlur={() => markTouched('pais_emisor')}
                label="País emisor"
                placeholder="Ej: AR, US, ES"
                icon="flag-outline"
                autoCapitalize="characters"
                error={showError('pais_emisor')}
              />
              <HelperText type="error" visible={showError('pais_emisor')} style={{ color: theme.colors.error }}>
                {errors.pais_emisor}
              </HelperText>
            </View>

            {submitError ? (
              <Text style={[styles.submitError, { color: theme.colors.error }]}>{submitError}</Text>
            ) : null}

            <View style={registerSharedStyles.bottomRow}>
              <AuthPrimaryButton
                loading={isSubmitting}
                disabled={!isValid || isSubmitting}
                onPress={handleSubmit}
              >
                Agregar tarjeta
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
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  segmented: {
    borderRadius: 12,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  submitError: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
});
