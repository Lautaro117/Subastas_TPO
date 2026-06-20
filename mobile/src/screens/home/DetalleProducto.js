import React, { useCallback, useEffect, useState } from 'react';
import { Dimensions, FlatList, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Icon, IconButton, Surface, Text } from 'react-native-paper';

import { COLORS } from '../../theme/colors';
import { useAppSession } from '../../navigation/AppSessionContext';
import { aceptarPropuesta, rechazarPropuesta, marcarEnviado, getCustodia } from '../../services/itemsApi';
import { buildApiUrl } from '../../config/api';

const { width } = Dimensions.get('window');
const IMG_WIDTH = width - 48;

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  enviar_deposito: 'Enviar al depósito',
  en_deposito: 'En depósito',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

const ESTADO_COLOR = {
  pendiente: COLORS.onSurfaceVariant,
  enviar_deposito: '#FFA726',
  en_deposito: '#42A5F5',
  aprobado: '#4CAF50',
  rechazado: COLORS.error,
};

const PROPUESTA_LABEL = {
  propuesta_enviada: 'Propuesta recibida',
  propuesta_aceptada: 'Propuesta aceptada',
  propuesta_rechazada: 'Propuesta rechazada',
};

const PROPUESTA_COLOR = {
  propuesta_enviada: '#FFA726',
  propuesta_aceptada: '#4CAF50',
  propuesta_rechazada: COLORS.error,
};

function formatFecha(fechaStr) {
  if (!fechaStr) return null;
  const [year, month, day] = fechaStr.toString().split('-');
  return `${day}/${month}/${year}`;
}

