import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, IconButton, Text } from 'react-native-paper';

import { COLORS } from '../../theme/colors';
import { useAppSession } from '../../navigation/AppSessionContext';
import { aceptarPropuesta, rechazarPropuesta } from '../../services/itemsApi';
import { buildApiUrl } from '../../config/api';

const { width } = Dimensions.get('window');
const IMG_WIDTH = width - 48;

const ESTADO_LABEL = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' };
const PROPUESTA_LABEL = {
  propuesta_enviada: 'Propuesta recibida',
  propuesta_aceptada: 'Propuesta aceptada',
  propuesta_rechazada: 'Propuesta rechazada',
};

export default function DetalleProducto({ navigation, route }) {
  const { session } = useAppSession();
  const { productoId } = route.params;
  const [producto, setProducto] = useState(null);
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
    console.log('DETALLE:', JSON.stringify(data));
    setProducto(data);
  } catch (e) {
    console.log('ERROR:', e);
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

  const estadoColor = {
    pendiente: COLORS.onSurfaceVariant,
    aprobado: '#4CAF50',
    rechazado: COLORS.error,
  }[producto?.estadoAdmin] || COLORS.onSurfaceVariant;

  const propuestaColor = {
    propuesta_enviada: '#FFA726',
    propuesta_aceptada: '#4CAF50',
    propuesta_rechazada: COLORS.error,
  }[producto?.estadoPropuesta];

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
            <Text style={styles.error}>{error}</Text>
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
                      <View
                        key={i}
                        style={[styles.dot, i === fotoActual && { backgroundColor: COLORS.primary }]}
                      />
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
                <Text style={styles.cardDesc}>{producto.descripcionCompleta}</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Revisión:</Text>
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

                {producto.precioPropuesto ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Precio propuesto:</Text>
                    <Text style={[styles.infoValue, { color: COLORS.primary }]}>
                      ${producto.precioPropuesto}
                    </Text>
                  </View>
                ) : null}
              </View>

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
  error: { color: COLORS.error, fontSize: 13, marginTop: 20 },
  carruselContainer: { marginBottom: 20 },
  foto: { width: IMG_WIDTH, height: 240, borderRadius: 16 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 7, height: 7, borderRadius: 999, backgroundColor: COLORS.onSurfaceVariant },
  sinFotos: { height: 200, borderRadius: 16, backgroundColor: COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  card: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16, padding: 20, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
  cardDesc: { fontSize: 14, lineHeight: 22, color: COLORS.onSurfaceVariant },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 13, color: COLORS.onSurfaceVariant },
  infoValue: { fontSize: 13, fontWeight: '600' },
  acciones: { gap: 12 },
  btn: { borderRadius: 999 },
  btnLabel: { fontSize: 15, fontWeight: '600' },
});