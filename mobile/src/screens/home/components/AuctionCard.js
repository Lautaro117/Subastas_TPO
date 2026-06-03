import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Chip, Surface, Text, useTheme } from 'react-native-paper';

const CATEGORIA_LABEL = {
  comun: 'Común',
  especial: 'Especial',
  plata: 'Plata',
  oro: 'Oro',
  platino: 'Platino',
};

const ESTADO_LABEL = {
  abierta: 'En curso',
  proxima: 'Próxima',
  cerrada: 'Finalizada',
};

export default function AuctionCard({ item, onPress }) {
  const theme = useTheme();

  const categoriaLabel = CATEGORIA_LABEL[item.categoria] || item.categoria;
  const estadoLabel = ESTADO_LABEL[item.estado] || item.estado;

  // Formatear fecha: "2026-06-13" → "13/06/2026"
  const fechaFormateada = item.fecha
    ? item.fecha.split('-').reverse().join('/')
    : null;

  // Formatear hora: "10:14:00" → "10:14"
  const horaFormateada = item.hora ? item.hora.slice(0, 5) : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Surface
        elevation={0}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surfaceContainerLowest,
            borderColor: theme.colors.outline,
          },
        ]}
      >
        {/* Ubicación como título */}
        <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
          {item.ubicacion || `Subasta #${item.identificador}`}
        </Text>

        {/* Fecha y hora */}
        {fechaFormateada && (
          <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            {fechaFormateada}{horaFormateada ? `  ·  ${horaFormateada} hs` : ''}
          </Text>
        )}

        {/* Chips: categoría + estado */}
        <View style={styles.chipsRow}>
          <Chip
            compact
            style={[styles.chip, { backgroundColor: theme.colors.secondaryContainer }]}
            textStyle={[styles.chipText, { color: theme.colors.onSecondaryContainer }]}
          >
            {categoriaLabel}
          </Chip>
          <Chip
            compact
            style={[styles.chip, { backgroundColor: theme.colors.secondaryContainer }]}
            textStyle={[styles.chipText, { color: theme.colors.onSecondaryContainer }]}
          >
            {estadoLabel}
          </Chip>
        </View>
      </Surface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '600', lineHeight: 24, marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999 },
  chipText: { fontSize: 12, lineHeight: 16 },
});