import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Icon, IconButton, Surface, Text, useTheme } from 'react-native-paper';

import { useAppSession } from '../../navigation/AppSessionContext';
import { useRegisterFlow } from '../../navigation/RegisterFlowContext';
import { getRegisterStatus } from '../../services/authApi';
import { registerSharedStyles } from './sharedStyles';


export default function RegisterVerificationScreen({ navigation }) {
  const theme = useTheme();
  const { enterAsGuestLoginWithPending } = useAppSession();
  const { registerStatus, setRegistrationToken } = useRegisterFlow();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [aprobado, setAprobado] = useState(false);
  console.log('solicitudId:', registerStatus.solicitudId);

  useEffect(() => {
    let isActive = true;
    let intervalId;

    const checkStatus = async () => {
      if (!registerStatus.solicitudId) {
        return;
      }

      setIsCheckingStatus(true);

      try {
        const response = await getRegisterStatus(registerStatus.solicitudId);

        if (!isActive) {
          return;
        }

        setStatusError('');

        if (response?.admitido === 'si') {
          if (response?.tokenRegistro) {
            setRegistrationToken(response.tokenRegistro);
          }
          clearInterval(intervalId);
          setAprobado(true);
        }
      } catch (_error) {
        if (isActive) {
          setStatusError('No pudimos verificar el estado. Reintentando...');
        }
      } finally {
        if (isActive) {
          setIsCheckingStatus(false);
        }
      }
    };

    checkStatus();
    intervalId = setInterval(checkStatus, 30000);

    return () => {
      isActive = false;

      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [registerStatus.solicitudId]);

  return (
    <SafeAreaView style={[registerSharedStyles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={registerSharedStyles.container}>
        <View style={registerSharedStyles.titleRow}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onSurface}
            size={22}
            onPress={() => navigation.goBack()}
          />
        </View>

        <View style={styles.centerContent}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>Validando datos</Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Recibimos tu informacion. Esto puede demorar hasta 24 horas y es parte del proceso de
            revision manual.
          </Text>

          {aprobado ? (
            <Surface
              elevation={0}
              style={[styles.approvalBanner, { backgroundColor: theme.colors.primaryContainer }]}
            >
              <Icon source="check-circle-outline" size={28} color={theme.colors.primary} />
              <View style={styles.approvalText}>
                <Text style={[styles.approvalTitle, { color: theme.colors.onPrimaryContainer }]}>
                  ¡Tu cuenta fue aprobada!
                </Text>
                <Text style={[styles.approvalSub, { color: theme.colors.onPrimaryContainer }]}>
                  Aceptá para finalizar el registro y activar tu cuenta.
                </Text>
              </View>
            </Surface>
          ) : (
            <View style={styles.statusRow}>
              {isCheckingStatus ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
              <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}>
                Verificando estado cada 30 segundos...
              </Text>
            </View>
          )}

          {statusError ? <Text style={[styles.statusError, { color: theme.colors.error }]}>{statusError}</Text> : null}
        </View>

        <View style={styles.bottomArea}>
          {aprobado ? (
            <Button
              mode="contained"
              onPress={() => navigation.replace('RegisterFinalizePassword')}
              style={styles.primaryButton}
              labelStyle={[styles.primaryLabel, { color: theme.colors.onPrimary }]}
              contentStyle={styles.secondaryContent}
            >
              Aceptar y finalizar registro
            </Button>
          ) : (
            <Button
              mode="contained-tonal"
              onPress={async () => { await enterAsGuestLoginWithPending(registerStatus.solicitudId); }}
              style={[styles.secondaryButton, { backgroundColor: theme.colors.surfaceContainerLow }]}
              labelStyle={[styles.secondaryLabel, { color: theme.colors.onSurface }]}
              contentStyle={styles.secondaryContent}
            >
              Continuar como invitado
            </Button>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  statusRow: {
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
  },
  statusError: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  bottomArea: {
    gap: 12,
    paddingBottom: 6,
  },
  secondaryButton: {
    borderRadius: 999,
  },
  secondaryContent: {
    minHeight: 52,
  },
  secondaryLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  primaryButton: {
    borderRadius: 999,
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  approvalBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 16,
    padding: 16,
    marginTop: 28,
    width: '100%',
  },
  approvalText: {
    flex: 1,
    gap: 4,
  },
  approvalTitle: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  approvalSub: {
    fontSize: 14,
    lineHeight: 20,
  },
});
