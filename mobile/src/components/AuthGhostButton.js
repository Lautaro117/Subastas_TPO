import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, useTheme } from 'react-native-paper';

export default function AuthGhostButton({
  children,
  onPress,
  disabled = false,
  style,
  contentStyle,
  ...rest
}) {
  const theme = useTheme();

  return (
    <Button
      mode="contained-tonal"
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { backgroundColor: theme.colors.surfaceContainerHigh }, style]}
      contentStyle={[styles.content, contentStyle]}
      labelStyle={[styles.label, { color: theme.colors.onSurface }]}
      {...rest}
    >
      {children}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 999,
  },
  content: {
    minHeight: 52,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
});
