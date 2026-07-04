import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';

interface Props {
  icon?: string;
  message: string;
}

export default function EmptyState({ icon = 'inbox-outline', message }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon as any} size={48} color={COLORS.muted} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  text: { fontSize: 16, color: COLORS.muted, textAlign: 'center' },
});
