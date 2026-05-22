import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Text, useTheme } from 'react-native-paper';

export default function HomeProductosScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>Productos</Text>

        <View style={styles.placeholder}>
          <IconButton icon="cube-outline" iconColor={theme.colors.onSurfaceVariant} size={34} />
          <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
            Seccion en preparacion
          </Text>
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
    paddingTop: 64,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
});
