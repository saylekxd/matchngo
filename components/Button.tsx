import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  ViewStyle,
  TextStyle
} from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'tertiary';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  title,
  onPress,
  type = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    type === 'primary' && styles.primaryButton,
    type === 'secondary' && styles.secondaryButton,
    type === 'tertiary' && styles.tertiaryButton,
    disabled && styles.disabledButton,
    style,
  ];

  const textStyles = [
    styles.text,
    type === 'primary' && styles.primaryText,
    type === 'secondary' && styles.secondaryText,
    type === 'tertiary' && styles.tertiaryText,
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={type === 'primary' ? '#ffffff' : '#4361ee'} />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: '#4361ee',
  },
  secondaryButton: {
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#4361ee',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
    borderColor: '#ced4da',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#4361ee',
  },
  tertiaryText: {
    color: '#4361ee',
  },
  disabledText: {
    color: '#adb5bd',
  },
});