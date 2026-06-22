import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Avatar,
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
import { refreshToken } from '../../services/authApi';
import { leaveAllAuctions } from '../../services/auctionsApi';
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
const { session, exitApp, setAuthToken, localNotifications, markLocalNotificationRead, initiateRegistrationCompletion, unreadNotificationsCount } = useAppSession();
  const isGuest = session.entryMode === 'guest-login' || session.entryMode === 'guest-register';
  const hasToken = !!session.token;

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(!isGuest);
  const [leavingAll, setLeavingAll] = useState(false);

  const lastFetchRef = useRef(null);
  const CACHE_TTL = 30000; // 30 segundos

  // Refs para que los callbacks lean siempre el valor más fresco sin necesitar esos
  // valores como dependencias del useCallback (así evitamos loops de re-creación).
  const sessionTokenRef = useRef(session.token);
  const setAuthTokenRef = useRef(setAuthToken);
  sessionTokenRef.current = session.token;
  setAuthTokenRef.current = setAuthToken;

  const loadData = useCallback(async (force = false) => {
    const tok = sessionTokenRef.current;
    if (!tok) return;
    const now = Date.now();
    if (!force && lastFetchRef.current && now - lastFetchRef.current < CACHE_TTL) return;
    lastFetchRef.current = now;
    try {
      const profile = await getMyProfile(tok);
      setUserProfile(profile);
    } catch {
      // silent — profile stays null, shows fallback
    } finally {
      setLoading(false);
    }
  }, []); // deps vacíos: lee token vía ref, no necesita recrearse cuando el token cambia

  // Refresca el token al montar la pantalla para obtener el estado actualizado (E2→E3→E4).
  // IMPORTANTE: deps vacíos a propósito. Si session.token o setAuthToken fueran deps aquí,
  // cada llamada exitosa al /refresh devolvería un JWT nuevo (siempre distinto porque incluye
  // un nuevo `iat`), lo que cambiaría session.token, lo que recrearía este callback, lo que
  // dispararía de nuevo el useEffect, lo que llamaría /refresh otra vez — loop infinito a la
  // tasa de la latencia de red (~1s contra Render), causando el spinner constante en TODAS
  // las pantallas que usan session.token como dep (PaymentMethods, DetalleCompra, etc.).
  const handleRefreshToken = useCallback(async () => {
    const tok = sessionTokenRef.current;
    if (!tok) return;
    try {
      const response = await refreshToken(tok);
      if (response?.token && response.token !== tok) {
        await setAuthTokenRef.current(response.token);
      }
    } catch {
      // silent
    }
  }, []); // deps vacíos: lee token y setAuthToken vía refs

  useEffect(() => {
    loadData();
    handleRefreshToken();
  }, [loadData, handleRefreshToken]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
      handleRefreshToken();
    });
    return unsubscribe;
  }, [navigation, loadData, handleRefreshToken]);

  const displayName = isGuest
    ? 'Usuario invitado'
    : userProfile
      ? `${userProfile.nombre ?? ''} ${userProfile.apellido ?? ''}`.trim() || 'Sin nombre'
      : '—';

  const displayEmail     = isGuest ? 'Invitado' : (userProfile?.email     ?? '—');
  const displayCategoria = isGuest ? 'Invitado' : (userProfile?.categoria?.toUpperCase() ?? '—');
  const guestMessage = session.entryMode === 'guest-register'
    ? 'Tu cuenta está en solicitud de aprobación. En breve se te dará respuesta.'
    : 'Para visualizar esta sección tenés que iniciar sesión o registrarte en la aplicación.';
  const isPendingE1          = !isGuest && userProfile?.estado === 'E1';
  const showPaymentBanner    = !isGuest && hasToken && userProfile?.estado === 'E2';
  const showPaymentPending   = !isGuest && hasToken && userProfile?.estado === 'E3';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Perfil</Text>
            <IconButton icon="bell-outline" iconColor={COLORS.primary} size={24} 
              style={styles.bellButton} onPress={() => navigation.navigate('Notificaciones')} />
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

          {isGuest ? (
            <Surface style={styles.guestInfoCard} elevation={0}>
              <Icon source="information-outline" size={22} color={COLORS.primary} />
              <Text style={styles.guestInfoText}>{guestMessage}</Text>
            </Surface>
          ) : null}

          {/* E1 — cuenta pendiente de aprobación */}
          {isPendingE1 ? (
            <Surface style={styles.pendingCard} elevation={0}>
              <Icon source="clock-outline" size={22} color={COLORS.primary} />
              <View style={styles.pendingTextBlock}>
                <Text style={styles.pendingTitle}>Cuenta pendiente de aprobación</Text>
                <Text style={styles.pendingDesc}>
                  Nuestro equipo está verificando tus datos. Te notificaremos cuando puedas continuar.
                </Text>
              </View>
            </Surface>
          ) : null}

          {/* E2 — sin método de pago */}
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

          {/* E3 — método de pago pendiente de aprobación */}
          {showPaymentPending ? (
            <Surface style={styles.pendingCard} elevation={0}>
              <Icon source="clock-outline" size={22} color={COLORS.primary} />
              <View style={styles.pendingTextBlock}>
                <Text style={styles.pendingTitle}>Método de pago en revisión</Text>
                <Text style={styles.pendingDesc}>
                  Ya cargaste un método de pago. Nuestro equipo lo está verificando. Te notificaremos cuando sea aprobado.
                </Text>
              </View>
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
                disabled={isGuest}
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

  userCard: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 20, padding: 18, marginBottom: 16 },
  loadingCard: { alignItems: 'center', justifyContent: 'center', minHeight: 90 },
  userCardRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 20, fontWeight: '600', color: COLORS.onSurface, lineHeight: 26 },
  userEmail: { fontSize: 14, color: COLORS.onSurfaceVariant, lineHeight: 20 },
  categoryChip: { backgroundColor: COLORS.primaryContainer, alignSelf: 'flex-start', borderRadius: 999, marginTop: 4 },
  categoryChipText: { color: COLORS.onPrimaryContainer, fontSize: 12, fontWeight: '500' },

  guestInfoCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  guestInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.onSurfaceVariant,
  },

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

  pendingCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 18, borderWidth: 1, borderColor: COLORS.primary,
    padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16,
  },
  pendingTextBlock: { flex: 1 },
  pendingTitle: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface, marginBottom: 4 },
  pendingDesc: { fontSize: 13, lineHeight: 19, color: COLORS.onSurfaceVariant },

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