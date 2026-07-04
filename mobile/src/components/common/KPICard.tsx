import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';

interface Props {
  titulo: string;
  valor: string;
  tendencia?: string;
  icono?: string;
  color?: string;
}

export default function KPICard({ titulo, valor, tendencia, icono, color }: Props) {
  return (
    <View style={[styles.card, color ? { borderLeftColor: color } : {}]}>
      <View style={styles.top}>
        <Text style={styles.icono}>{icono || '📊'}</Text>
        <Text style={styles.titulo}>{titulo}</Text>
      </View>
      <Text style={styles.valor}>{valor}</Text>
      {tendencia ? <Text style={styles.tendencia}>{tendencia}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
    borderWidth: 1, borderColor: COLORS.border,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icono: { fontSize: 20 },
  titulo: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  valor: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  tendencia: { fontSize: 13, color: COLORS.secondary, marginTop: 4 },
});
