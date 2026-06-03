import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, IconButton, Text, useTheme } from 'react-native-paper';

import { useAppSession } from '../../navigation/AppSessionContext';
import { useRegisterFlow } from '../../navigation/RegisterFlowContext';
import { getRegisterStatus } from '../../services/authApi';
import { registerSharedStyles } from './sharedStyles';


export default function RegisterVerificationScreen({ navigation }) {
  const theme = useTheme();
  const { enterApp } = useAppSession();
  const { registerStatus, setRegistrationToken } = useRegisterFlow();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
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
          navigation.replace('RegisterFinalizePassword');
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
  }, [navigation, registerStatus.solicitudId]);

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

          <View style={styles.statusRow}>
            {isCheckingStatus ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
            <Text style={[styles.statusText, { color: theme.colors.onSurfaceVariant }]}> 
              Verificando estado cada 30 segundos...
            </Text>
          </View>

          {statusError ? <Text style={[styles.statusError, { color: theme.colors.error }]}>{statusError}</Text> : null}
        </View>

        <View style={styles.bottomArea}>
          <Button
            mode="contained-tonal"
            onPress={async () => { await enterApp('guest-login'); }}
            style={[styles.secondaryButton, { backgroundColor: theme.colors.surfaceContainerLow }]}
            labelStyle={[styles.secondaryLabel, { color: theme.colors.onSurface }]}
            contentStyle={styles.secondaryContent}
          >
            Continuar como invitado
          </Button>
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
});
