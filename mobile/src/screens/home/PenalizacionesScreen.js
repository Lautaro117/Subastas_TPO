import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  Dialog,
  Icon,
  Portal,
  Snackbar,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';

import { useAppSession } from '../../navigation/AppSessionContext';
import { getMultaActiva, pagarMulta } from '../../services/multasApi';
import { getPaymentMethods } from '../../services/paymentApi';

const ESTADO_CONFIG = {
  pendiente: { label: 'Pendiente', color: '#FF6B6B' },
  en_proceso: { label: 'En proceso', color: '#FFA726' },
  pagada: { label: 'Pagada', color: '#4CAF50' },
};

export default function PenalizacionesScreen({ navigation }) {
  const theme = useTheme();
  const { session } = useAppSession();
  const token = session.token;

  const [multa, setMulta] = useState(undefined); // undefined = cargando, null = sin multa
  const [isLoading, setIsLoading] = useState(true);
  const [mediosPago, setMediosPago] = useState([]);
  const [modalPagar, setModalPagar] = useState(false);
  const [medioPagoSeleccionado, setMedioPagoSeleccionado] = useState(null);
  const [pagando, setPagando] = useState(false);
  const [snackbar, setSnackbar] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [multaData, medios] = await Promise.all([
        getMultaActiva(token),
        getPaymentMethods(token).catch(() => []),
      ]);
      setMulta(multaData); // null si no hay multa
      const verificados = Array.isArray(medios)
        ? medios.filter((m) => m.verificado === true || m.verificado === 'true')
        : [];
      setMediosPago(verificados);
      if (verificados.length > 0) setMedioPagoSeleccionado(verificados[0].id);
    } catch {
      setSnackbar('No se pudieron cargar las penalizaciones.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePagar = async () => {
    if (!multa || !medioPagoSeleccionado) return;
    setPagando(true);
    try {
      await pagarMulta(token, multa.id);
      setModalPagar(false);
      setSnackbar('Multa pagada correctamente.');
      fetchData(); // recargar estado
    } catch (err) {
      setModalPagar(false);
      setSnackbar(err.message ?? 'Error al pagar la multa.');
    } finally {
      setPagando(false);
    }
  };

  const estadoConfig = multa
    ? ESTADO_CONFIG[multa.estado] || { label: multa.estado, color: theme.colors.onSurfaceVariant }
    : null;

  const fechaFormateada = multa?.createdAt
    ? new Date(multa.createdAt).toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : null;

    if (isLoading || multa === undefined) {
      return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
          <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
            <Appbar.BackAction onPress={() => navigation.goBack()} />
            <Appbar.Content title="Penalizaciones" />
          </Appbar.Header>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        </SafeAreaView>
      );
    }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Penalizaciones" />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : multa === null ? (
        // Sin multas activas
        <View style={styles.centered}>
          <Icon source="check-circle-outline" size={56} color={theme.colors.primary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            Sin penalizaciones
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.colors.onSurfaceVariant }]}>
            No tenés multas pendientes en este momento.
          </Text>
        </View>
      ) : (
        // Multa activa
        <View style={styles.content}>
          <Surface
            elevation={0}
            style={[
              styles.multaCard,
              {
                backgroundColor: theme.colors.surfaceContainerLowest,
                borderColor: multa?.estado === 'pendiente' ? '#FF6B6B' : theme.colors.outline,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                Multa activa
              </Text>
              <Chip
                compact
                style={[styles.estadoChip, { backgroundColor: estadoConfig.color + '22' }]}
                textStyle={[styles.estadoChipText, { color: estadoConfig.color }]}
              >
                {estadoConfig.label}
              </Chip>
            </View>

            {/* Motivo */}
            <Text style={[styles.motivo, { color: theme.colors.onSurfaceVariant }]}>
              {multa.motivo}
            </Text>

            {/* Importe */}
            <Text style={[styles.importe, { color: theme.colors.onSurface }]}>
              $ {multa.importe?.toLocaleString('es-AR')}
            </Text>

            {/* Fecha */}
            {fechaFormateada && (
              <Text style={[styles.fecha, { color: theme.colors.onSurfaceVariant }]}>
                Registrada el {fechaFormateada}
              </Text>
            )}

            {/* Advertencia */}
            {multa.estado === 'pendiente' && (
              <Surface
                elevation={0}
                style={[styles.advertencia, { backgroundColor: '#FF6B6B22', borderColor: '#FF6B6B' }]}
              >
                <Text style={[styles.advertenciaText, { color: '#FF6B6B' }]}>
                  ⚠️ Tenés una multa pendiente. Hasta que no la pagues no podrás participar en nuevas subastas.
                </Text>
              </Surface>
            )}
          </Surface>

          {/* Botón pagar */}
          {multa.estado === 'pendiente' && (
            <Button
              mode="contained"
              onPress={() => setModalPagar(true)}
              disabled={mediosPago.length === 0}
              style={styles.pagarButton}
              contentStyle={styles.pagarButtonContent}
            >
              {mediosPago.length === 0 ? 'Necesitás un medio de pago verificado' : 'Pagar multa'}
            </Button>
          )}

          {mediosPago.length === 0 && multa.estado === 'pendiente' && (
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('HomePerfil', { screen: 'PaymentMethods' })}
              style={styles.agregarMedioButton}
            >
              Agregar medio de pago
            </Button>
          )}
        </View>
      )}

      {/* Modal confirmar pago */}
      <Portal>
        <Dialog
          visible={modalPagar}
          onDismiss={() => setModalPagar(false)}
          style={{ backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: 24 }}
        >
          <Dialog.Icon icon="credit-card-outline" color={theme.colors.primary} />
          <Dialog.Title style={{ textAlign: 'center', color: theme.colors.onSurface }}>
            Pagar multa
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              ¿Confirmás el pago de ${multa?.importe?.toLocaleString('es-AR')} con tu medio de pago verificado?
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center', gap: 16 }}>
            <Button
              onPress={() => setModalPagar(false)}
              textColor={theme.colors.onSurfaceVariant}
            >
              Cancelar
            </Button>
            <Button
              onPress={handlePagar}
              loading={pagando}
              disabled={pagando}
              textColor={theme.colors.primary}
            >
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 16,
  },

  emptyTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyDesc: { fontSize: 14, lineHeight: 21, textAlign: 'center' },

  multaCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  estadoChip: { borderRadius: 999 },
  estadoChipText: { fontSize: 11, fontWeight: '600' },
  motivo: { fontSize: 14, lineHeight: 20 },
  importe: { fontSize: 28, fontWeight: '700' },
  fecha: { fontSize: 12 },

  advertencia: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  advertenciaText: { fontSize: 13, lineHeight: 19 },

  pagarButton: { borderRadius: 28 },
  pagarButtonContent: { paddingVertical: 6 },
  agregarMedioButton: { borderRadius: 28 },
});