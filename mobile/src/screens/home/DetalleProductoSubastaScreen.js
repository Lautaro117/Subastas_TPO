import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Button,
  Chip,
  Dialog,
  IconButton,
  Portal,
  Snackbar,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppSession } from '../../navigation/AppSessionContext';
import { getItemDetail } from '../../services/auctionsApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 300;

// ─── Carrusel de fotos ────────────────────────────────────────────────────────
function PhotoCarousel({ fotos, theme }) {
  const [page, setPage] = useState(0);
  const scrollRef = useRef(null);

  if (!fotos || fotos.length === 0) {
    return (
      <View style={[carouselStyles.placeholder, { backgroundColor: theme.colors.surfaceContainerLow }]}>
        <Text style={{ fontSize: 48 }}>📦</Text>
      </View>
    );
  }

  const handleScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setPage(idx);
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {fotos.map((foto, idx) => (
          <Image
            key={idx}
            source={{ uri: `data:image/jpeg;base64,${foto}` }}
            style={carouselStyles.image}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Indicadores de página */}
      {fotos.length > 1 && (
        <View style={carouselStyles.dots}>
          {fotos.map((_, idx) => (
            <View
              key={idx}
              style={[
                carouselStyles.dot,
                idx === page
                  ? { backgroundColor: '#fff', width: 16 }
                  : { backgroundColor: 'rgba(255,255,255,0.45)' },
              ]}
            />
          ))}
        </View>
      )}

      {/* Contador de fotos */}
      {fotos.length > 1 && (
        <View style={carouselStyles.counter}>
          <Text style={carouselStyles.counterText}>{page + 1} / {fotos.length}</Text>
        </View>
      )}
    </View>
  );
}

const carouselStyles = StyleSheet.create({
  image: { width: SCREEN_WIDTH, height: CAROUSEL_HEIGHT },
  placeholder: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    width: 6,
  },
  counter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  counterText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});

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
  const userEstado = decodeJwtPayload(token ?? '').estado;

  const STORAGE_KEY = `@subastas:notificados:${auctionId}`;

  const [detalle, setDetalle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState(null);
  const [notificado, setNotificado] = useState(false);
  const [modalNotificar, setModalNotificar] = useState(false);

  // ─── Cargar estado de notificación desde AsyncStorage ──────────────────────
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const ids = new Set(JSON.parse(stored));
          setNotificado(ids.has(itemId));
        }
      })
      .catch(() => {});
  }, [STORAGE_KEY, itemId]);

  // ─── Fetch detalle ─────────────────────────────────────────────────────────
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

  // ─── Confirmar notificación ────────────────────────────────────────────────
  const handleConfirmarNotificar = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const ids = new Set(stored ? JSON.parse(stored) : []);
      ids.add(itemId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
      setNotificado(true);
    } catch {}
    setModalNotificar(false);
    setSnackbar('Te notificaremos cuando comience.');
  };

  const titulo = detalle?.descripcionCatalogo ?? `Producto #${detalle?.productoId ?? itemParam?.productoId}`;
  const fotos = detalle?.fotos ?? [];
  const subastado = detalle?.subastado === 'si' || itemParam?.subastado === 'si';

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
        {/* Campana de notificación */}
        {!subastado && (
          <IconButton
            icon={notificado ? 'bell' : 'bell-outline'}
            iconColor={notificado ? theme.colors.primary : theme.colors.onSurfaceVariant}
            size={22}
            onPress={() => setModalNotificar(true)}
          />
        )}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Carrusel de fotos */}
        <PhotoCarousel fotos={fotos} theme={theme} />

        <View style={styles.body}>
          {/* Chips de estado */}
          <View style={styles.chipsRow}>
            {subastado && (
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
            {detalle?.itemId != null && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Ítem #
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                  {detalle.itemId}
                </Text>
              </View>
            )}

            {detalle?.duenioNombre && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Dueño
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                  {detalle.duenioNombre}
                </Text>
              </View>
            )}

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

          {/* Botón ingresar a la subasta */}
          {!subastado && auctionId && (
            <Button
              mode="contained"
              onPress={() => navigation.navigate('SalaSubasta', 
                {auctionId, auction: { identificador: auctionId, estado: 'abierta' }, 
                autoJoin: true,

              })}
              style={styles.ingresarButton}
              contentStyle={styles.ingresarButtonContent}
            >
              Ingresar a la Subasta
            </Button>
          )}
        </View>
      </ScrollView>

      {/* Modal notificación */}
      <Portal>
        <Dialog
          visible={modalNotificar}
          onDismiss={() => setModalNotificar(false)}
          style={{ backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: 24 }}
        >
          <Dialog.Icon icon="bell-outline" color={theme.colors.primary} />
          <Dialog.Title style={{ textAlign: 'center', color: theme.colors.onSurface }}>
            Notificar producto
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              ¿Querés recibir una notificación cuando esté por comenzar la subasta de este producto?
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center', gap: 16 }}>
            <Button onPress={() => setModalNotificar(false)} textColor={theme.colors.onSurfaceVariant}>
              Cancelar
            </Button>
            <Button onPress={handleConfirmarNotificar} textColor={theme.colors.primary}>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  appbarTitle: { fontSize: 16, fontWeight: '600' },

  content: { paddingBottom: 40 },
  body: { paddingHorizontal: 20, paddingTop: 20 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
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

  infoCard: { borderRadius: 12, padding: 16, gap: 12 },
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
  precioBaseBloqueado: { fontSize: 14, fontWeight: '600', letterSpacing: 2 },
  precioBaseMsg: { fontSize: 12, fontWeight: '500' },

  ingresarButton: {
    borderRadius: 28,
    marginTop: 24,
  },
  ingresarButtonContent: { paddingVertical: 6 },
});