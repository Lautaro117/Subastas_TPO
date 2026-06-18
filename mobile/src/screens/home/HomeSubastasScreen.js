import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Badge,
  IconButton,
  Searchbar,
  SegmentedButtons,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';

import AuctionCard from './components/AuctionCard';
import { useAppSession } from '../../navigation/AppSessionContext';
import { getAuctions } from '../../services/auctionsApi';

const STATUS_MAP = {
  active: 'abierta',
  upcoming: 'pendiente',
  closed: 'cerrada',
};

const FILTERS = [
  { value: 'active', label: 'En curso' },
  { value: 'upcoming', label: 'Próximas' },
  { value: 'closed', label: 'Finalizadas' },
];

function EmptyState() {
  const theme = useTheme();
  return (
    <View style={styles.emptyContainer}>
      <IconButton icon="information-outline" iconColor={theme.colors.onSurfaceVariant} size={34} />
      <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
        No hay subastas disponibles
      </Text>
    </View>
  );
}

export default function HomeSubastasScreen({ navigation }) {
  const theme = useTheme();
  const { session, unreadNotificationsCount } = useAppSession();
  const token = session.token;
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  const [auctions, setAuctions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('active');

  const fetchAuctions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAuctions(tokenRef.current ?? null);
      setAuctions(Array.isArray(data) ? data : []);
    } catch {
      setError('No se pudieron cargar las subastas. Intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchAuctions(); }, [fetchAuctions]);

  const data = useMemo(() => {
    const targetStatus = STATUS_MAP[filter];
    const filtered = auctions.filter((item) => item.estado === targetStatus);

    if (!query.trim()) return filtered;

    const normalized = query.trim().toLowerCase();
    return filtered.filter((item) =>
      item.ubicacion?.toLowerCase().includes(normalized) ||
      item.categoria?.toLowerCase().includes(normalized)
    );
  }, [auctions, filter, query]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>Subastas</Text>
        </View>

        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Buscar subastas"
            value={query}
            onChangeText={setQuery}
            icon="magnify"
            style={[styles.searchbar, { backgroundColor: theme.colors.surfaceContainerLow }]}
            inputStyle={[styles.searchInput, { color: theme.colors.onSurface }]}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
          <View style={styles.bellWrap}>
            <IconButton
              icon="bell-outline"
              iconColor={theme.colors.primary}
              size={20}
              style={[styles.bellButton, { backgroundColor: theme.colors.surfaceContainerLow }]}
              onPress={() => navigation.navigate('Notificaciones')}
            />
            <Badge visible={unreadNotificationsCount > 0} size={16} style={styles.bellBadge}>
              {unreadNotificationsCount}
            </Badge>
          </View>
        </View>

        <View style={styles.filtersWrap}>
          <SegmentedButtons
            value={filter}
            onValueChange={setFilter}
            density="small"
            buttons={FILTERS}
            style={styles.segmented}
            theme={{
              colors: {
                secondaryContainer: theme.colors.primary,
                onSecondaryContainer: theme.colors.onPrimary,
                outline: theme.colors.outline,
              },
            }}
          />
        </View>

        {isLoading ? (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={theme.colors.primary} />
  </View>
) : (
  <FlatList
    data={data}
    keyExtractor={(item) => String(item.identificador)}
    renderItem={({ item }) => (
      <AuctionCard
        item={item}
        onPress={() =>
          navigation.navigate('SalaSubasta', { auctionId: item.identificador, auction: item })
        }
      />
    )}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.listContent}
    ListEmptyComponent={EmptyState}
    onRefresh={fetchAuctions}
    refreshing={isLoading}
  />
)}


      </View>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{ label: 'Reintentar', onPress: fetchAuctions }}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  searchRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchbar: {
    flex: 1,
    borderRadius: 999,
    height: 42,
    justifyContent: 'center',
  },
  searchInput: { minHeight: 20, fontSize: 14 },
  bellButton: { margin: 0, borderRadius: 999 },
  bellWrap: { position: 'relative' },
  bellBadge: { position: 'absolute', top: 2, right: 2 },
  filtersWrap: { marginTop: 28, marginBottom: 24 },
  segmented: { borderRadius: 999 },
  listContent: { flexGrow: 1, paddingBottom: 20 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyText: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
});