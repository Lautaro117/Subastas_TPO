import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HelperText, IconButton, Text, useTheme } from 'react-native-paper';

import { AuthPrimaryButton, AuthTextInput } from '../../components';
import { registerSharedStyles } from '../register/sharedStyles';
import { useAppSession } from '../../navigation/AppSessionContext';
import { updateMyProfile } from '../../services/userApi';
import { COLORS } from '../../theme/colors';

export default function EditProfileScreen({ navigation, route }) {
  const theme = useTheme();
  const { session } = useAppSession();
  const incoming = route?.params?.profile ?? {};

  const [nombre, setNombre] = useState(incoming.nombre ?? '');
  const [apellido, setApellido] = useState(incoming.apellido ?? '');
  const [touched, setTouched] = useState({ nombre: false, apellido: false });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const errors = useMemo(() => ({
    nombre:   !nombre.trim()   ? 'El nombre es requerido'   : '',
    apellido: !apellido.trim() ? 'El apellido es requerido' : '',
  }), [nombre, apellido]);

  const isValid = !errors.nombre && !errors.apellido;
  const showError = (key) => (touched[key] || submitted) && !!errors[key];

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmitted(true);
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await updateMyProfile({ nombre: nombre.trim(), apellido: apellido.trim() }, session.token);
      navigation.goBack();
    } catch (error) {
      setSubmitError(error.message || 'No se pudo actualizar el perfil');
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
                Datos Personales
              </Text>
            </View>

            <Text style={[registerSharedStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Editá tu nombre y apellido. Los demás datos son gestionados por el equipo de verificación.
            </Text>

            {/* Editable fields */}
            <View style={styles.inputBlock}>
              <AuthTextInput
                value={nombre}
                onChangeText={(v) => { setNombre(v); setSubmitError(''); }}
                onBlur={() => setTouched((p) => ({ ...p, nombre: true }))}
                label="Nombre"
                placeholder="Ingresá tu nombre"
                icon="account-outline"
                error={showError('nombre')}
              />
              <HelperText type="error" visible={showError('nombre')} style={{ color: theme.colors.error }}>
                {errors.nombre}
              </HelperText>
            </View>

            <View style={styles.inputBlock}>
              <AuthTextInput
                value={apellido}
                onChangeText={(v) => { setApellido(v); setSubmitError(''); }}
                onBlur={() => setTouched((p) => ({ ...p, apellido: true }))}
                label="Apellido"
                placeholder="Ingresá tu apellido"
                icon="account-outline"
                error={showError('apellido')}
              />
              <HelperText type="error" visible={showError('apellido')} style={{ color: theme.colors.error }}>
                {errors.apellido}
              </HelperText>
            </View>

            {/* Read-only fields */}
            {incoming.email ? (
              <View style={styles.readonlyBlock}>
                <AuthTextInput
                  value={incoming.email}
                  label="Email"
                  icon="email-outline"
                  editable={false}
                />
                <Text style={[styles.readonlyHint, { color: theme.colors.onSurfaceVariant }]}>
                  No editable
                </Text>
              </View>
            ) : null}

            {incoming.categoria ? (
              <View style={styles.readonlyBlock}>
                <AuthTextInput
                  value={incoming.categoria.toUpperCase()}
                  label="Categoría"
                  icon="shield-account-outline"
                  editable={false}
                />
                <Text style={[styles.readonlyHint, { color: theme.colors.onSurfaceVariant }]}>
                  No editable
                </Text>
              </View>
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
                Guardar cambios
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
  readonlyBlock: {
    marginBottom: 10,
    opacity: 0.5,
  },
  readonlyHint: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
    marginLeft: 4,
  },
  submitError: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
});
