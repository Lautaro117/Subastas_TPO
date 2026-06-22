import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  const [pago, setPago] = useState(null);

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
      // Cargar estado del pago si ya confirmó entrega
      if (compraData.tipoEntrega) {
        const pagoRes = await fetch(buildApiUrl(`/api/my-purchases/${compraId}/payment`), {
          headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
        });
        if (pagoRes.ok && pagoRes.status !== 204) {
          setPago(await pagoRes.json());
        }
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
      // Cargar el registro de pago recién creado
      const pagoRes = await fetch(buildApiUrl(`/api/my-purchases/${compraId}/payment`), {
        headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
      });
      if (pagoRes.ok && pagoRes.status !== 204) setPago(await pagoRes.json());
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
              </View>

              {/* Póliza de seguro */}
              <View style={styles.polizaCard}>
                <View style={styles.polizaHeader}>
                  <Icon source="shield-check-outline" size={18} color="#42A5F5" />
                  <Text style={styles.polizaHeaderText}>Póliza de seguro</Text>
                </View>
                {compra.nroPoliza ? (
                  <>
                    <View style={styles.polizaRow}>
                      <Text style={styles.polizaLabel}>N° de póliza</Text>
                      <Text style={styles.polizaValor}>{compra.nroPoliza}</Text>
                    </View>
                    {compra.companiaSeguro ? (
                      <View style={styles.polizaRow}>
                        <Text style={styles.polizaLabel}>Aseguradora</Text>
                        <Text style={styles.polizaValor}>{compra.companiaSeguro}</Text>
                      </View>
                    ) : null}
                  </>
                ) : (
                  <Text style={styles.polizaPendiente}>La empresa asignará el seguro a la brevedad</Text>
                )}
                <View style={styles.polizaSeparador} />
                <Text style={styles.polizaContactoLabel}>Contacto con la aseguradora</Text>
                <Text style={styles.polizaContactoDesc}>Para consultas o modificaciones en los términos de tu póliza:</Text>
                <TouchableOpacity style={styles.contactoBtn} onPress={() => Linking.openURL('mailto:seguros@subastas.com')}>
                  <Icon source="email-outline" size={15} color="#42A5F5" />
                  <Text style={styles.contactoBtnText}>seguros@subastas.com</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.contactoBtn, { marginTop: 6 }]} onPress={() => Linking.openURL('tel:+541148000000')}>
                  <Icon source="phone-outline" size={15} color="#42A5F5" />
                  <Text style={styles.contactoBtnText}>+54 11 4800-0000</Text>
                </TouchableOpacity>
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
                <>
                  <View style={styles.confirmadoCard}>
                    <Icon source="check-circle-outline" size={28} color="#4CAF50" />
                    <Text style={styles.confirmadoText}>
                      Entrega confirmada: {tipoEntrega === 'envio' ? 'Envío a domicilio' : 'Retiro en depósito'}
                    </Text>
                  </View>

                  {/* Medio de pago fijo */}
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
                      <Text style={{ color: COLORS.onSurfaceVariant, fontSize: 13 }}>Cargando medio de pago...</Text>
                    )}
                  </View>

                  {/* Estado del pago */}
                  <Text style={styles.sectionTitle}>Estado del pago</Text>
                  {pago ? (
                    <View style={[
                      styles.pagoEstadoCard,
                      pago.estado === 'aprobado'  && { backgroundColor: '#4CAF5022', borderColor: '#4CAF50' },
                      pago.estado === 'rechazado' && { backgroundColor: '#EF444422', borderColor: '#EF4444' },
                      pago.estado === 'pendiente' && { backgroundColor: COLORS.surfaceContainerLow, borderColor: COLORS.outlineVariant },
                    ]}>
                      <Icon
                        source={pago.estado === 'aprobado' ? 'check-circle' : pago.estado === 'rechazado' ? 'close-circle' : 'clock-outline'}
                        size={24}
                        color={pago.estado === 'aprobado' ? '#4CAF50' : pago.estado === 'rechazado' ? '#EF4444' : COLORS.onSurfaceVariant}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[
                          styles.pagoEstadoTitle,
                          pago.estado === 'aprobado'  && { color: '#4CAF50' },
                          pago.estado === 'rechazado' && { color: '#EF4444' },
                          pago.estado === 'pendiente' && { color: COLORS.onSurface },
                        ]}>
                          {pago.estado === 'aprobado'  && 'Pago aprobado'}
                          {pago.estado === 'rechazado' && 'Pago rechazado'}
                          {pago.estado === 'pendiente' && 'Pendiente de verificación'}
                        </Text>
                        {pago.estado === 'rechazado' && (
                          <Text style={styles.pagoEstadoDesc}>
                            Se aplicó una multa equivalente al 10% del valor ofertado. Debés abonarla antes de participar en otra subasta.
                          </Text>
                        )}
                        {pago.estado === 'pendiente' && (
                          <Text style={styles.pagoEstadoDesc}>
                            La empresa está verificando tu pago. Te notificaremos cuando sea procesado.
                          </Text>
                        )}
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.pagoEstadoCard, { backgroundColor: COLORS.surfaceContainerLow, borderColor: COLORS.outlineVariant }]}>
                      <Icon source="clock-outline" size={24} color={COLORS.onSurfaceVariant} />
                      <Text style={[styles.pagoEstadoDesc, { flex: 1 }]}>El estado del pago se actualizará en breve.</Text>
                    </View>
                  )}
                </>
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
  confirmadoCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#4CAF5022', borderRadius: 14, padding: 16, marginBottom: 16 },
  confirmadoText: { fontSize: 15, color: '#4CAF50', fontWeight: '600', flex: 1 },
  pagoEstadoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 16 },
  pagoEstadoTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  pagoEstadoDesc: { fontSize: 13, color: COLORS.onSurfaceVariant, lineHeight: 18 },
  polizaCard: { backgroundColor: 'rgba(66,165,245,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(66,165,245,0.3)', padding: 14, marginBottom: 16, gap: 6 },
  polizaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  polizaHeaderText: { fontSize: 13, fontWeight: '700', color: '#42A5F5' },
  polizaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  polizaLabel: { fontSize: 11, fontWeight: '700', color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.4 },
  polizaValor: { fontSize: 13, fontWeight: '600', color: COLORS.onSurface },
  polizaPendiente: { fontSize: 12, color: COLORS.onSurfaceVariant, fontStyle: 'italic' },
  polizaSeparador: { borderTopWidth: 1, borderTopColor: 'rgba(66,165,245,0.2)', marginVertical: 8 },
  polizaContactoLabel: { fontSize: 11, fontWeight: '700', color: '#42A5F5', textTransform: 'uppercase', letterSpacing: 0.4 },
  polizaContactoDesc: { fontSize: 12, color: COLORS.onSurfaceVariant, lineHeight: 17, marginBottom: 4 },
  contactoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, backgroundColor: 'rgba(66,165,245,0.12)' },
  contactoBtnText: { fontSize: 13, color: '#42A5F5', fontWeight: '600' },
});