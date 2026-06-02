import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Avatar,
  Badge,
  Button,
  Chip,
  Icon,
  IconButton,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';

import { useAppSession } from '../../navigation/AppSessionContext';
import { getMyProfile } from '../../services/userApi';
import { getPaymentMethods } from '../../services/paymentApi';
import { COLORS } from '../../theme/colors';

const MENU_ITEMS = [
  { key: 'payments',   icon: 'credit-card-outline',  label: 'Medios de Pago',        route: 'PaymentMethods',  params: { isOnboarding: false } },
  { key: 'personal',   icon: 'account-outline',       label: 'Datos Personales',       route: 'EditProfile' },
  { key: 'history',    icon: 'history',               label: 'Historial de Subastas',  route: 'AuctionHistory',  params: { title: 'Historial de Subastas', icon: 'history' } },
  { key: 'penalty',    icon: 'alert-circle-outline',  label: 'Penalizaciones',         route: 'Penalizaciones',  params: { title: 'Penalizaciones', icon: 'alert-circle-outline' } },
  { key: 'notifs',     icon: 'bell-outline',          label: 'Notificaciones',         route: 'Notificaciones',  params: { title: 'Notificaciones', icon: 'bell-outline' } },
  { key: 'appearance', icon: 'theme-light-dark',      label: 'Apariencia',             route: 'Apariencia',      params: { title: 'Apariencia', icon: 'theme-light-dark' } },
];

