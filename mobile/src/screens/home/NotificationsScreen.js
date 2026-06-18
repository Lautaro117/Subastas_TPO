import React, { useEffect, useMemo } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, IconButton, Surface, Text } from 'react-native-paper';

import { useAppSession } from '../../navigation/AppSessionContext';
import { COLORS } from '../../theme/colors';

// ─── Formateo de fecha ────────────────────────────────────────────────────────
// El backend envía LocalDateTime sin zona horaria (ej: "2026-06-18T15:30:00").
// Añadimos 'Z' para que JS lo interprete como UTC, y lo mostramos en hora de Argentina.
function formatTimestamp(isoString) {
  if (!isoString) return '';
  const normalized = /[Z+\-]\d{2}:?\d{2}$/.test(isoString) ? isoString : isoString + 'Z';
  const date = new Date(normalized);
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

// ─── Ícono por tipo ───────────────────────────────────────────────────────────
function iconForTipo(tipo) {
  switch (tipo) {
    case 'ganador_item':      return { source: 'trophy-outline',      color: '#f59e0b' };
    case 'campanita_item':    return { source: 'bell-ring-outline',    color: COLORS.primary };
    case 'registro_aprobado': return { source: 'check-circle-outline', color: '#22c55e' };
    default:                  return { source: 'bell-outline',         color: COLORS.onSurfaceVariant };
  }
}

// ─── Ítem individual ──────────────────────────────────────────────────────────
function NotificationItem({ item, onPress, onFinishRegistration }) {
  const { source, color } = iconForTipo(item.tipo);
  const isApproval = item.tipo === 'registro_aprobado';

  return (
    <TouchableOpacity activeOpacity={item.leida ? 1 : 0.75} onPress={item.leida ? undefined : onPress}>
      <Surface style={[styles.item, item.leida && styles.itemRead]} elevation={0}>
        <View style={[styles.itemIconBox, { backgroundColor: color + '22' }]}>
          <Icon source={source} size={22} color={color} />
        </View>
        <View style={styles.itemBody}>
          <Text style={[styles.itemMessage, item.leida && styles.itemMessageRead]}>
            {item.mensaje}
          </Text>
          <Text style={styles.itemTime}>{formatTimestamp(item.createdAt)}</Text>
          {isApproval ? (
            <Button
              mode="contained"
              compact
              onPress={onFinishRegistration}
              style={styles.finishButton}
              labelStyle={styles.finishLabel}
            >
              Finalizar registro
            </Button>
          ) : null}
        </View>
        {!item.leida ? <View style={styles.unreadDot} /> : null}
      </Surface>
    </TouchableOpacity>
  );
}

// ─── Pantalla ──────────────────────────────────────────────────────────────────
export default function NotificationsScreen({ navigation }) {
  const {
    localNotifications,
    apiNotifications,
    markLocalNotificationRead,
    markApiNotificationRead,
    refreshApiNotifications,
    initiateRegistrationCompletion,
  } = useAppSession();

  // Refrescar del backend al abrir la pantalla (sin marcar como leídas)
  useEffect(() => {
    refreshApiNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Unir y ordenar por fecha descendente
  const allNotifications = useMemo(() => {
    const combined = [...apiNotifications, ...localNotifications];
    return combined.sort((a, b) => {
      const dateA = new Date(a.createdAt ?? 0).getTime();
      const dateB = new Date(b.createdAt ?? 0).getTime();
      return dateB - dateA;
    });
  }, [apiNotifications, localNotifications]);

  function handlePressNotification(item) {
    if (item.leida) return;
    if (item.tipo === 'registro_aprobado' || item.id?.toString().startsWith('local-') || item.id?.toString().startsWith('approval-')) {
      // Notificación local
      markLocalNotificationRead(item.id);
    } else {
      // Notificación del backend
      markApiNotificationRead(item.id);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            iconColor={COLORS.onSurface}
            size={22}
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.title}>Notificaciones</Text>
        </View>

        <FlatList
          data={allNotifications}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onPress={() => handlePressNotification(item)}
              onFinishRegistration={initiateRegistrationCompletion}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon source="bell-off-outline" size={40} color={COLORS.onSurfaceVariant} />
              <Text style={styles.emptyText}>No tenés notificaciones</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingTop: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  backButton: { margin: 0 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onBackground,
    marginLeft: 4,
  },

  listContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 24 },

  item: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  itemRead: { opacity: 0.5 },
  itemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: { flex: 1, gap: 4 },
  itemMessage: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.onSurface,
    lineHeight: 21,
  },
  itemMessageRead: { fontWeight: '400' },
  itemTime: { fontSize: 12, color: COLORS.onSurfaceVariant },

  finishButton: {
    marginTop: 10,
    borderRadius: 999,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
  },
  finishLabel: { color: COLORS.onPrimary, fontSize: 13, fontWeight: '600' },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: { fontSize: 16, color: COLORS.onSurfaceVariant },
});
