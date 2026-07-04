import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { pedidosAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import KPICard from '../../components/common/KPICard';

export default function ClienteDashboardScreen({ navigation }: any) {
  const { data: puntos } = useQuery({
    queryKey: ['mis-puntos'],
    queryFn: async () => { const r = await pedidosAPI.getPuntos(); return r.data.datos; },
  });

  const { data: pedidos } = useQuery({
    queryKey: ['mis-pedidos'],
    queryFn: async () => { const r = await pedidosAPI.getAll(); return r.data.datos || []; },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiItem}>
          <KPICard titulo="Mis Puntos Fe" valor={String(puntos?.puntos || 0)} icono="⭐" color={COLORS.accent} />
        </View>
        <View style={styles.kpiItem}>
          <KPICard titulo="Mis Pedidos" valor={String((pedidos || []).length)} icono="📦" color={COLORS.info} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pedidos Recientes</Text>
        {(pedidos || []).slice(0, 5).map((p: any) => (
          <View key={p.id} style={styles.pedidoCard}>
            <View style={styles.pedidoHeader}>
              <Text style={styles.pedidoCodigo}>{p.codigo}</Text>
              <Text style={styles.pedidoEstado}>{p.estado}</Text>
            </View>
            <Text style={styles.pedidoTotal}>{formatCurrency(p.total)}</Text>
            <Text style={styles.pedidoFecha}>{p.fecha_pedido}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.tiendaBtn} onPress={() => navigation.navigate('Tienda', { screen: 'TiendaCatalogo' })}>
        <Ionicons name="cart-outline" size={20} color="#fff" />
        <Text style={styles.tiendaBtnText}>Ir a la Tienda</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  kpiItem: { width: '48%' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  pedidoCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  pedidoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pedidoCodigo: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  pedidoEstado: { fontSize: 12, fontWeight: '600', color: COLORS.info, backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  pedidoTotal: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginTop: 8 },
  pedidoFecha: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  tiendaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 16, backgroundColor: COLORS.primary, padding: 16, borderRadius: 12,
  },
  tiendaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
