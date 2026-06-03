import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Icon, Surface, Text } from 'react-native-paper';

import { COLORS } from '../theme/colors';
import { useAppSession } from '../navigation/AppSessionContext';
import { getPaymentMethods, deletePaymentMethod } from '../services/paymentApi';

const PAYMENT_METHODS_OPTIONS = [
  { key: 'bank', icon: 'bank-outline', title: 'Cuenta bancaria', subtitle: 'CBU / IBAN nacional o internacional', route: 'AddBankAccount' },
  { key: 'card', icon: 'credit-card-outline', title: 'Tarjeta de crédito', subtitle: 'Nacional o internacional', route: 'AddCreditCard' },
  { key: 'check', icon: 'file-document-outline', title: 'Cheque certificado', subtitle: 'Garantía física para subastas', route: 'AddCertifiedCheck' },


















];

const TIPO_ICON = {
  cuenta_bancaria: 'bank-outline',
  tarjeta: 'credit-card-outline',
  cheque: 'file-document-outline',
};

const TIPO_LABEL = {
  cuenta_bancaria: 'Cuenta bancaria',
  tarjeta: 'Tarjeta de crédito',
  cheque: 'Cheque certificado',
};

function parseDatos(datos) {
  try { return typeof datos === 'string' ? JSON.parse(datos) : datos; }
  catch { return {}; }
}

function getSubtitle(method) {
  const d = parseDatos(method.datos);
  if (method.tipo === 'cuenta_bancaria') return d.nombre_banco ?? d.cbu_iban ?? '';
  if (method.tipo === 'tarjeta') return d.numero ?? '';
  if (method.tipo === 'cheque') return `$${d.monto ?? ''} — ${d.banco_emisor ?? ''}`;
  return '';
}

export default function PaymentMethodsScreen({ navigation, route }) {
  const { session, enterApp } = useAppSession();

  const isOnboarding = route?.params?.isOnboarding ?? false;
  const [activeTab, setActiveTab] = useState('mis');
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPaymentMethods(session.token);
      setMethods(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [session.token]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', cargar);
    return unsub;
  }, [navigation, cargar]);

  const handleEliminar = async (id) => {
    try {
      await deletePaymentMethod(id, session.token);
      setMethods(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSkip = () => {
    if (isOnboarding) enterApp('registered');
    else navigation.goBack();
  };

  const tabs = [
    { key: 'mis', label: 'Mis métodos' },
    { key: 'agregar', label: 'Agregar' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>



        <View style={styles.container}>
          <Text style={styles.title}>Métodos de pago</Text>

          <View style={styles.tabRow}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[styles.tab, isActive ? { backgroundColor: COLORS.primary } : { backgroundColor: COLORS.surfaceContainerLow }]}
                >
                  <Text style={[styles.tabText, { color: isActive ? COLORS.onPrimary : COLORS.onSurfaceVariant }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}


          </View>

          {activeTab === 'mis' ? (
            loading ? (
              <ActivityIndicator style={styles.loader} />
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : methods.length === 0 ? (
              <View style={styles.empty}>
                <Icon source="credit-card-off-outline" size={40} color={COLORS.onSurfaceVariant} />
                <Text style={styles.emptyText}>No tenés métodos de pago cargados</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {methods.map(method => (
                  <Pressable key={method.id} onPress={() => navigation.navigate('PaymentMethodDetalle', { method, onUpdate: cargar })}>
                    <Surface style={styles.card} elevation={0}>
                    <View style={styles.cardRow}>
                      <View style={styles.cardIcon}>
                        <Icon source={TIPO_ICON[method.tipo] ?? 'credit-card-outline'} size={24} color={COLORS.primary} />
                      </View>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle}>{TIPO_LABEL[method.tipo] ?? method.tipo}</Text>
                        <Text style={styles.cardSubtitle}>{getSubtitle(method)}</Text>
                        <View style={styles.badgeRow}>
                          <View style={[styles.badge, { backgroundColor: method.verificado ? '#4CAF5022' : '#FFA72622' }]}>
                            <Text style={[styles.badgeText, { color: method.verificado ? '#4CAF50' : '#FFA726' }]}>
                              {method.verificado ? 'Verificado' : 'Pendiente'}
                            </Text>
                          </View>
                          {method.cuentaCobro ? (
                            <View style={[styles.badge, { backgroundColor: COLORS.primary + '22' }]}>
                              <Text style={[styles.badgeText, { color: COLORS.primary }]}>Cuenta cobro</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                      <Icon source="chevron-right" size={22} color={COLORS.onSurfaceVariant} />
                    </View>
                  </Surface>
                  </Pressable>
                ))}
              </View>
            )
          ) : (
            <View>
              <Surface style={styles.infoBanner} elevation={0}>
                <Icon source="shield-check-outline" size={22} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  Elegí cómo querés operar dentro de la app. Todos los medios se verifican antes de ser activados.
                </Text>
              </Surface>

              <View style={styles.list}>
                {PAYMENT_METHODS_OPTIONS.map(method => (
                  <MethodCard
                    key={method.key}
                    icon={method.icon}
                    title={method.title}
                    subtitle={method.subtitle}
                    onPress={() => navigation.navigate(method.route, { isOnboarding })}
                  />
                ))}
              </View>

              <Button
                mode="contained-tonal"
                onPress={handleSkip}
                style={styles.skipButton}
                contentStyle={styles.skipContent}
                labelStyle={styles.skipLabel}
              >
                Tal vez más tarde
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MethodCard({ icon, title, subtitle, onPress }) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}>
      <View style={[styles.methodCard, pressed && { backgroundColor: COLORS.surfaceContainerHigh }]}>
        <View style={styles.methodIconContainer}>
          <Icon source={icon} size={26} color={COLORS.primary} />
        </View>
        <View style={styles.methodTextBlock}>
          <Text style={styles.methodTitle}>{title}</Text>
          <Text style={styles.methodSubtitle}>{subtitle}</Text>
        </View>
      </View>
    </Pressable>
  );
} 

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 },
  title: { fontSize: 30, fontWeight: '700', color: COLORS.onBackground, lineHeight: 38, marginBottom: 24 },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' },
  loader: { marginTop: 40 },
  error: { color: COLORS.error, marginTop: 20 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: COLORS.onSurfaceVariant, fontSize: 15 },
  list: { gap: 12 },
  card: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.outlineVariant },  
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.onSurface },
  cardSubtitle: { fontSize: 13, color: COLORS.onSurfaceVariant },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  infoBanner: { backgroundColor: COLORS.surfaceContainerLow, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24 },
  infoText: { flex: 1, fontSize: 14, lineHeight: 21, color: COLORS.onSurfaceVariant },
  methodCard: { backgroundColor: COLORS.surfaceContainer, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.outlineVariant, flexDirection: 'row', alignItems: 'center', gap: 16 },
  methodIconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  methodTextBlock: { flex: 1 },
  methodTitle: { fontSize: 16, fontWeight: '500', color: COLORS.onSurface, lineHeight: 22 },
  methodSubtitle: { fontSize: 13, color: COLORS.onSurfaceVariant, lineHeight: 18, marginTop: 2 },
  skipButton: { marginTop: 24, borderRadius: 999, backgroundColor: COLORS.surfaceContainerLow },
  skipContent: { minHeight: 52 },
  skipLabel: { fontSize: 15, fontWeight: '500', color: COLORS.onSurfaceVariant },
});