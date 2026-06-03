import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Chip, FAB, Icon, Text, useTheme } from 'react-native-paper';

import { useAppSession } from '../../navigation/AppSessionContext';
import { getMisProductos, getMisCompras } from '../../services/itemsApi';

const ESTADO_LABEL = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

const PROPUESTA_LABEL = {
  propuesta_enviada: 'Propuesta recibida',
  propuesta_aceptada: 'Propuesta aceptada',
  propuesta_rechazada: 'Propuesta rechazada',
};

function EstadoChip({ label, color }) {
  return (
    <Chip style={[styles.chip, { backgroundColor: color + '22' }]} textStyle={[styles.chipText, { color }]}>
      {label}
    </Chip>
  );
}

function ProductoCard({ item, onPress }) {
  const theme = useTheme();

  const estadoColor = {
    pendiente: theme.colors.onSurfaceVariant,
    aprobado: '#4CAF50',
    rechazado: theme.colors.error,
  }[item.estadoAdmin] || theme.colors.onSurfaceVariant;

  const propuestaColor = {
    propuesta_enviada: '#FFA726',
    propuesta_aceptada: '#4CAF50',
    propuesta_rechazada: theme.colors.error,
  }[item.estadoPropuesta];

  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerLow }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>{item.descripcionCatalogo}</Text>
        <Text style={[styles.cardDesc, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>
          {item.descripcionCompleta}
        </Text>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Revisión:</Text>
          <Text style={[styles.infoValue, { color: estadoColor }]}>
            {ESTADO_LABEL[item.estadoAdmin] || item.estadoAdmin}
          </Text>
        </View>
        {item.estadoPropuesta ? (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Propuesta:</Text>
            <Text style={[styles.infoValue, { color: propuestaColor }]}>
              {PROPUESTA_LABEL[item.estadoPropuesta] || item.estadoPropuesta}
            </Text>
          </View>
        ) : null}
        {item.precioPropuesto ? (
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Precio propuesto:</Text>
            <Text style={[styles.infoValue, { color: theme.colors.primary }]}>${item.precioPropuesto}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function CompraCard({ item, onPress }) {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={onPress}>
    <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerLow }]}>
      <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
        {item.descripcion || `Ítem #${item.itemId}`}
      </Text>
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Importe:</Text>
        <Text style={[styles.infoValue, { color: theme.colors.primary }]}>${item.importe}</Text>
      </View>
      <View style={styles.infoRow}> 
        <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Comisión:</Text>
        <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>${item.comision}</Text>
      </View>
      {item.direccionEnvio ? (
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>Envío:</Text>
          <Text style={[styles.infoValue, { color: theme.colors.onSurface }]}>{item.direccionEnvio}</Text>
        </View>
      ) : null}
    </View>
    </TouchableOpacity>
  );
}

export default function HomeProductosScreen({ navigation }) {
  const theme = useTheme();
  const { session } = useAppSession();

  const isPendingRegister = session.entryMode === 'pending-register';
  const isGuest = session.entryMode === 'guest' || isPendingRegister;

  const [activeTab, setActiveTab] = useState('publicados');
  const [productos, setProductos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(!isGuest);
  const [loadingCompras, setLoadingCompras] = useState(false);
  const [error, setError] = useState('');

  const cargarProductos = useCallback(async () => {
    if (isGuest) return;
    setLoading(true);
    setError('');
    try {
      const data = await getMisProductos(session.token);
      setProductos(data || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [session.token]);

  const cargarCompras = useCallback(async () => {
    setLoadingCompras(true);
    try {
      const data = await getMisCompras(session.token);
      setCompras(data || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las compras');
    } finally {
      setLoadingCompras(false);
    }
  }, [session.token]);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', cargarProductos);
    return unsub;
  }, [navigation, cargarProductos]);

  useEffect(() => {
    if (activeTab === 'compras') cargarCompras();
  }, [activeTab, cargarCompras]);

  const tabs = [
    { key: 'publicados', label: 'Productos publicados' },
    { key: 'compras', label: 'Mis compras' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>Productos</Text>

        {/* Guest / pending-register access block */}
        {isGuest ? (
          <View style={styles.guestBlock}>
            <Icon
              source={isPendingRegister ? 'clock-outline' : 'lock-outline'}
              size={48}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={[styles.guestTitle, { color: theme.colors.onSurface }]}>
              {isPendingRegister ? 'Cuenta en revisión' : 'Sección exclusiva'}
            </Text>
            <Text style={[styles.guestDesc, { color: theme.colors.onSurfaceVariant }]}>
              {isPendingRegister
                ? 'Una vez que tu cuenta sea aprobada podrás publicar y gestionar tus productos.'
                : 'Iniciá sesión para ver y gestionar tus productos.'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.tabRow}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[
                      styles.tab,
                      isActive
                        ? { backgroundColor: theme.colors.primary }
                        : { backgroundColor: theme.colors.surfaceContainerLow },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        { color: isActive ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {activeTab === 'publicados' ? (
              loading ? (
                <ActivityIndicator style={styles.loader} />
              ) : error ? (
                <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
              ) : productos.length === 0 ? (
                <View style={styles.placeholder}>
                  <Text style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}>
                    No tenés productos publicados
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={productos}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <ProductoCard
                      item={item}
                      onPress={() => navigation.navigate('DetalleProducto', { productoId: item.id })}
                    />
                  )}
                  contentContainerStyle={styles.list}
                  showsVerticalScrollIndicator={false}
                />
              )
            ) : loadingCompras ? (
              <ActivityIndicator style={styles.loader} />
            ) : compras.length === 0 ? (
              <View style={styles.placeholder}>
                <Text style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}>
                  No hay compras registradas
                </Text>
              </View>
            ) : (
              <FlatList
                data={compras}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <CompraCard
                    item={item}
                    onPress={() => navigation.navigate('DetalleCompra', { compraId: item.id })}
                  />
                )}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>

      {activeTab === 'publicados' && !isGuest ? (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => navigation.navigate('AgregarProducto')}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 16 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' },
  loader: { marginTop: 40 },
  error: { marginTop: 20, fontSize: 14 },
  list: { gap: 12, paddingBottom: 100 },
  card: { borderRadius: 12, padding: 16, gap: 8, borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.64)' },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '500' },
  fab: { position: 'absolute', right: 24, bottom: 24 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 13, fontWeight: '600' },
  guestBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 16, paddingBottom: 60 },
  guestTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  guestDesc: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
});