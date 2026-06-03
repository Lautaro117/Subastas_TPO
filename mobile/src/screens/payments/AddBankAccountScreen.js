import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HelperText, IconButton, SegmentedButtons, Text, useTheme } from 'react-native-paper';

import { AuthPrimaryButton, AuthTextInput } from '../../components';
import { registerSharedStyles } from '../register/sharedStyles';
import { useAppSession } from '../../navigation/AppSessionContext';
import { addBankAccount } from '../../services/paymentApi';

export default function AddBankAccountScreen({ navigation, route }) {
  const theme = useTheme();
  const { session, enterApp } = useAppSession();
  const isOnboarding = route?.params?.isOnboarding ?? false;

  const [form, setForm] = useState({
    pais_banco: '',
    nombre_banco: '',
    cbu_iban: '',
    titular: '',
    fondos_reservados: '',
    moneda: 'ARS',
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

  const errors = useMemo(() => ({
    pais_banco: !form.pais_banco.trim() ? 'El país del banco es requerido' : '',
    nombre_banco: !form.nombre_banco.trim() ? 'El nombre del banco es requerido' : '',
    cbu_iban: !form.cbu_iban.trim()
      ? 'El CBU o IBAN es requerido'
      : form.cbu_iban.trim().length < 6
        ? 'Formato inválido'
        : '',
    titular: !form.titular.trim() ? 'El nombre del titular es requerido' : '',
    fondos_reservados: !form.fondos_reservados.trim()
      ? 'El monto de fondos reservados es requerido'
      : isNaN(Number(form.fondos_reservados)) || Number(form.fondos_reservados) < 0
        ? 'Ingresá un monto válido'
        : '',
  }), [form]);

  const isValid = Object.values(errors).every((e) => !e);

  const showError = (key) => (touched[key] || submitted) && !!errors[key];

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmitted(true);
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await addBankAccount(
        {
          pais_banco: form.pais_banco.trim(),
          nombre_banco: form.nombre_banco.trim(),
          cbu_iban: form.cbu_iban.trim(),
          titular: form.titular.trim(),
          fondos_reservados: Number(form.fondos_reservados),
          moneda: form.moneda,
        },
        session.token,
      );

      if (isOnboarding) {
        await enterApp('registered');
      } else {
        navigation.goBack();
      }
    } catch (error) {
      setSubmitError(error.message || 'No se pudo registrar la cuenta');
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
                Cuenta bancaria
              </Text>
            </View>

            <Text style={[registerSharedStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Registrá tu cuenta bancaria nacional o internacional.
            </Text>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={form.pais_banco}
                onChangeText={(v) => setField('pais_banco', v)}
                onBlur={() => markTouched('pais_banco')}
                label="País del banco"
                placeholder="Ej: AR, US, ES"
                icon="flag-outline"
                error={showError('pais_banco')}
              />
              <HelperText type="error" visible={showError('pais_banco')} style={{ color: theme.colors.error }}>
                {errors.pais_banco}
              </HelperText>
            </View>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={form.nombre_banco}
                onChangeText={(v) => setField('nombre_banco', v)}
                onBlur={() => markTouched('nombre_banco')}
                label="Nombre del banco"
                placeholder="Ej: Banco Nación"
                icon="bank-outline"
                error={showError('nombre_banco')}
              />
              <HelperText type="error" visible={showError('nombre_banco')} style={{ color: theme.colors.error }}>
                {errors.nombre_banco}
              </HelperText>
            </View>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={form.cbu_iban}
                onChangeText={(v) => setField('cbu_iban', v)}
                onBlur={() => markTouched('cbu_iban')}
                label="CBU / IBAN"
                placeholder="Ingresá tu CBU o IBAN"
                icon="card-account-details-outline"
                keyboardType="default"
                autoCapitalize="none"
                error={showError('cbu_iban')}
              />
              <HelperText type="error" visible={showError('cbu_iban')} style={{ color: theme.colors.error }}>
                {errors.cbu_iban}
              </HelperText>
            </View>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={form.titular}
                onChangeText={(v) => setField('titular', v)}
                onBlur={() => markTouched('titular')}
                label="Titular de la cuenta"
                placeholder="Nombre como figura en el banco"
                icon="account-outline"
                error={showError('titular')}
              />
              <HelperText type="error" visible={showError('titular')} style={{ color: theme.colors.error }}>
                {errors.titular}
              </HelperText>
            </View>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={form.fondos_reservados}
                onChangeText={(v) => setField('fondos_reservados', v)}
                onBlur={() => markTouched('fondos_reservados')}
                label="Fondos reservados"
                placeholder="Monto declarado"
                icon="currency-usd"
                keyboardType="numeric"
                error={showError('fondos_reservados')}
              />
              <HelperText type="error" visible={showError('fondos_reservados')} style={{ color: theme.colors.error }}>
                {errors.fondos_reservados}
              </HelperText>
            </View>

            <View style={styles.currencyBlock}>
              <Text style={[styles.currencyLabel, { color: theme.colors.onSurfaceVariant }]}>Moneda</Text>
              <SegmentedButtons
                value={form.moneda}
                onValueChange={(v) => setField('moneda', v)}
                buttons={[
                  { value: 'ARS', label: 'ARS' },
                  { value: 'USD', label: 'USD' },
                ]}
                style={styles.segmented}
              />
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
                Agregar cuenta
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
  currencyBlock: {
    marginBottom: 20,
    marginTop: 8,
  },
  currencyLabel: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  segmented: {
    borderRadius: 12,
  },
  submitError: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
});
