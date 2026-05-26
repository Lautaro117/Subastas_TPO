import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconButton, Text, useTheme } from 'react-native-paper';

import { COLORS } from '../../theme/colors';

export default function PlaceholderScreen({ navigation, route }) {
  const theme = useTheme();
  const { title = 'Próximamente', icon = 'clock-outline' } = route?.params ?? {};

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onSurface}
            size={22}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.centerContent}>
          <View style={styles.iconWrapper}>
            <Icon source={icon} size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.comingTitle}>Próximamente</Text>
          <Text style={styles.comingDesc}>
            Esta sección está en construcción. Estará disponible en una próxima actualización.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingTop: 64, paddingHorizontal: 20, paddingBottom: 24 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onBackground,
    letterSpacing: 0.2,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 16,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  comingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  comingDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
  },
});
