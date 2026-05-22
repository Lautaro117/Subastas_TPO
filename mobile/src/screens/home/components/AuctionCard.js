import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Surface, Text, useTheme } from 'react-native-paper';

export default function AuctionCard({ item }) {
  const theme = useTheme();

  return (
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
      <Text style={[styles.title, { color: theme.colors.onSurface }]} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.chipsRow}>
        {item.tags.map((tag) => (
          <Chip
            key={`${item.id}-${tag}`}
            compact
            style={[styles.chip, { backgroundColor: theme.colors.secondaryContainer }]}
            textStyle={[styles.chipText, { color: theme.colors.onSecondaryContainer }]}
          >
            {tag}
          </Chip>
        ))}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
