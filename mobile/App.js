import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

import { paperTheme } from './src/theme/theme';
import { LoginScreen } from './src/screens';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <LoginScreen />
        <StatusBar style="light" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
