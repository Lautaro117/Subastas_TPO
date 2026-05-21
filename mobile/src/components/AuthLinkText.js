import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export default function AuthLinkText({ children, onPress, style, ...rest }) {
  const theme = useTheme();

  return (
    <Text
      onPress={onPress}
      style={[styles.text, { color: theme.colors.onSurfaceVariant }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
});