export default function HomePerfilScreen({ navigation }) {
  const theme = useTheme();
  const { session, exitApp, unreadNotificationsCount, pollingError } = useAppSession();

  const isGuest = session.entryMode === 'guest' || session.entryMode === 'pending-register';
  const isPendingRegister = session.entryMode === 'pending-register';
  const hasToken = !!session.token;

  const [userProfile, setUserProfile] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(!isGuest);

  const loadData = useCallback(async () => {
    if (!hasToken) return;
    try {
      const [profile, methods] = await Promise.all([
        getMyProfile(session.token),
        getPaymentMethods(session.token).catch(() => []),
      ]);
      setUserProfile(profile);
      setPaymentMethods(Array.isArray(methods) ? methods : []);
    } catch {
      // silent — profile stays null, shows fallback
    } finally {
      setLoading(false);
    }
  }, [session.token, hasToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (hasToken) loadData();
    });
    return unsubscribe;
  }, [navigation, hasToken, loadData]);

  const displayName = isGuest
    ? 'Usuario invitado'
    : userProfile
      ? `${userProfile.nombre ?? ''} ${userProfile.apellido ?? ''}`.trim() || 'Sin nombre'
      : '—';

  const displayEmail    = isGuest ? 'Invitado' : (userProfile?.email    ?? '—');
  const displayCategoria = isGuest ? 'Invitado' : (userProfile?.categoria?.toUpperCase() ?? '—');
  const isPending       = !isGuest && userProfile && userProfile.estado !== 'activo';
  const showPaymentBanner = !isGuest && hasToken && paymentMethods.length === 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Perfil</Text>
            <View style={styles.bellWrap}>
              <IconButton
                icon="bell-outline"
                iconColor={COLORS.primary}
                size={24}
                style={styles.bellButton}
                onPress={() => navigation.navigate('Notificaciones')}
              />
              <Badge
                visible={unreadNotificationsCount > 0}
                size={16}
                style={styles.bellBadge}
              >
                {unreadNotificationsCount}
              </Badge>
            </View>
          </View>

          {/* User card */}
          {loading ? (
            <Surface style={[styles.userCard, styles.loadingCard]} elevation={0}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </Surface>
          ) : (
            <Surface style={styles.userCard} elevation={0}>
              <View style={styles.userCardRow}>
                <Avatar.Icon
                  icon="account"
                  size={58}
                  style={{ backgroundColor: COLORS.surfaceContainerHigh }}
                  color={COLORS.onSurface}
                />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{displayName}</Text>
                  <Text style={styles.userEmail}>{displayEmail}</Text>
                  <Chip style={styles.categoryChip} textStyle={styles.categoryChipText} compact>
                    {displayCategoria}
                  </Chip>
                </View>
              </View>
            </Surface>
          )}

          {/* Pending registration banner (user awaiting approval, entered as pending-register guest) */}
          {isPendingRegister ? (
            <Surface style={styles.pendingRegisterCard} elevation={0}>
              <Icon source="clock-outline" size={22} color={COLORS.onSurfaceVariant} />
              <View style={styles.pendingTextBlock}>
                <Text style={styles.pendingTitle}>Registro en revisión</Text>
                <Text style={styles.pendingDesc}>
                  Estamos verificando tus datos. Te notificaremos aquí cuando tu cuenta sea aprobada.
                </Text>
                {pollingError ? (
                  <Text style={styles.pollingErrorText}>{pollingError}</Text>
                ) : null}
              </View>
            </Surface>
          ) : null}

          {/* Pending validation card (authenticated user still waiting) */}
          {isPending ? (
            <Surface style={styles.pendingCard} elevation={0}>
              <Icon source="clock-outline" size={22} color={COLORS.primary} />
              <View style={styles.pendingTextBlock}>
                <Text style={styles.pendingTitle}>Pendiente de aprobación</Text>
                <Text style={styles.pendingDesc}>
                  Tu cuenta está pendiente de aprobación. Nuestro equipo está verificando tus datos. Te notificaremos por mail cuando puedas continuar.
                </Text>
              </View>
            </Surface>
          ) : null}

          {/* Payment methods pending banner */}
          {showPaymentBanner ? (
            <Surface style={styles.paymentBanner} elevation={0}>
              <View style={styles.paymentBannerRow}>
                <Icon source="credit-card-outline" size={22} color={COLORS.primary} />
                <View style={styles.paymentBannerText}>
                  <Text style={styles.paymentBannerTitle}>Medio de Pago</Text>
                  <Text style={styles.paymentBannerDesc}>
                    Es necesario agregar al menos un método de pago para participar de subastas.
                  </Text>
                </View>
              </View>
              <Button
                mode="contained"
                compact
                onPress={() => navigation.navigate('PaymentMethods', { isOnboarding: false })}
                style={styles.paymentBannerButton}
                labelStyle={styles.paymentBannerButtonLabel}
              >
                Agregar
              </Button>
            </Surface>
          ) : null}

          {/* General section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>General</Text>
          </View>

          <View style={styles.menuList}>
            {MENU_ITEMS.map((item) => (
              <MenuItem
                key={item.key}
                icon={item.icon}
                label={item.label}
                disabled={item.key === 'notifs' ? session.entryMode === 'guest' : isGuest}
                onPress={() =>
                  navigation.navigate(item.route, {
                    ...(item.params ?? {}),
                    ...(item.key === 'personal' && userProfile ? { profile: userProfile } : {}),
                  })
                }
              />
            ))}
          </View>

          {/* Logout */}
          <Button
            mode="contained-tonal"
            onPress={exitApp}
            style={[styles.logoutButton, { backgroundColor: theme.colors.surfaceContainerLow }]}
            contentStyle={styles.logoutContent}
            labelStyle={[styles.logoutLabel, { color: theme.colors.onSurface }]}
          >
            Cerrar sesión
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, onPress, disabled }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={() => !disabled && setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={disabled ? styles.menuItemDisabled : undefined}
    >
      <Surface style={[styles.menuItem, pressed && { backgroundColor: COLORS.surfaceContainerLow }]} elevation={0}>
        <View style={styles.menuIconBox}>
          <Icon source={icon} size={22} color={COLORS.primary} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        <Icon source="chevron-right" size={20} color={COLORS.onSurfaceVariant} />
      </Surface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flexGrow: 1 },
  container: { flex: 1, paddingTop: 64, paddingHorizontal: 20, paddingBottom: 24 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '700', color: COLORS.onBackground, letterSpacing: 0.2 },
  bellButton: { margin: 0 },
  bellWrap: { position: 'relative' },
  bellBadge: { position: 'absolute', top: 2, right: 2 },

  pendingRegisterCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 18, borderWidth: 1, borderColor: COLORS.outlineVariant,
    padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16,
  },
  pollingErrorText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.error ?? '#B3261E',
  },

  userCard: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 20, padding: 18, marginBottom: 16 },
  loadingCard: { alignItems: 'center', justifyContent: 'center', minHeight: 90 },
  userCardRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 20, fontWeight: '600', color: COLORS.onSurface, lineHeight: 26 },
  userEmail: { fontSize: 14, color: COLORS.onSurfaceVariant, lineHeight: 20 },
  categoryChip: { backgroundColor: COLORS.primaryContainer, alignSelf: 'flex-start', borderRadius: 999, marginTop: 4 },
  categoryChipText: { color: COLORS.onPrimaryContainer, fontSize: 12, fontWeight: '500' },

  pendingCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 18, borderWidth: 1, borderColor: COLORS.primary,
    padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16,
  },
  pendingTextBlock: { flex: 1 },
  pendingTitle: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface, marginBottom: 4 },
  pendingDesc: { fontSize: 13, lineHeight: 19, color: COLORS.onSurfaceVariant },

  paymentBanner: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 18, borderWidth: 1, borderColor: COLORS.outlineVariant,
    padding: 16, marginBottom: 16, gap: 14,
  },
  paymentBannerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  paymentBannerText: { flex: 1 },
  paymentBannerTitle: { fontSize: 16, fontWeight: '600', color: COLORS.onSurface, marginBottom: 4 },
  paymentBannerDesc: { fontSize: 13, lineHeight: 19, color: COLORS.onSurfaceVariant },
  paymentBannerButton: { borderRadius: 999, alignSelf: 'flex-start', backgroundColor: COLORS.primary },
  paymentBannerButtonLabel: { color: COLORS.onPrimary, fontSize: 14, fontWeight: '600' },

  sectionHeader: { marginBottom: 14, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.primary, letterSpacing: 0.1 },

  menuList: { gap: 0, marginBottom: 24 },
  menuItem: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  menuItemDisabled: { opacity: 0.45 },
  menuIconBox: {
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '500', color: COLORS.onSurface },

  logoutButton: { borderRadius: 999 },
  logoutContent: { minHeight: 50 },
  logoutLabel: { fontSize: 15, fontWeight: '500' },
});
