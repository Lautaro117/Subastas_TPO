import React from 'react';
import { StyleSheet } from 'react-native';
import { TextInput, useTheme } from 'react-native-paper';

export default function AuthTextInput({
  value,
  onChangeText,
  label,
  placeholder,
  icon,
  secureTextEntry = false,
  error = false,
  style,
  ...rest
}) {
  const theme = useTheme();

  return (
    <TextInput
      mode="outlined"
      value={value}
      onChangeText={onChangeText}
      label={label}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      error={error}
      style={[styles.input, style]}
      outlineStyle={styles.outline}
      textColor={theme.colors.onSurface}
      placeholderTextColor={theme.colors.onSurfaceVariant}
      outlineColor={theme.colors.outline}
      activeOutlineColor={theme.colors.primary}
      left={
        icon ? <TextInput.Icon icon={icon} color={theme.colors.primary} /> : undefined
      }
      theme={{
        colors: {
          primary: theme.colors.primary,
          outline: theme.colors.outline,
          onSurfaceVariant: theme.colors.onSurfaceVariant,
          background: 'transparent',
        },
      }}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    backgroundColor: 'transparent',
    height: 56,
  },
  outline: {
    borderRadius: 12,
  },
});
