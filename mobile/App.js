import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

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
  const { session, isLoading } = useAppSession();

  // Block the NavigationContainer from mounting until AsyncStorage has been read.
  // This ensures AuthStack.initialRouteName is computed with the correct session state
  // and avoids the race condition where entryMode is still null on first render.
  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: navigationTheme.colors.background }} />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {session.isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