export default function DetalleProducto({ navigation, route }) {
  const { session } = useAppSession();
  const { productoId } = route.params;
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accionando, setAccionando] = useState(false);
  const [fotoActual, setFotoActual] = useState(0);
  const [custodia, setCustodia] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/api/my-items/${productoId}`), {
        headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
      });
      const data = await response.json();
      setProducto(data);
      if (data?.estadoAdmin === 'en_deposito') {
        getCustodia(session.token, productoId)
          .then(setCustodia)
          .catch(() => {});
      }
    } catch {
      setError('No se pudo cargar el producto');
    } finally {
      setLoading(false);
    }
  }, [productoId, session.token]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleAceptar = async () => {
    setAccionando(true);
    try {
      await aceptarPropuesta(session.token, productoId);
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setAccionando(false);
    }
  };

  const handleMarcarEnviado = async () => {
    setAccionando(true);
    try {
      await marcarEnviado(session.token, productoId);
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setAccionando(false);
    }
  };

  const handleRechazar = async () => {
    setAccionando(true);
    try {
      await rechazarPropuesta(session.token, productoId);
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setAccionando(false);
    }
  };

  const estadoColor = ESTADO_COLOR[producto?.estadoAdmin] || COLORS.onSurfaceVariant;
  const propuestaColor = PROPUESTA_COLOR[producto?.estadoPropuesta];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>

          <View style={styles.header}>
            <IconButton icon="arrow-left" iconColor={COLORS.onSurface} size={22} onPress={() => navigation.goBack()} />
            <Text style={styles.title}>{producto?.descripcionCatalogo ?? 'Detalle'}</Text>
          </View>

          {loading ? (
            <ActivityIndicator style={styles.loader} />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : producto ? (
            <>
              {/* Carrusel de fotos */}
              {producto.fotos && producto.fotos.length > 0 ? (
                <View style={styles.carruselContainer}>
                  <FlatList
                    data={producto.fotos}
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
                    {producto.fotos.map((_, i) => (
                      <View key={i} style={[styles.dot, i === fotoActual && { backgroundColor: COLORS.primary }]} />
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.sinFotos}>
                  <Text style={{ color: COLORS.onSurfaceVariant }}>Sin fotos</Text>
                </View>
              )}

              {/* Banner: enviar al depósito */}
              {producto.estadoAdmin === 'enviar_deposito' && (
                <Surface elevation={0} style={styles.envioCard}>
                  <View style={styles.envioHeader}>
                    <Icon source="truck-delivery-outline" size={22} color="#fff" />
                    <Text style={styles.envioHeaderText}>Enviá tu producto al depósito</Text>
                  </View>

                  <View style={styles.envioBody}>
                    {producto.nombreDeposito ? (
                      <View style={styles.envioDir}>
                        <Text style={styles.envioDirLabel}>Depósito</Text>
                        <Text style={styles.envioDirNombre}>{producto.nombreDeposito}</Text>
                        <Text style={styles.envioDirLabel}>Dirección</Text>
                        <Text style={styles.envioDirValor}>{producto.direccionDeposito}</Text>
                      </View>
                    ) : (
                      <Text style={styles.envioMuted}>
                        La empresa te informará la dirección de envío a la brevedad.
                      </Text>
                    )}

                    <View style={styles.envioCosto}>
                      <Icon source="alert-circle-outline" size={16} color="#92400e" />
                      <Text style={styles.envioCostoText}>
                        El costo del envío al depósito corre por tu cuenta.
                      </Text>
                    </View>

                    <Button
                      mode="contained"
                      onPress={handleMarcarEnviado}
                      disabled={accionando}
                      style={styles.envioBtn}
                      labelStyle={{ fontSize: 14, fontWeight: '700', color: '#92400e' }}
                    >
                      Ya lo envié
                    </Button>
                  </View>
                </Surface>
              )}

              {/* Banner: producto rechazado */}
              {producto.estadoAdmin === 'rechazado' && (
                <Surface elevation={0} style={[styles.banner, { backgroundColor: COLORS.error + '22', borderColor: COLORS.error, flexDirection: 'column', gap: 10 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                    <Icon source="close-circle-outline" size={24} color={COLORS.error} />
                    <View style={styles.bannerText}>
                      <Text style={[styles.bannerTitle, { color: COLORS.error }]}>
                        {producto.etapaRechazo === 'en_deposito'
                          ? 'Producto rechazado en depósito'
                          : 'Producto no aceptado'}
                      </Text>
                      <Text style={[styles.bannerDesc, { color: COLORS.onSurfaceVariant }]}>
                        {producto.etapaRechazo === 'en_deposito'
                          ? 'Tu producto fue revisado en el depósito y no cumple los requisitos. Debés coordinar su retiro con la empresa.'
                          : 'Tu producto no fue aceptado para ingresar al proceso de subasta.'}
                      </Text>
                      {producto.nombreDeposito && producto.etapaRechazo === 'en_deposito' && (
                        <Text style={[styles.bannerField, { color: COLORS.onSurface }]}>
                          Ubicación actual: {producto.nombreDeposito} — {producto.direccionDeposito}
                        </Text>
                      )}
                    </View>
                  </View>
                  {producto.motivoRechazo ? (
                    <View style={[styles.aviso, { backgroundColor: COLORS.error + '15' }]}>
                      <Icon source="information-outline" size={16} color={COLORS.error} />
                      <Text style={[styles.avisoText, { color: COLORS.error }]}>
                        Motivo: {producto.motivoRechazo}
                      </Text>
                    </View>
                  ) : null}
                  {producto.etapaRechazo === 'en_deposito' && (
                    <View style={[styles.aviso, { backgroundColor: '#FEF3C7' }]}>
                      <Icon source="email-outline" size={16} color="#92400e" />
                      <Text style={[styles.avisoText, { color: '#92400e' }]}>
                        Para coordinar el retiro de tu producto contactate con el depósito en{' '}
                        <Text style={{color: '#92400e', fontWeight: '700' }}>deposito@subastas.com</Text>
                      </Text>
                    </View>
                  )}
                </Surface>
              )}

              {/* Banner: en depósito — ubicación + seguro */}
              {producto.estadoAdmin === 'en_deposito' && (
                <Surface elevation={0} style={[styles.banner, { backgroundColor: '#42A5F522', borderColor: '#42A5F5', flexDirection: 'column', gap: 12 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Icon source="warehouse" size={22} color="#42A5F5" />
                    <Text style={[styles.bannerTitle, { color: '#42A5F5' }]}>Pieza en depósito</Text>
                  </View>

                  {/* Ubicación */}
                  <View style={styles.custodiaBlock}>
                    <Text style={styles.custodiaLabel}>UBICACIÓN</Text>
                    {custodia?.nombreDeposito ? (
                      <>
                        <Text style={[styles.custodiaValor, { color: COLORS.onSurface }]}>{custodia.nombreDeposito}</Text>
                        <Text style={[styles.custodiaSub, { color: COLORS.onSurfaceVariant }]}>{custodia.direccionDeposito}</Text>
                      </>
                    ) : producto.nombreDeposito ? (
                      <>
                        <Text style={[styles.custodiaValor, { color: COLORS.onSurface }]}>{producto.nombreDeposito}</Text>
                        <Text style={[styles.custodiaSub, { color: COLORS.onSurfaceVariant }]}>{producto.direccionDeposito}</Text>
                      </>
                    ) : (
                      <Text style={[styles.custodiaSub, { color: COLORS.onSurfaceVariant }]}>Sin información de depósito</Text>
                    )}
                  </View>

                  {/* Póliza de seguro */}
                  <View style={[styles.custodiaBlock, { borderTopWidth: 1, borderTopColor: 'rgba(66,165,245,0.2)', paddingTop: 10 }]}>
                    <Text style={styles.custodiaLabel}>PÓLIZA DE SEGURO</Text>
                    {custodia?.nroPoliza ? (
                      <>
                        <Text style={[styles.custodiaValor, { color: COLORS.onSurface }]}>Nº {custodia.nroPoliza}</Text>
                        {custodia.companiaSeguro ? (
                          <Text style={[styles.custodiaSub, { color: COLORS.onSurfaceVariant }]}>{custodia.companiaSeguro}</Text>
                        ) : null}
                      </>
                    ) : (
                      <Text style={[styles.custodiaSub, { color: COLORS.onSurfaceVariant }]}>La empresa asignará el seguro a la brevedad</Text>
                    )}
                  </View>
                </Surface>
              )}

              {/* Info general */}
              <View style={styles.card}>
                <Text style={styles.cardDesc}>{producto.descripcionCompleta}</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Estado:</Text>
                  <Text style={[styles.infoValue, { color: estadoColor }]}>
                    {ESTADO_LABEL[producto.estadoAdmin] || producto.estadoAdmin}
                  </Text>
                </View>

                {producto.estadoPropuesta && producto.estadoPropuesta !== 'sin_propuesta' ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Propuesta:</Text>
                    <Text style={[styles.infoValue, { color: propuestaColor }]}>
                      {PROPUESTA_LABEL[producto.estadoPropuesta] || producto.estadoPropuesta}
                    </Text>
                  </View>
                ) : null}

                {producto.precioPropuesto != null ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Precio base:</Text>
                    <Text style={[styles.infoValue, { color: COLORS.primary }]}>
                      ${Number(producto.precioPropuesto).toLocaleString('es-AR')}
                    </Text>
                  </View>
                ) : null}

                {producto.comision != null ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Comisión:</Text>
                    <Text style={[styles.infoValue, { color: COLORS.onSurface }]}>
                      {Number(producto.comision).toLocaleString('es-AR')}%
                    </Text>
                  </View>
                ) : null}

                {producto.fechaSubasta ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Fecha de subasta:</Text>
                    <Text style={[styles.infoValue, { color: COLORS.onSurface }]}>
                      {formatFecha(producto.fechaSubasta)}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Acciones aceptar / rechazar */}
              {producto.estadoPropuesta === 'propuesta_enviada' ? (
                <View style={styles.acciones}>
                  <Button
                    mode="contained"
                    onPress={handleAceptar}
                    disabled={accionando}
                    style={[styles.btn, { backgroundColor: '#4CAF50' }]}
                    labelStyle={styles.btnLabel}
                  >
                    Aceptar propuesta
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handleRechazar}
                    disabled={accionando}
                    style={styles.btn}
                    labelStyle={[styles.btnLabel, { color: COLORS.error }]}
                  >
                    Rechazar propuesta
                  </Button>
                </View>
              ) : null}
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
  errorText: { color: COLORS.error, fontSize: 13, marginTop: 20 },
  carruselContainer: { marginBottom: 20 },
  foto: { width: IMG_WIDTH, height: 240, borderRadius: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: COLORS.onSurfaceVariant },
  sinFotos: { height: 200, borderRadius: 16, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16,
  },
  bannerText: { flex: 1, gap: 4 },
  bannerTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  bannerDesc: { fontSize: 13, lineHeight: 18 },
  bannerField: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  custodiaBlock: { gap: 2 },
  custodiaLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#42A5F5', marginBottom: 2 },
  custodiaValor: { fontSize: 14, fontWeight: '600' },
  custodiaSub: { fontSize: 12 },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, padding: 10 },
  avisoText: { fontSize: 12, lineHeight: 17, flex: 1 },
  envioCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, backgroundColor: COLORS.surfaceContainerLow, borderWidth: 1, borderColor: '#FFA726' },
  envioHeader: { backgroundColor: '#FFA726', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  envioHeaderText: { fontSize: 15, fontWeight: '700', color: '#fff', flex: 1 },
  envioBody: { padding: 16, gap: 14 },
  envioDir: { gap: 2 },
  envioDirLabel: { fontSize: 11, fontWeight: '700', color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  envioDirNombre: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  envioDirValor: { fontSize: 14, color: COLORS.onSurface },
  envioMuted: { fontSize: 13, color: COLORS.onSurfaceVariant, lineHeight: 18 },
  envioCosto: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FEF3C7', borderRadius: 8, padding: 12 },
  envioCostoText: { fontSize: 13, color: '#92400e', flex: 1, lineHeight: 18, fontWeight: '500' },
  envioBtn: { borderRadius: 999, backgroundColor: '#FEF3C7' },
  card: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16, padding: 20, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
  cardDesc: { fontSize: 14, lineHeight: 22, color: COLORS.onSurfaceVariant },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 13, color: COLORS.onSurfaceVariant },
  infoValue: { fontSize: 13, fontWeight: '600' },
  acciones: { gap: 12 },
  btn: { borderRadius: 999 },
  btnLabel: { fontSize: 15, fontWeight: '600' },
});
