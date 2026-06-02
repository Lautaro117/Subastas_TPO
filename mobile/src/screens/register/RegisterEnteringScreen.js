import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, IconButton, Text, useTheme } from 'react-native-paper';

import { useAppSession } from '../../navigation/AppSessionContext';
import { useRegisterFlow } from '../../navigation/RegisterFlowContext';

export default function RegisterEnteringScreen({ navigation }) {
  const theme = useTheme();
  const { resetRegisterFlow } = useRegisterFlow();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      resetRegisterFlow();
      navigation.navigate('PaymentMethodsOnboarding');
    }, 1400);

    return () => clearTimeout(timeoutId);
  }, [resetRegisterFlow]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <View style={styles.topBack}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onSurface}
            size={22}
            onPress={() => navigation.goBack()}
          />
        </View>

        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.onBackground }]}>Ingresando...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 24,
  },
  topBack: {
    marginLeft: -8,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
});
