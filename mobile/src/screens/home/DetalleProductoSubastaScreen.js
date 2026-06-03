import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Appbar,
  Chip,
  Snackbar,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';

import { useAppSession } from '../../navigation/AppSessionContext';
import { getItemDetail } from '../../services/auctionsApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

export default function DetalleProductoSubastaScreen({ navigation, route }) {
  const { auctionId, itemId, item: itemParam } = route.params ?? {};
  const theme = useTheme();
  const { session } = useAppSession();
  const token = session.token;
  const userEstado = decodeJwtPayload(token ?? '').estado; // 'E1' | 'E2' | 'E3' | 'E4'

  const [detalle, setDetalle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fotoIndex, setFotoIndex] = useState(0);
  const [snackbar, setSnackbar] = useState(null);

  const fetchDetalle = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getItemDetail(token, auctionId, itemId);
      setDetalle(data);
    } catch {
      setSnackbar('No se pudo cargar el detalle del producto.');
    } finally {
      setIsLoading(false);
    }
  }, [token, auctionId, itemId]);

  useEffect(() => { fetchDetalle(); }, [fetchDetalle]);

  const titulo = detalle?.descripcionCatalogo ?? `Producto #${detalle?.productoId ?? itemParam?.productoId}`;
  const fotos = detalle?.fotos ?? [];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Producto" />
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
        <Appbar.Content title={titulo} titleStyle={styles.appbarTitle} numberOfLines={1} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Fotos */}
        {fotos.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setFotoIndex(index);
              }}
            >
              {fotos.map((foto, idx) => (
                <Image
                  key={idx}
                  source={{ uri: `data:image/jpeg;base64,${foto}` }}
                  style={styles.foto}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {/* Indicador de fotos */}
            {fotos.length > 1 && (
              <View style={styles.dotsRow}>
                {fotos.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: idx === fotoIndex
                          ? theme.colors.primary
                          : theme.colors.surfaceContainerHigh,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.fotoPlaceholder, { backgroundColor: theme.colors.surfaceContainerLow }]}>
            <Text style={{ fontSize: 48 }}>📦</Text>
          </View>
        )}

        <View style={styles.body}>
          {/* Chips de estado */}
          <View style={styles.chipsRow}>
            {detalle?.subastado === 'si' && (
              <Chip
                compact
                style={{ backgroundColor: theme.colors.surfaceContainerHigh }}
                textStyle={{ color: theme.colors.onSurfaceVariant, fontSize: 11 }}
              >
                Subastado
              </Chip>
            )}
            {detalle?.disponible && (
              <Chip
                compact
                style={{ backgroundColor: theme.colors.secondaryContainer }}
                textStyle={{ color: theme.colors.onSecondaryContainer, fontSize: 11 }}
              >
                {detalle.disponible === 'si' ? 'Disponible' : 'No disponible'}
              </Chip>
            )}
          </View>

          {/* Fecha */}
          {detalle?.fecha && (
            <Text style={[styles.fecha, { color: theme.colors.primary }]}>
              {detalle.fecha}
            </Text>
          )}

          {/* Descripción catálogo */}
          {detalle?.descripcionCatalogo && (
            <Text style={[styles.descripcionCatalogo, { color: theme.colors.onSurface }]}>
              {detalle.descripcionCatalogo}
            </Text>
          )}

          {/* Descripción completa */}
          {detalle?.descripcionCompleta && (
            <Text style={[styles.descripcionCompleta, { color: theme.colors.onSurfaceVariant }]}>
              {detalle.descripcionCompleta}
            </Text>
          )}

          {/* Info económica */}
          <Surface
            elevation={0}
            style={[styles.infoCard, { backgroundColor: theme.colors.surfaceContainerLow }]}
          >
            {/* Precio base — censurado si el usuario es E2 */}
            {userEstado === 'E2' ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('HomePerfil', { screen: 'PaymentMethods' })}
                activeOpacity={0.75}
              >
                <View style={[styles.precioBasecensurado, { backgroundColor: theme.colors.surfaceContainerHigh, borderColor: theme.colors.outline }]}>
                  <View style={styles.precioBaseFila}>
                    <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                      Precio base
                    </Text>
                    <Text style={[styles.precioBaseBloqueado, { color: theme.colors.onSurfaceVariant }]}>
                      $ ••••••
                    </Text>
                  </View>
                  <Text style={[styles.precioBaseMsg, { color: theme.colors.primary }]}>
                    Cargá un medio de pago para ver el precio base →
                  </Text>
                </View>
              </TouchableOpacity>
            ) : detalle?.precioBase != null ? (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Precio base
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                  {detalle.precioBase.toLocaleString('es-AR')}
                </Text>
              </View>
            ) : null}
            {detalle?.comision != null && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Comisión
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                  {detalle.comision.toLocaleString('es-AR')}
                </Text>
              </View>
            )}
          </Surface>
        </View>
      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  appbarTitle: { fontSize: 16, fontWeight: '600' },

  foto: {
    width: SCREEN_WIDTH,
    height: 280,
  },
  fotoPlaceholder: {
    width: '100%',
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },

  content: { paddingBottom: 40 },
  body: { paddingHorizontal: 20, paddingTop: 20 },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  fecha: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  descripcionCatalogo: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 12,
  },
  descripcionCompleta: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },

  infoCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  precioBasecensurado: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  precioBaseFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  precioBaseBloqueado: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
  },
  precioBaseMsg: {
    fontSize: 12,
    fontWeight: '500',
  },
});