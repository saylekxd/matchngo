import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function Card({ title, children, onPress, style }: CardProps) {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </CardComponent>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#212529',
  },
});