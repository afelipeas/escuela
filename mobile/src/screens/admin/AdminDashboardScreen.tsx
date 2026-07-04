import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ventasAPI, usuariosAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import KPICard from '../../components/common/KPICard';

export default function AdminDashboardScreen({ navigation }: any) {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => { const r = await ventasAPI.getEstadisticas(); return r.data.datos; },
  });

  const { data: topProductos } = useQuery({
    queryKey: ['top-productos'],
    queryFn: async () => { const r = await ventasAPI.getTopProductos(); return r.data.datos || []; },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiItem}>
          <KPICard titulo="Ventas del Mes" valor={stats?.total_ventas ? `$${Number(stats.total_ventas).toLocaleString()}` : '$0'} icono="💰" color={COLORS.success} />
        </View>
        <View style={styles.kpiItem}>
          <KPICard titulo="Transacciones" valor={String(stats?.total_ordenes || 0)} icono="🧾" color={COLORS.info} />
        </View>
        <View style={styles.kpiItem}>
          <KPICard titulo="Ticket Promedio" valor={stats?.ticket_promedio ? `$${Number(stats.ticket_promedio).toLocaleString()}` : '$0'} icono="📊" color={COLORS.accent} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Productos Mas Vendidos</Text>
        {(topProductos || []).map((p: any, i: number) => (
          <View key={i} style={styles.rankCard}>
            <Text style={styles.rank}>#{i + 1}</Text>
            <View style={styles.rankInfo}>
              <Text style={styles.rankName}>{p.nombre}</Text>
              <Text style={styles.rankQty}>{p.total_vendido} vendidos</Text>
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
  rankCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  rank: { fontSize: 18, fontWeight: '800', color: COLORS.primary, width: 30 },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  rankQty: { fontSize: 13, color: COLORS.textSecondary },
});
