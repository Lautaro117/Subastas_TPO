import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  Icon,
  Snackbar,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';

import { useAppSession } from '../../navigation/AppSessionContext';
import { getAuctionCatalog } from '../../services/auctionsApi';

// GET /api/auctions/{id}/items/{itemId}/result
async function getResultadoItem(token, auctionId, itemId, baseUrl) {
  const response = await fetch(`${baseUrl}/api/auctions/${auctionId}/items/${itemId}/result`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) throw new Error(`Error: ${response.status}`);
  return response.json();
}

export default function ResultadoSubastaScreen({ navigation, route }) {
  const { auctionId } = route.params ?? {};
  const theme = useTheme();
  const { session } = useAppSession();
  const token = session.token;

  const [resultados, setResultados] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbar, setSnackbar] = useState(null);

  const fetchResultados = useCallback(async () => {
    setIsLoading(true);
    try {
      // Traer el catálogo para obtener los itemIds
      const catalogo = await getAuctionCatalog(token, auctionId);
      const items = Array.isArray(catalogo) ? catalogo : [];

      // Traer resultado de cada ítem
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.0.184:8080';
      const resultadosData = await Promise.all(
        items.map(async (item) => {
          try {
            const resultado = await getResultadoItem(token, auctionId, item.itemId, baseUrl);
            return { ...resultado, item };
          } catch {
            return null;
          }
        })
      );

      setResultados(resultadosData.filter(Boolean));
    } catch {
      setSnackbar('No se pudieron cargar los resultados.');
    } finally {
      setIsLoading(false);
    }
  }, [token, auctionId]);

  useEffect(() => { fetchResultados(); }, [fetchResultados]);

  const gano = resultados.some((r) => r.gano === true);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Content title="Resultado de Subasta" />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>

          {/* Banner principal */}
          <Surface
            elevation={0}
            style={[
              styles.banner,
              {
                backgroundColor: gano
                  ? theme.colors.primaryContainer
                  : theme.colors.surfaceContainerLow,
                borderColor: gano ? theme.colors.primary : theme.colors.outline,
              },
            ]}
          >
            <Icon
              source={gano ? 'trophy-outline' : 'information-outline'}
              size={48}
              color={gano ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.bannerTitle, { color: gano ? theme.colors.onPrimaryContainer : theme.colors.onSurface }]}>
              {gano ? '¡Felicitaciones!' : 'Subasta finalizada'}
            </Text>
            <Text style={[styles.bannerDesc, { color: gano ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }]}>
              {gano
                ? 'Ganaste uno o más ítems en esta subasta.'
                : 'No ganaste ítems en esta subasta.'}
            </Text>
          </Surface>

          {/* Resultados por ítem */}
          {resultados.map((resultado, idx) => (
            <Surface
              key={idx}
              elevation={0}
              style={[
                styles.itemCard,
                {
                  backgroundColor: theme.colors.surfaceContainerLowest,
                  borderColor: resultado.gano ? theme.colors.primary : theme.colors.outline,
                },
              ]}
            >
              <View style={styles.itemCardHeader}>
                <Text style={[styles.itemNombre, { color: theme.colors.onSurface }]} numberOfLines={1}>
                  {resultado.item?.descripcionCatalogo ?? `Producto #${resultado.item?.productoId}`}
                </Text>
                <Chip
                  compact
                  style={{
                    backgroundColor: resultado.gano
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceContainerHigh,
                  }}
                  textStyle={{
                    color: resultado.gano
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant,
                    fontSize: 11,
                  }}
                >
                  {resultado.gano ? 'Ganado' : 'No ganado'}
                </Chip>
              </View>

              {resultado.montoPujado != null && (
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Tu puja
                  </Text>
                  <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                    $ {resultado.montoPujado?.toLocaleString('es-AR')}
                  </Text>
                </View>
              )}
            </Surface>
          ))}

          {resultados.length === 0 && (
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              No participaste en ningún ítem de esta subasta.
            </Text>
          )}

          {/* Botón volver */}
          <Button
            mode="contained"
            onPress={() => navigation.navigate('HomeSubastasMain')}
            style={styles.volverButton}
            contentStyle={styles.volverButtonContent}
          >
            Volver al inicio
          </Button>
        </ScrollView>
      )}

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000}>
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 16 },

  banner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  bannerTitle: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  bannerDesc: { fontSize: 14, lineHeight: 21, textAlign: 'center' },

  itemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  itemNombre: { flex: 1, fontSize: 15, fontWeight: '600' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 14, fontWeight: '600' },

  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 20 },

  volverButton: { borderRadius: 28, marginTop: 8 },
  volverButtonContent: { paddingVertical: 6 },
});