import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ventasAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';

export default function VendedorReportesScreen() {
  const { data: comisiones } = useQuery({
    queryKey: ['vendedor-comisiones'],
    queryFn: async () => { const r = await ventasAPI.getComisiones(); return r.data.datos || []; },
  });

  const total = (comisiones || []).reduce((sum: number, c: any) => sum + parseFloat(c.monto || 0), 0);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Comisiones Acumuladas</Text>
        <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial de Comisiones</Text>
        {(comisiones || []).length === 0 ? (
          <EmptyState icon="receipt-outline" message="No hay comisiones registradas" />
        ) : (
          (comisiones || []).map((c: any, i: number) => (
            <View key={i} style={styles.card}>
              <Text style={styles.cardMonto}>{formatCurrency(parseFloat(c.monto || 0))}</Text>
              <Text style={styles.cardDate}>{c.fecha}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  summary: { backgroundColor: '#D97706', padding: 24, alignItems: 'center' },
  summaryLabel: { color: '#fff', fontSize: 14, opacity: 0.8 },
  summaryValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardMonto: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  cardDate: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
});
