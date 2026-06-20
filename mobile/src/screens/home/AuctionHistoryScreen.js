import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Button,
  Chip,
  Icon,
  IconButton,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';

import { useAppSession } from '../../navigation/AppSessionContext';
import { getMyStats, getAuctionHistory, getAuctionBids } from '../../services/userApi';
import { getMisCompras } from '../../services/itemsApi';
import { COLORS } from '../../theme/colors';

export default function AuctionHistoryScreen({ navigation }) {
  const theme = useTheme();
  const { session } = useAppSession();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Datos
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [purchases, setPurchases] = useState([]);

  // Pestaña activa: 'activity' (participaciones) o 'won' (compras/adjudicaciones)
  const [activeTab, setActiveTab] = useState('activity');

  // Historial de pujas expandido por subasta: { [subastaId]: Pujo[] | 'loading' }
  const [bidsMap, setBidsMap] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  const loadAllData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError('');

    try {
      const [statsData, historyData, purchasesData] = await Promise.all([
        getMyStats(session.token),
        getAuctionHistory(session.token),
        getMisCompras(session.token),
      ]);

      setStats(statsData);
      setHistory(historyData || []);
      setPurchases(purchasesData || []);
    } catch (err) {
      setError(err?.message || 'Error al cargar los datos de historial.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session.token]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData(true);
  };

  const handleToggleBids = async (subastaId) => {
    if (expandedId === subastaId) { setExpandedId(null); return; }
    setExpandedId(subastaId);
    if (bidsMap[subastaId]) return;
    setBidsMap(prev => ({ ...prev, [subastaId]: 'loading' }));
    try {
      const data = await getAuctionBids(session.token, subastaId);
      setBidsMap(prev => ({ ...prev, [subastaId]: data || [] }));
    } catch {
      setBidsMap(prev => ({ ...prev, [subastaId]: [] }));
    }
  };

  const renderStatsCard = () => {
    if (!stats) return null;

    const fmtImporte = (val) =>
      val != null ? `$${Number(val).toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : '$0';

    return (
      <Surface style={styles.statsContainer} elevation={1}>
        <View style={styles.statsRow}>
          <View style={styles.statColumn}>
            <View style={styles.statIconWrapper}>
              <Icon source="gavel" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.subastasParticipadas}</Text>
            <Text style={styles.statLabel}>Subastas</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.statColumn}>
            <View style={styles.statIconWrapper}>
              <Icon source="currency-usd" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.pujasRealizadas}</Text>
            <Text style={styles.statLabel}>Pujas</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.statColumn}>
            <View style={styles.statIconWrapper}>
              <Icon source="trophy-outline" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.articulosGanados}</Text>
            <Text style={styles.statLabel}>Ganados</Text>
          </View>
        </View>

        <View style={styles.statsDivider} />

        <View style={styles.statsRow}>
          <View style={styles.statColumn}>
            <View style={styles.statIconWrapper}>
              <Icon source="swap-vertical" size={24} color={COLORS.primary} />
            </View>
            <Text style={[styles.statNumber, styles.statNumberSm]}>
              {fmtImporte(stats.importeTotalOfertado)}
            </Text>
            <Text style={styles.statLabel}>Total ofertado</Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.statColumn}>
            <View style={styles.statIconWrapper}>
              <Icon source="cash-check" size={24} color={COLORS.primary} />
            </View>
            <Text style={[styles.statNumber, styles.statNumberSm]}>
              {fmtImporte(stats.importeTotalPagado)}
            </Text>
            <Text style={styles.statLabel}>Total pagado</Text>
          </View>
        </View>
      </Surface>
    );
  };

  const renderActivityItem = ({ item }) => {
    let categoryBg = COLORS.primaryContainer;
    let categoryText = COLORS.onPrimaryContainer;
    const cat = item.categoria?.toLowerCase() || '';
    if (cat === 'oro') { categoryBg = '#F59E0B22'; categoryText = '#F59E0B'; }
    else if (cat === 'platino') { categoryBg = '#A855F722'; categoryText = '#A855F7'; }

    const isCerrada = item.estado?.toLowerCase() === 'cerrada' || item.estado?.toLowerCase() === 'finalizado';
    const isExpanded = expandedId === item.id;
    const bids = bidsMap[item.id];

    return (
      <Surface style={styles.card} elevation={0}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardTitle}>Subasta #{item.id}</Text>
            <Text style={styles.cardSubtitle}>
              {item.fecha || 'Sin fecha'} — {item.ubicacion || 'Online'}
            </Text>
          </View>
          <Chip
            style={[styles.chip, { backgroundColor: categoryBg }]}
            textStyle={[styles.chipText, { color: categoryText }]}
            compact
          >
            {item.categoria?.toUpperCase() || 'COMUN'}
          </Chip>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.pujaBlock}>
            <Text style={styles.pujaLabel}>Tu mayor oferta:</Text>
            <Text style={styles.pujaValue}>
              {item.ultimaPuja ? `$${Number(item.ultimaPuja).toLocaleString('es-AR')}` : '—'}
            </Text>
          </View>

          <Chip
            style={[styles.statusChip, { backgroundColor: isCerrada ? COLORS.surfaceContainerHigh : '#10B98122' }]}
            textStyle={{ color: isCerrada ? COLORS.onSurfaceVariant : '#10B981', fontSize: 11, fontWeight: '600' }}
            compact
          >
            {isCerrada ? 'Finalizada' : 'Activa'}
          </Chip>
        </View>

        {/* Toggle historial de pujas */}
        <TouchableOpacity style={styles.toggleBids} onPress={() => handleToggleBids(item.id)}>
          <Icon source={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.primary} />
          <Text style={styles.toggleBidsText}>
            {isExpanded ? 'Ocultar pujas' : 'Ver historial de pujas'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.bidsContainer}>
            {bids === 'loading' ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 8 }} />
            ) : bids && bids.length > 0 ? (
              bids.map((puja, idx) => (
                <View key={puja.identificador ?? idx} style={styles.bidRow}>
                  <Text style={styles.bidIdx}>#{idx + 1}</Text>
                  <Text style={styles.bidImporte}>
                    ${Number(puja.importe).toLocaleString('es-AR')}
                  </Text>
                  {puja.ganador === 'si' && (
                    <Icon source="trophy" size={14} color="#F59E0B" />
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.bidsEmpty}>Sin pujas registradas</Text>
            )}
          </View>
        )}
      </Surface>
    );
  };

  const renderWonItem = ({ item }) => {
    const hasPhoto = item.fotos && item.fotos.length > 0;
    const isEntregaConfirmada = !!item.direccionEnvio || item.tipoEntrega === 'retiro';

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('DetalleCompra', { compraId: item.id })}
      >
        <Surface style={[styles.card, styles.interactiveCard]} elevation={0}>
          <View style={styles.wonRow}>
            {hasPhoto ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${item.fotos[0]}` }}
                style={styles.wonImage}
              />
            ) : (
              <View style={styles.wonImagePlaceholder}>
                <Icon source="package-variant-closed" size={26} color={COLORS.onSurfaceVariant} />
              </View>
            )}

            <View style={styles.wonInfo}>
              <Text style={styles.wonTitle} numberOfLines={2}>
                {item.descripcion || 'Lote Adjudicado'}
              </Text>
              <Text style={styles.wonPrice}>
                Total: <Text style={{ color: COLORS.primary, fontWeight: '700' }}>${item.importe}</Text>
              </Text>
              
              <View style={styles.confirmStatusBlock}>
                <Icon
                  source={isEntregaConfirmada ? 'check-circle-outline' : 'clock-alert-outline'}
                  size={14}
                  color={isEntregaConfirmada ? '#10B981' : '#F59E0B'}
                />
                <Text
                  style={[
                    styles.confirmStatusText,
                    { color: isEntregaConfirmada ? '#10B981' : '#F59E0B' },
                  ]}
                >
                  {isEntregaConfirmada ? 'Entrega confirmada' : 'Confirmar entrega y pago'}
                </Text>
              </View>
            </View>

            <Icon source="chevron-right" size={20} color={COLORS.onSurfaceVariant} />
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => {
    const isWon = activeTab === 'won';
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrapper}>
          <Icon
            source={isWon ? 'trophy-broken' : 'gavel'}
            size={40}
            color={COLORS.onSurfaceVariant}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {isWon ? 'Sin artículos ganados' : 'Sin participaciones'}
        </Text>
        <Text style={styles.emptyDesc}>
          {isWon
            ? 'Todavía no ganaste ningún artículo. ¡Seguí participando en las subastas activas!'
            : 'Aún no realizaste ofertas en ninguna sala de subastas.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <View style={styles.container}>
        {/* Cabecera */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onSurface}
            size={22}
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.title}>Historial y Estadísticas</Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando tu historial...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorWrapper}>
            <Icon source="alert-circle-outline" size={48} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={() => loadAllData()} style={styles.retryBtn}>
              Reintentar
            </Button>
          </View>
        ) : (
          <FlatList
            data={activeTab === 'activity' ? history : purchases}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                {/* Estadísticas */}
                {renderStatsCard()}

                {/* Tabs */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === 'activity' && styles.tabActive,
                    ]}
                    onPress={() => setActiveTab('activity')}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === 'activity' && styles.tabTextActive,
                      ]}
                    >
                      Mi Actividad
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tab,
                      activeTab === 'won' && styles.tabActive,
                    ]}
                    onPress={() => setActiveTab('won')}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === 'won' && styles.tabTextActive,
                      ]}
                    >
                      Adjudicaciones
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
            renderItem={activeTab === 'activity' ? renderActivityItem : renderWonItem}
            ListEmptyComponent={renderEmptyComponent}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: { marginLeft: -8 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onBackground,
    flex: 1,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 14,
  },
  errorWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    borderRadius: 99,
    backgroundColor: COLORS.primaryContainer,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  listContent: {
    paddingBottom: 32,
  },

  // Stats Card
  statsContainer: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  statIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(164,201,254,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.5,
  },
  statsDivider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.3,
    marginVertical: 16,
    marginHorizontal: 20,
  },
  statNumberSm: { fontSize: 15 },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.onSurfaceVariant,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Cards
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    gap: 12,
  },
  interactiveCard: {
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: COLORS.surfaceContainerLow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleBlock: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  chip: {
    borderRadius: 99,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 10,
  },
  pujaBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pujaLabel: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  pujaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusChip: {
    borderRadius: 99,
  },

  // Won items layout
  wonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wonImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  wonImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wonInfo: {
    flex: 1,
    gap: 4,
  },
  wonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    lineHeight: 18,
  },
  wonPrice: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  confirmStatusBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  confirmStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Historial de pujas expandible
  toggleBids: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  toggleBidsText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  bidsContainer: {
    marginTop: 8,
    gap: 6,
  },
  bidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  bidIdx: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    width: 24,
  },
  bidImporte: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
    flex: 1,
  },
  bidsEmpty: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
    paddingVertical: 4,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 99,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  emptyDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
});
