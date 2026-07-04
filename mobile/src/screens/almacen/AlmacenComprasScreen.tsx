import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ordenesCompraAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

export default function AlmacenComprasScreen() {
  const { data: ordenes, isLoading } = useQuery({
    queryKey: ['ordenes-compra'],
    queryFn: async () => { const r = await ordenesCompraAPI.getAll(); return r.data.datos || []; },
  });

  return (
    <FlatList
      style={styles.container}
      data={ordenes}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.codigo}>{item.codigo}</Text>
            <View style={[styles.statusBadge, item.estado === 'completada' ? styles.statusComplete : styles.statusPending]}>
              <Text style={styles.statusText}>{item.estado}</Text>
            </View>
          </View>
          <Text style={styles.proveedor}>{item.proveedor_nombre || 'Proveedor'}</Text>
          <Text style={styles.total}>{formatCurrency(item.total)}</Text>
          <Text style={styles.fecha}>{item.fecha_orden}</Text>
        </View>
      )}
      ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No hay ordenes de compra</Text> : null}
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
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusComplete: { backgroundColor: '#D1FAE5' },
  statusText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  proveedor: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  total: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginTop: 8 },
  fecha: { fontSize: 13, color: COLORS.muted, marginTop: 4 },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 40 },
});
