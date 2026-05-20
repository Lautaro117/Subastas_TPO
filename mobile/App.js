import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, Text } from 'react-native-paper';

import { paperTheme } from './src/theme/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <Text>Open up App.js to start working on your app!</Text>
        <StatusBar style="light" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
