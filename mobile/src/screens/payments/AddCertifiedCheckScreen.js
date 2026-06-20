import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Checkbox, HelperText, Icon, IconButton, SegmentedButtons, Surface, Text, useTheme } from 'react-native-paper';
import { AuthPrimaryButton, AuthTextInput } from '../../components';
import { registerSharedStyles } from '../register/sharedStyles';
import { useAppSession } from '../../navigation/AppSessionContext';
import { addCertifiedCheck } from '../../services/paymentApi';
import { COLORS } from '../../theme/colors';

const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export default function AddCertifiedCheckScreen({ navigation, route }) {
  const theme = useTheme();
  const { session, enterApp } = useAppSession();
  const isOnboarding = route?.params?.isOnboarding ?? false;

  const [form, setForm] = useState({
    banco_emisor: '',
    monto: '',
    moneda: 'ARS',
    fecha_emision: '',
    confirmacion_entrega: false,
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

  const formatDate = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
  };

  const errors = useMemo(() => ({
    banco_emisor: !form.banco_emisor.trim() ? 'El banco emisor es requerido' : '',
    monto: !form.monto.trim()
      ? 'El monto es requerido'
      : isNaN(Number(form.monto)) || Number(form.monto) <= 0
        ? 'Ingresá un monto válido mayor a 0'
        : '',
    fecha_emision: !form.fecha_emision.trim()
      ? 'La fecha de emisión es requerida'
      : !DATE_REGEX.test(form.fecha_emision)
        ? 'Formato AAAA-MM-DD'
        : '',
    confirmacion_entrega: !form.confirmacion_entrega
      ? 'Debés confirmar que entregarás el cheque físicamente'
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
      await addCertifiedCheck(
        {
          banco_emisor: form.banco_emisor.trim(),
          monto: Number(form.monto),
          moneda: form.moneda,
          fecha_emision: form.fecha_emision,
          confirmacion_entrega: form.confirmacion_entrega,
        },
        session.token,
      );

      if (isOnboarding) {
        await enterApp('registered');
      } else {
        navigation.goBack();
      }
    } catch (error) {
      setSubmitError(error.message || 'No se pudo registrar el cheque');
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
                Cheque certificado
              </Text>
            </View>

            <Text style={[registerSharedStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              El cheque se usará como garantía. El monto determina el límite de compras acumuladas.
            </Text>

            <Surface style={styles.infoBanner} elevation={0}>
              <Icon source="information-outline" size={22} color={COLORS.primary} />
              <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
                Para acreditar el cheque, debés acercarlo físicamente a la empresa de subastas (Lima 757, CABA). El equipo lo validará y activará tu método de pago.
              </Text>
            </Surface>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={form.banco_emisor}
                onChangeText={(v) => setField('banco_emisor', v)}
                onBlur={() => markTouched('banco_emisor')}
                label="Banco emisor"
                placeholder="Nombre del banco emisor"
                icon="bank-outline"
                error={showError('banco_emisor')}
              />
              <HelperText type="error" visible={showError('banco_emisor')} style={{ color: theme.colors.error }}>
                {errors.banco_emisor}
              </HelperText>
            </View>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={form.monto}
                onChangeText={(v) => setField('monto', v)}
                onBlur={() => markTouched('monto')}
                label="Monto"
                placeholder="Monto certificado"
                icon="currency-usd"
                keyboardType="numeric"
                error={showError('monto')}
              />
              <HelperText type="error" visible={showError('monto')} style={{ color: theme.colors.error }}>
                {errors.monto}
              </HelperText>
            </View>

            <View style={styles.currencyBlock}>
              <Text style={[styles.fieldLabel, { color: theme.colors.onSurfaceVariant }]}>Moneda</Text>
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

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={form.fecha_emision}
                onChangeText={(v) => setField('fecha_emision', formatDate(v))}
                onBlur={() => markTouched('fecha_emision')}
                label="Fecha de emisión"
                placeholder="AAAA-MM-DD"
                icon="calendar-outline"
                keyboardType="numeric"
                error={showError('fecha_emision')}
              />
              <HelperText type="error" visible={showError('fecha_emision')} style={{ color: theme.colors.error }}>
                {errors.fecha_emision}
              </HelperText>
            </View>

            <Surface style={[styles.checkboxCard, showError('confirmacion_entrega') && { borderColor: theme.colors.error }]} elevation={0}>
              <Checkbox.Android
                status={form.confirmacion_entrega ? 'checked' : 'unchecked'}
                onPress={() => { setField('confirmacion_entrega', !form.confirmacion_entrega); markTouched('confirmacion_entrega'); }}
                color={COLORS.primary}
                uncheckedColor={COLORS.onSurfaceVariant}
              />
              <Text
                style={[styles.checkboxText, { color: theme.colors.onSurface }]}
                onPress={() => { setField('confirmacion_entrega', !form.confirmacion_entrega); markTouched('confirmacion_entrega'); }}
              >
                Confirmo que entregaré el cheque físicamente antes del inicio de la subasta.
              </Text>
            </Surface>
            {showError('confirmacion_entrega') ? (
              <Text style={[styles.checkboxError, { color: theme.colors.error }]}>
                {errors.confirmacion_entrega}
              </Text>
            ) : null}

            {submitError ? (
              <Text style={[styles.submitError, { color: theme.colors.error }]}>{submitError}</Text>
            ) : null}

            <View style={registerSharedStyles.bottomRow}>
              <AuthPrimaryButton
                loading={isSubmitting}
                disabled={!isValid || isSubmitting}
                onPress={handleSubmit}
              >
                Agregar cheque
              </AuthPrimaryButton>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  infoBanner: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  inputBlock: {
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  currencyBlock: {
    marginBottom: 14,
    marginTop: 4,
  },
  segmented: {
    borderRadius: 12,
  },
  checkboxCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    marginTop: 8,
    marginBottom: 6,
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  checkboxError: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  submitError: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
});
