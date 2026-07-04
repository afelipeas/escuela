import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { inventarioAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import KPICard from '../../components/common/KPICard';

export default function AlmacenDashboardScreen() {
  const { data: resumen } = useQuery({
    queryKey: ['almacen-resumen'],
    queryFn: async () => { const r = await inventarioAPI.getResumen(); return r.data.datos || []; },
  });

  const { data: critico } = useQuery({
    queryKey: ['almacen-critico'],
    queryFn: async () => { const r = await inventarioAPI.getCritico(); return r.data.datos || []; },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.kpiGrid}>
        {(resumen || []).map((kpi: any, i: number) => (
          <View key={i} style={styles.kpiItem}>
            <KPICard titulo={kpi.titulo} valor={kpi.valor} icono={kpi.icono} />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stock Critico</Text>
        {(critico || []).map((item: any, i: number) => (
          <View key={i} style={styles.alertCard}>
            <Ionicons name="warning" size={20} color={COLORS.danger} />
            <View style={styles.alertInfo}>
              <Text style={styles.alertName}>{item.nombre}</Text>
              <Text style={styles.alertStock}>Stock: {item.stock_actual} (min: {item.stock_minimo})</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  kpiItem: { width: '48%' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  alertCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2',
    borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.danger + '30', gap: 12,
  },
  alertInfo: { flex: 1 },
  alertName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  alertStock: { fontSize: 13, color: COLORS.danger, marginTop: 2 },
});
