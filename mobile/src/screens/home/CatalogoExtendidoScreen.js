import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Dialog,
  IconButton,
  Portal,
  Button,
  Snackbar,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CatalogoExtendidoScreen({ navigation, route }) {
  const { auctionId, catalogo = [] } = route.params ?? {};
  const theme = useTheme();

  const STORAGE_KEY = `@subastas:notificados:${auctionId}`;

  const [modalNotificar, setModalNotificar] = useState(null);
  const [notificadosIds, setNotificadosIds] = useState(new Set());
  const [snackbar, setSnackbar] = useState(null);

  // Cargar desde AsyncStorage al montar
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setNotificadosIds(new Set(JSON.parse(stored)));
      })
      .catch(() => {});
  }, [STORAGE_KEY]);

  // Persistir cuando cambia
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...notificadosIds])).catch(() => {});
  }, [notificadosIds, STORAGE_KEY]);

  function handleConfirmarNotificar() {
    // TODO: llamar endpoint de notificación del ítem
    setNotificadosIds((prev) => new Set([...prev, modalNotificar]));
    setModalNotificar(null);
    setSnackbar('Te notificaremos cuando comience.');
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Catálogo" />
        <Text style={[styles.countLabel, { color: theme.colors.primary }]}>
          {catalogo.length} productos
        </Text>
      </Appbar.Header>

      <FlatList
        data={catalogo}
        keyExtractor={(item) => String(item.itemId)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('DetalleProductoSubasta', {
              auctionId,
              itemId: item.itemId,
              item,
            })}
          >
          <Surface
            elevation={0}
            style={[
              styles.row,
              {
                backgroundColor: item.subastado === 'si'
                  ? theme.colors.surfaceContainerHigh
                  : theme.colors.surfaceContainerLowest,
                borderColor: theme.colors.outline,
                opacity: item.subastado === 'si' ? 0.55 : 1,
              },
            ]}
          >
            {/* Thumb: foto real o placeholder */}
            <View style={[styles.thumb, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
              {item.fotoPrincipal ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${item.fotoPrincipal}` }}
                  style={{ width: 52, height: 52, borderRadius: 12 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ fontSize: 20 }}>📦</Text>
              )}
            </View>

            {/* Texto: descripción real */}
            <View style={styles.rowText}>
              <Text style={[styles.rowTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>
                {item.descripcionCatalogo ?? `Producto #${item.productoId}`}
              </Text>
              <Text style={[styles.rowSub, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
                {item.precioBase != null
                  ? `Base: ${Number(item.precioBase).toLocaleString('es-AR')}`
                  : 'Sin precio base'}
              </Text>
            </View>

            {/* Campana o subastado */}
            {item.subastado === 'si' || item.subastado === 'deshabilitado' ? (
              <Text style={[styles.subastadoLabel, { color: theme.colors.onSurfaceVariant }]}>
                {item.subastado === 'si' ? '✓' : '—'}
              </Text>
            ) : (
              <IconButton
                icon={notificadosIds.has(item.itemId) ? 'bell' : 'bell-outline'}
                iconColor={notificadosIds.has(item.itemId) ? theme.colors.primary : theme.colors.onSurfaceVariant}
                size={20}
                onPress={(e) => { e.stopPropagation?.(); setModalNotificar(item.itemId); }}
              />
            )}
          </Surface>
          </TouchableOpacity>
        )}
      />

      <Portal>
        <Dialog
          visible={modalNotificar !== null}
          onDismiss={() => setModalNotificar(null)}
          style={{ backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: 24 }}
        >
          <Dialog.Icon icon="bell-outline" color={theme.colors.primary} />
          <Dialog.Title style={{ textAlign: 'center', color: theme.colors.onSurface }}>
            Notificar producto
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              ¿Estás seguro que querés recibir una notificación cuando esté por comenzar la subasta de este producto?
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center', gap: 16 }}>
            <Button onPress={() => setModalNotificar(null)} textColor={theme.colors.onSurfaceVariant}>
              Cancelar
            </Button>
            <Button onPress={handleConfirmarNotificar} textColor={theme.colors.primary}>
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  countLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20, marginBottom: 2 },
  rowSub: { fontSize: 12, lineHeight: 18 },
  subastadoLabel: { fontSize: 16, marginRight: 8 },
});