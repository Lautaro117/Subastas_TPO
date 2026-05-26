import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Chip, FAB, Text, useTheme } from 'react-native-paper';

import { useAppSession } from '../../navigation/AppSessionContext';
import { getMisProductos } from '../../services/itemsApi';

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
    <Chip
      style={[styles.chip, { backgroundColor: color + '22' }]}
      textStyle={[styles.chipText, { color }]}
    >
      {label}
    </Chip>
  );
}

function ProductoCard({ item }) {
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
    <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerLow }]}>
      <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
        {item.descripcionCatalogo}
      </Text>
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
          <Text style={[styles.infoValue, { color: theme.colors.primary }]}>
            ${item.precioPropuesto}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function CompraCard({ item }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerLow }]}>
      <Text style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
        {item.descripcionCatalogo || `Ítem #${item.itemId}`}
      </Text>
      <Text style={[styles.cardDesc, { color: theme.colors.onSurfaceVariant }]}>
        Importe: ${item.importe}
      </Text>
    </View>
  );
}

export default function HomeProductosScreen() {
  const theme = useTheme();
  const { session } = useAppSession();
  const [activeTab, setActiveTab] = useState('publicados');
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarProductos = useCallback(async () => {
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

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const tabs = [
    { key: 'publicados', label: 'Productos publicados' },
    { key: 'compras', label: 'Mis compras' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>Productos</Text>

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

        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : error ? (
          <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
        ) : activeTab === 'publicados' ? (
          <FlatList
            data={productos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <ProductoCard item={item} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}>
              No hay compras registradas
            </Text>
          </View>
        )}
      </View>

      {activeTab === 'publicados' ? (
        <FAB
          icon="plus"
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color={theme.colors.onPrimary}
          onPress={() => {}}
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
  card: { borderRadius: 12, padding: 16, gap: 8,borderWidth: 2, borderColor: 'rgba(255, 255, 255, 0.64)'},
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
});