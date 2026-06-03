import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, PaperProvider, Text } from 'react-native-paper';
import { StyleSheet, View } from 'react-native';

import { AppSessionProvider, useAppSession } from './src/navigation/AppSessionContext';
import { AuthStack } from './src/navigation/AuthStack';
import { MainTabs } from './src/navigation/MainTabs';
import { RegisterFlowProvider } from './src/navigation/RegisterFlowContext';
import { paperTheme } from './src/theme/theme';

const navigationTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    background: paperTheme.colors.background,
    card: paperTheme.colors.surface,
    text: paperTheme.colors.onSurface,
    border: paperTheme.colors.outline,
    primary: paperTheme.colors.primary,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <AppSessionProvider>
          <RegisterFlowProvider>
            <AppNavigator />
          </RegisterFlowProvider>
        </AppSessionProvider>
        <StatusBar style="light" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

function AppNavigator() {
  const { session } = useAppSession();

  if (!session.bootstrapped) {
    return <AppBootstrapScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {session.isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

function AppBootstrapScreen() {
  return (
    <View style={styles.bootstrapContainer}>
      <ActivityIndicator size="large" color={paperTheme.colors.primary} />
      <Text style={styles.bootstrapText}>Recuperando tu sesión...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bootstrapContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paperTheme.colors.background,
    gap: 16,
  },
  bootstrapText: {
    color: paperTheme.colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
  },
});
