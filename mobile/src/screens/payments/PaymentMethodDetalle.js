import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconButton, Surface, Text } from 'react-native-paper';

import { COLORS } from '../../theme/colors';
import { useAppSession } from '../../navigation/AppSessionContext';
import { deletePaymentMethod, setPayoutAccount } from '../../services/paymentApi';

const TIPO_LABEL = {
  cuenta_bancaria: 'Cuenta bancaria',
  tarjeta: 'Tarjeta de crédito',
  cheque: 'Cheque certificado',
};

const TIPO_ICON = {
  cuenta_bancaria: 'bank-outline',
  tarjeta: 'credit-card-outline',
  cheque: 'file-document-outline',
};

function parseDatos(datos) {
  try { return typeof datos === 'string' ? JSON.parse(datos) : datos; }
  catch { return {}; }
}

function CampoDetalle({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <Text style={styles.campoValue}>{value}</Text>
    </View>
  );
}

export default function PaymentMethodDetalle({ navigation, route }) {
  const { session } = useAppSession();
  const { method, onUpdate } = route.params;
  const [isCuentaCobro, setIsCuentaCobro] = useState(method.cuentaCobro);
  const [loadingCobro, setLoadingCobro] = useState(false);
  const [error, setError] = useState('');

  const datos = parseDatos(method.datos);

  const handleSetCuentaCobro = async () => {
    if (isCuentaCobro) return;
    setLoadingCobro(true);
    try {
      await setPayoutAccount(method.id, session.token);
      setIsCuentaCobro(true);
      if (onUpdate) onUpdate();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingCobro(false);
    }
  };

  const handleEliminar = async () => {
    try {
      await deletePaymentMethod(method.id, session.token);
      if (onUpdate) onUpdate();
      navigation.goBack();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>

          <View style={styles.header}>
            <IconButton icon="arrow-left" iconColor={COLORS.onSurface} size={22} onPress={() => navigation.goBack()} />
            <Text style={styles.title}>Detalle</Text>
            <TouchableOpacity onPress={handleSetCuentaCobro} disabled={loadingCobro || isCuentaCobro}>
              <Icon
                source={isCuentaCobro ? 'star' : 'star-outline'}
                size={26}
                color={isCuentaCobro ? '#FFA726' : COLORS.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          <Surface style={styles.card} elevation={0}>
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Icon source={TIPO_ICON[method.tipo] ?? 'credit-card-outline'} size={28} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.tipoLabel}>{TIPO_LABEL[method.tipo] ?? method.tipo}</Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: method.verificado ? '#4CAF5022' : '#FFA72622' }]}>
                    <Text style={[styles.badgeText, { color: method.verificado ? '#4CAF50' : '#FFA726' }]}>
                      {method.verificado ? 'Verificado' : 'Pendiente verificación'}
                    </Text>
                  </View>
                  {isCuentaCobro ? (
                    <View style={[styles.badge, { backgroundColor: COLORS.primary + '22' }]}>
                      <Text style={[styles.badgeText, { color: COLORS.primary }]}>Cuenta de cobro</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.separator} />

            {/* Cuenta bancaria */}
            {method.tipo === 'cuenta_bancaria' && (
              <>
                <CampoDetalle label="Banco" value={datos.nombre_banco} />
                <CampoDetalle label="CBU / IBAN" value={datos.cbu_iban} />
                <CampoDetalle label="Titular" value={datos.titular} />
                <CampoDetalle label="País" value={datos.pais_banco} />
                <CampoDetalle label="Moneda" value={datos.moneda} />
                <CampoDetalle label="Fondos reservados" value={datos.fondos_reservados ? `$${datos.fondos_reservados}` : null} />
              </>
            )}

            {/* Tarjeta */}
            {method.tipo === 'tarjeta' && (
              <>
                <CampoDetalle label="Tipo" value={datos.tipo} />
                <CampoDetalle label="Número" value={datos.numero} />
                <CampoDetalle label="Titular" value={datos.titular} />
                <CampoDetalle label="Vencimiento" value={datos.vencimiento} />
                <CampoDetalle label="País emisor" value={datos.pais_emisor} />
              </>
            )}

            {/* Cheque */}
            {method.tipo === 'cheque' && (
              <>
                <CampoDetalle label="Banco emisor" value={datos.banco_emisor} />
                <CampoDetalle label="Monto" value={datos.monto ? `$${datos.monto}` : null} />
                <CampoDetalle label="Moneda" value={datos.moneda} />
                <CampoDetalle label="Fecha de emisión" value={datos.fecha_emision} />
              </>
            )}
          </Surface>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.deleteButton} onPress={handleEliminar}>
            <Icon source="trash-can-outline" size={20} color={COLORS.error} />
            <Text style={[styles.deleteText, { color: COLORS.error }]}>Eliminar método de pago</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.onBackground },
  card: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBox: { width: 50, height: 50, borderRadius: 14, backgroundColor: COLORS.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  tipoLabel: { fontSize: 17, fontWeight: '600', color: COLORS.onSurface, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 4 },
  campo: { gap: 2 },
  campoLabel: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '500' },
  campoValue: { fontSize: 15, color: COLORS.onSurface, fontWeight: '400' },
  error: { color: COLORS.error, marginTop: 16, fontSize: 13 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 32, justifyContent: 'center' },
  deleteText: { fontSize: 15, fontWeight: '500' },
});