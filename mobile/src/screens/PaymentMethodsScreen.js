import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Icon, Surface, Text, useTheme } from 'react-native-paper';

import { COLORS } from '../theme/colors';
import { useAppSession } from '../navigation/AppSessionContext';

const PAYMENT_METHODS = [
  {
    key: 'bank',
    icon: 'bank-outline',
    title: 'Cuenta bancaria',
    subtitle: 'CBU / IBAN nacional o internacional',
    route: 'AddBankAccount',
  },
  {
    key: 'card',
    icon: 'credit-card-outline',
    title: 'Tarjeta de crédito',
    subtitle: 'Nacional o internacional',
    route: 'AddCreditCard',
  },
  {
    key: 'check',
    icon: 'file-document-outline',
    title: 'Cheque certificado',
    subtitle: 'Garantía física para subastas',
    route: 'AddCertifiedCheck',
  },
];

export default function PaymentMethodsScreen({ navigation, route }) {
  const theme = useTheme();
  const { enterApp } = useAppSession();
  const isOnboarding = route?.params?.isOnboarding ?? false;

  const handleSkip = async () => {
    if (isOnboarding) {
      await enterApp('registered');
    } else {
      navigation.goBack();
    }
  };

  const handleSelectMethod = (methodRoute) => {
    navigation.navigate(methodRoute, { isOnboarding });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Agregar método{'\n'}de pago</Text>

          <Surface style={styles.infoBanner} elevation={0}>
            <Icon source="shield-check-outline" size={22} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Elegí cómo querés operar dentro de la app. Todos los medios se verifican antes de ser activados.
            </Text>
          </Surface>

          <View style={styles.methodsList}>
            {PAYMENT_METHODS.map((method) => (
              <MethodCard
                key={method.key}
                icon={method.icon}
                title={method.title}
                subtitle={method.subtitle}
                onPress={() => handleSelectMethod(method.route)}
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
      </ScrollView>
    </SafeAreaView>
  );
}

function MethodCard({ icon, title, subtitle, onPress }) {
  const [pressed, setPressed] = React.useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <View
        style={[
          styles.methodCard,
          pressed && { backgroundColor: COLORS.surfaceContainerHigh },
        ]}
      >
        <View style={styles.methodIconContainer}>
          <Icon source={icon} size={26} color={COLORS.primary} />
        </View>
        <View style={styles.methodTextBlock}>
          <Text style={styles.methodTitle}>{title}</Text>
          <Text style={styles.methodSubtitle}>{subtitle}</Text>
        </View>
        <Icon source="chevron-right" size={22} color={COLORS.onSurfaceVariant} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.onBackground,
    lineHeight: 38,
    marginBottom: 24,
    letterSpacing: 0.2,
  },
  infoBanner: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.onSurfaceVariant,
  },
  methodsList: {
    gap: 0,
  },
  methodCard: {
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  methodIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTextBlock: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.onSurface,
    lineHeight: 22,
  },
  methodSubtitle: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
    marginTop: 2,
  },
  skipButton: {
    marginTop: 'auto',
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerLow,
  },
  skipContent: {
    minHeight: 52,
  },
  skipLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.onSurfaceVariant,
  },
});
