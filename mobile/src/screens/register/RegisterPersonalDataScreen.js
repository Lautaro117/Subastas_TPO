import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, HelperText, IconButton, Menu, Text, useTheme } from 'react-native-paper';

import { AuthTextInput } from '../../components';
import { useRegisterFlow } from '../../navigation/RegisterFlowContext';
import { registerSharedStyles } from './sharedStyles';

const fieldConfig = [
  { key: 'firstName', label: 'Nombre', placeholder: 'Ingresa tu nombre', icon: 'account-outline' },
  { key: 'lastName', label: 'Apellido', placeholder: 'Ingresa tu apellido', icon: 'account-outline' },
  { key: 'username', label: 'Usuario', placeholder: 'Crea tu usuario', icon: 'at' },
  { key: 'email', label: 'Email', placeholder: 'tucorreo@dominio.com', icon: 'email-outline', keyboardType: 'email-address' },
  { key: 'address', label: 'Domicilio', placeholder: 'Ingresa tu domicilio', icon: 'map-marker-outline' },
];

const COUNTRY_OPTIONS = [
  { label: 'Argentina (+54)', code: 54, country: 'Argentina' },
  { label: 'Uruguay (+598)', code: 598, country: 'Uruguay' },
  { label: 'Chile (+56)', code: 56, country: 'Chile' },
  { label: 'Brasil (+55)', code: 55, country: 'Brasil' },
];

export default function RegisterPersonalDataScreen({ navigation }) {
  const theme = useTheme();
  const { registerForm, updateRegisterForm } = useRegisterFlow();
  const [formValues, setFormValues] = useState(registerForm);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [countryMenuVisible, setCountryMenuVisible] = useState(false);

  const validateField = (key, value) => {
    if (key === 'countryCode') {
      if (!Number.isInteger(value)) {
        return 'Selecciona un pais valido';
      }

      return '';
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return 'Este campo es obligatorio';
    }

    if (key === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(trimmed)) {
        return 'Ingresa un email valido';
      }
    }

    if (key === 'username' && trimmed.length > 20) {
      return 'Maximo 20 caracteres';
    }

    return '';
  };

  const errors = useMemo(() => {
    const mapped = fieldConfig.reduce((acc, field) => {
      acc[field.key] = validateField(field.key, formValues[field.key]);
      return acc;
    }, {});

    mapped.countryCode = validateField('countryCode', formValues.countryCode);
    return mapped;
  }, [formValues]);

  const isFormValid = useMemo(() => Object.values(errors).every((error) => !error), [errors]);

  const handleChange = (key, value) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleBlur = (key) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const handleCountrySelect = (option) => {
    setFormValues((prev) => ({
      ...prev,
      country: option.country,
      countryCode: option.code,
    }));

    setTouched((prev) => ({ ...prev, countryCode: true }));
    setCountryMenuVisible(false);
  };

  const handleNext = () => {
    setSubmitted(true);

    if (!isFormValid) {
      const allTouched = fieldConfig.reduce((acc, field) => {
        acc[field.key] = true;
        return acc;
      }, {});

      setTouched(allTouched);
      return;
    }

    updateRegisterForm(formValues);
    navigation.navigate('RegisterDniUpload');
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
              <Text style={[registerSharedStyles.title, { color: theme.colors.onBackground }]}>Registro</Text>
            </View>

            <Text style={[registerSharedStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}> 
              Completa tus datos personales para continuar con el onboarding.
            </Text>

            {fieldConfig.map((field) => {
              const shouldShowError = (touched[field.key] || submitted) && !!errors[field.key];

              return (
                <View key={field.key} style={styles.inputBlock}>
                  <AuthTextInput
                    value={formValues[field.key]}
                    onChangeText={(value) => handleChange(field.key, value)}
                    onBlur={() => handleBlur(field.key)}
                    label={field.label}
                    placeholder={field.placeholder}
                    icon={field.icon}
                    error={shouldShowError}
                    autoCapitalize={field.key === 'email' || field.key === 'username' ? 'none' : 'words'}
                    autoCorrect={false}
                    keyboardType={field.keyboardType}
                  />
                  {shouldShowError ? (
                    <HelperText type="error" visible style={[styles.helperText, { color: theme.colors.error }]}>
                      {errors[field.key]}
                    </HelperText>
                  ) : null}
                </View>
              );
            })}

            <View style={styles.inputBlock}>
              <Menu
                visible={countryMenuVisible}
                onDismiss={() => setCountryMenuVisible(false)}
                anchor={
                  <Button
                    mode="contained-tonal"
                    onPress={() => setCountryMenuVisible(true)}
                    style={[styles.countryButton, { backgroundColor: theme.colors.surfaceContainerLow }]}
                    contentStyle={styles.countryButtonContent}
                    labelStyle={[styles.countryButtonLabel, { color: theme.colors.onSurface }]}
                    icon="earth"
                  >
                    {formValues.countryCode
                      ? `${formValues.country} (+${formValues.countryCode})`
                      : 'Selecciona pais de origen'}
                  </Button>
                }
              >
                {COUNTRY_OPTIONS.map((option) => (
                  <Menu.Item
                    key={option.code}
                    onPress={() => handleCountrySelect(option)}
                    title={option.label}
                  />
                ))}
              </Menu>

              {(touched.countryCode || submitted) && errors.countryCode ? (
                <HelperText type="error" visible style={[styles.helperText, { color: theme.colors.error }]}>
                  {errors.countryCode}
                </HelperText>
              ) : null}
            </View>

            <View style={styles.nextAction}>
              <Button
                mode="contained"
                compact
                onPress={handleNext}
                disabled={!isFormValid}
                style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.nextButtonContent}
                labelStyle={[styles.nextButtonLabel, { color: theme.colors.onPrimary }]}
              >
                Siguiente
              </Button>
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
  helperText: {
    marginTop: 2,
    marginBottom: 0,
    marginLeft: 0,
  },
  countryButton: {
    borderRadius: 12,
  },
  countryButtonContent: {
    height: 56,
    justifyContent: 'center',
  },
  countryButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
  },
  nextAction: {
    marginTop: 'auto',
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  nextButton: {
    borderRadius: 999,
  },
  nextButtonContent: {
    height: 48,
    paddingHorizontal: 18,
  },
  nextButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
