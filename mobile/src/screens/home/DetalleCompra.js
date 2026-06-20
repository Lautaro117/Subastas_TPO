import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Icon, IconButton, RadioButton, Text } from 'react-native-paper';

import { COLORS } from '../../theme/colors';
import { useAppSession } from '../../navigation/AppSessionContext';
import { getPaymentMethods } from '../../services/paymentApi';
import { buildApiUrl } from '../../config/api';

const { width } = Dimensions.get('window');
const IMG_WIDTH = width - 48;

const TIPO_LABEL = {
  cuenta_bancaria: 'Cuenta bancaria',
  tarjeta: 'Tarjeta de crédito',
  cheque: 'Cheque certificado',
};

function parseDatos(datos) {
  try { return typeof datos === 'string' ? JSON.parse(datos) : datos; }
  catch { return {}; }
}

function getSubtitle(method) {
  const d = parseDatos(method.datos);
  if (method.tipo === 'cuenta_bancaria') return d.nombre_banco ?? d.cbu_iban ?? '';
  if (method.tipo === 'tarjeta') return d.numero ?? '';
  if (method.tipo === 'cheque') return `$${d.monto ?? ''} — ${d.banco_emisor ?? ''}`;
  return '';
}

export default function DetalleCompra({ navigation, route }) {
  const { session } = useAppSession();
  const { compraId } = route.params;
  const [compra, setCompra] = useState(null);
  const [medios, setMedios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState('envio');
  const [confirmando, setConfirmando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  const [fotoActual, setFotoActual] = useState(0);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [compraRes, mediosRes] = await Promise.all([
        fetch(buildApiUrl(`/api/my-purchases/${compraId}`), {
          headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
        }),
        getPaymentMethods(session.token),
      ]);
      const compraData = await compraRes.json();
      setCompra(compraData);
      // Ya no se elige acá: el medio quedó fijo desde que ganó la puja (el mismo con el
      // que pujó). Solo lo necesitamos para mostrar de qué medio se trata.
      setMedios(mediosRes || []);
      if (compraData.tipoEntrega) {
        setTipoEntrega(compraData.tipoEntrega);
        setConfirmado(true);
      }
    } catch {
      setError('No se pudo cargar la compra');
    } finally {
      setLoading(false);
    }
  }, [compraId, session.token]);

  useEffect(() => { cargar(); }, [cargar]);

  const medioFijo = medios.find((m) => m.id === compra?.medioPagoId) ?? null;

  const handleConfirmar = async () => {
    setConfirmando(true);
    setError('');
    try {
      const response = await fetch(buildApiUrl(`/api/my-purchases/${compraId}/confirm`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ tipoEntrega }),
      });
      if (!response.ok) throw new Error('No se pudo confirmar');
      setConfirmado(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>

          <View style={styles.header}>
            <IconButton icon="arrow-left" iconColor={COLORS.onSurface} size={22} onPress={() => navigation.goBack()} />
            <Text style={styles.title}>{compra?.descripcion ?? 'Detalle'}</Text>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loader} />
          ) : error && !compra ? (
            <Text style={styles.error}>{error}</Text>
          ) : compra ? (
            <>
              {/* Carrusel */}
              {compra.fotos && compra.fotos.length > 0 ? (
                <View style={styles.carruselContainer}>
                  <FlatList
                    data={compra.fotos}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, i) => i.toString()}
                    onScroll={(e) => {
                      const index = Math.round(e.nativeEvent.contentOffset.x / IMG_WIDTH);
                      setFotoActual(index);
                    }}
                    renderItem={({ item }) => (
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${item}` }}
                        style={styles.foto}
                        resizeMode="cover"
                      />
                    )}
                  />
                  <View style={styles.dots}>
                    {compra.fotos.map((_, i) => (
                      <View key={i} style={[styles.dot, i === fotoActual && { backgroundColor: COLORS.primary }]} />
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.sinFotos}>
                  <Text style={{ color: COLORS.onSurfaceVariant }}>Sin fotos</Text>
                </View>
              )}

              {/* Info */}
              <View style={styles.card}>
                <Text style={styles.cardDesc}>{compra.descripcionCompleta}</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Importe:</Text>
                  <Text style={[styles.infoValue, { color: COLORS.primary }]}>${compra.importe}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Comisión:</Text>
                  <Text style={styles.infoValue}>${compra.comision}</Text>
                </View>
                {compra.direccionEnvio ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Dirección envío:</Text>
                    <Text style={styles.infoValue}>{compra.direccionEnvio}</Text>
                  </View>
                ) : null}
                {compra.nroPoliza ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Póliza:</Text>
                    <Text style={styles.infoValue}>{compra.nroPoliza}</Text>
                  </View>
                ) : null}
                {compra.companiaSeguro ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Seguro:</Text>
                    <Text style={styles.infoValue}>{compra.companiaSeguro}</Text>
                  </View>
                ) : null}
              </View>

              {/* Tipo entrega */}
              {!confirmado ? (
                <>
                  <Text style={styles.sectionTitle}>Tipo de entrega</Text>
                  <View style={styles.card}>
                    <TouchableOpacity style={styles.radioRow} onPress={() => setTipoEntrega('envio')}>
                      <RadioButton value="envio" status={tipoEntrega === 'envio' ? 'checked' : 'unchecked'} onPress={() => setTipoEntrega('envio')} color={COLORS.primary} />
                      <Text style={styles.radioLabel}>Envío a domicilio</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.radioRow} onPress={() => setTipoEntrega('retiro')}>
                      <RadioButton value="retiro" status={tipoEntrega === 'retiro' ? 'checked' : 'unchecked'} onPress={() => setTipoEntrega('retiro')} color={COLORS.primary} />
                      <Text style={styles.radioLabel}>Retiro en depósito</Text>
                    </TouchableOpacity>
                    {tipoEntrega === 'retiro' ? (
                      <View style={styles.aviso}>
                        <Icon source="alert-outline" size={18} color="#FFA726" />
                        <Text style={styles.avisoText}>
                          Al retirar el producto, el seguro deja de estar vigente.
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Medio de pago — fijo desde que ganó la puja, no se puede cambiar acá */}
                  <Text style={styles.sectionTitle}>Medio de pago</Text>
                  <View style={styles.card}>
                    {medioFijo ? (
                      <View style={styles.radioRow}>
                        <Icon source="lock-outline" size={18} color={COLORS.onSurfaceVariant} />
                        <View>
                          <Text style={styles.radioLabel}>{TIPO_LABEL[medioFijo.tipo] ?? medioFijo.tipo}</Text>
                          <Text style={styles.radioSub}>{getSubtitle(medioFijo)}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.error}>No se encontró el medio de pago con el que pujaste</Text>
                    )}
                  </View>

                  {error ? <Text style={styles.error}>{error}</Text> : null}

                  <Button
                    mode="contained"
                    onPress={handleConfirmar}
                    disabled={confirmando}
                    style={styles.btn}
                    contentStyle={styles.btnContent}
                    labelStyle={styles.btnLabel}
                  >
                    Confirmar
                  </Button>
                </>
              ) : (
                <View style={styles.confirmadoCard}>
                  <Icon source="check-circle-outline" size={28} color="#4CAF50" />
                  <Text style={styles.confirmadoText}>
                    Entrega confirmada: {tipoEntrega === 'envio' ? 'Envío a domicilio' : 'Retiro en depósito'}
                  </Text>
                </View>
              )}
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.onBackground, flex: 1 },
  loader: { marginTop: 40 },
  error: { color: COLORS.error, fontSize: 13, marginTop: 12 },
  carruselContainer: { marginBottom: 20 },
  foto: { width: IMG_WIDTH, height: 240, borderRadius: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: COLORS.onSurfaceVariant },
  sinFotos: { height: 180, borderRadius: 16, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  card: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16, padding: 16, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16 },
  cardDesc: { fontSize: 14, lineHeight: 22, color: COLORS.onSurfaceVariant },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 13, color: COLORS.onSurfaceVariant },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.onSurface },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.onBackground, marginBottom: 8 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioLabel: { fontSize: 15, color: COLORS.onSurface },
  radioSub: { fontSize: 12, color: COLORS.onSurfaceVariant },
  aviso: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFA72622', borderRadius: 10, padding: 10, marginTop: 4 },
  avisoText: { flex: 1, fontSize: 13, color: '#FFA726', lineHeight: 18 },
  btn: { marginTop: 8, borderRadius: 999, backgroundColor: COLORS.primary },
  btnContent: { minHeight: 52 },
  btnLabel: { fontSize: 15, fontWeight: '600', color: COLORS.onPrimary },
  confirmadoCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#4CAF5022', borderRadius: 14, padding: 16 },
  confirmadoText: { fontSize: 15, color: '#4CAF50', fontWeight: '600', flex: 1 },
});