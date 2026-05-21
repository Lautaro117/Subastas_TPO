import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

import { AuthStack } from './src/navigation/AuthStack';
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
        <RegisterFlowProvider>
          <NavigationContainer theme={navigationTheme}>
            <AuthStack />
          </NavigationContainer>
        </RegisterFlowProvider>
        <StatusBar style="light" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
