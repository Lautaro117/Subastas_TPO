import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, useTheme } from 'react-native-paper';

export default function AuthPrimaryButton({
  children,
  onPress,
  disabled = false,
  loading = false,
  style,
  contentStyle,
  ...rest
}) {
  const theme = useTheme();

  return (
    <Button
      mode="contained"
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      style={[styles.button, { backgroundColor: theme.colors.primary }, style]}
      contentStyle={[styles.content, contentStyle]}
      labelStyle={[styles.label, { color: theme.colors.onPrimary }]}
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
    minHeight: 56,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 22,
  },
});
