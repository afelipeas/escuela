import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { pedidosAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';

export default function PedidosScreen() {
  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['mis-pedidos'],
    queryFn: async () => { const r = await pedidosAPI.getAll(); return r.data.datos || []; },
  });

  return (
    <FlatList
      style={styles.container}
      data={pedidos}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.codigo}>{item.codigo}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.estado}</Text>
            </View>
          </View>
          <Text style={styles.total}>{formatCurrency(item.total)}</Text>
          <Text style={styles.fecha}>{item.fecha_pedido}</Text>
        </View>
      )}
      ListEmptyComponent={!isLoading ? <EmptyState icon="receipt-outline" message="No tienes pedidos" /> : null}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codigo: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  statusBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '600', color: COLORS.info },
  total: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginTop: 8 },
  fecha: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
});
