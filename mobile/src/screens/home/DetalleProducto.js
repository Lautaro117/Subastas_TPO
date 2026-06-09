import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Icon, IconButton, Surface, Text } from 'react-native-paper';

import { COLORS } from '../../theme/colors';
import { useAppSession } from '../../navigation/AppSessionContext';
import { aceptarPropuesta, rechazarPropuesta, getCustodia } from '../../services/itemsApi';
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
  const [custodia, setCustodia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accionando, setAccionando] = useState(false);
  const [fotoActual, setFotoActual] = useState(0);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/api/my-items/${productoId}`), {
        headers: { Authorization: `Bearer ${session.token}`, Accept: 'application/json' },
      });
      const data = await response.json();
      setProducto(data);

      // Cargar info de depósito si está en estado de depósito
      if (data.estadoAdmin === 'enviar_deposito' || data.estadoAdmin === 'en_deposito') {
        getCustodia(session.token, productoId)
          .then(setCustodia)
          .catch(() => setCustodia(null));
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
                <Surface elevation={0} style={[styles.banner, { backgroundColor: '#FFA72622', borderColor: '#FFA726' }]}>
                  <Icon source="truck-delivery-outline" size={24} color="#FFA726" />
                  <View style={styles.bannerText}>
                    <Text style={[styles.bannerTitle, { color: '#FFA726' }]}>Tu producto fue seleccionado</Text>
                    <Text style={[styles.bannerDesc, { color: COLORS.onSurfaceVariant }]}>
                      Debés enviar el producto al depósito para su revisión.
                    </Text>
                    {custodia ? (
                      <>
                        <Text style={[styles.bannerField, { color: COLORS.onSurface }]}>
                          Depósito: {custodia.nombreDeposito}
                        </Text>
                        <Text style={[styles.bannerField, { color: COLORS.onSurface }]}>
                          Dirección: {custodia.direccionDeposito}
                        </Text>
                      </>
                    ) : (
                      <Text style={[styles.bannerDesc, { color: COLORS.onSurfaceVariant }]}>
                        La empresa se pondrá en contacto con las instrucciones de envío.
                      </Text>
                    )}
                  </View>
                </Surface>
              )}

              {/* Banner: producto rechazado */}
              {producto.estadoAdmin === 'rechazado' && (
                <Surface elevation={0} style={[styles.banner, { backgroundColor: COLORS.error + '22', borderColor: COLORS.error }]}>
                  <Icon source="package-variant" size={24} color={COLORS.error} />
                  <View style={styles.bannerText}>
                    <Text style={[styles.bannerTitle, { color: COLORS.error }]}>Propuesta rechazada</Text>
                    <Text style={[styles.bannerDesc, { color: COLORS.onSurfaceVariant }]}>
                      Debés coordinar el retiro de tu producto con la empresa.
                    </Text>
                    {custodia && (
                      <Text style={[styles.bannerField, { color: COLORS.onSurface }]}>
                        Ubicación actual: {custodia.nombreDeposito} — {custodia.direccionDeposito}
                      </Text>
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

                {producto.estadoPropuesta ? (
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
  card: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16, padding: 20, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
  cardDesc: { fontSize: 14, lineHeight: 22, color: COLORS.onSurfaceVariant },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 13, color: COLORS.onSurfaceVariant },
  infoValue: { fontSize: 13, fontWeight: '600' },
  acciones: { gap: 12 },
  btn: { borderRadius: 999 },
  btnLabel: { fontSize: 15, fontWeight: '600' },
});
