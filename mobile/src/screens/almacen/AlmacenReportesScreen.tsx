import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { inventarioAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import EmptyState from '../../components/common/EmptyState';

export default function AlmacenReportesScreen() {
  const { data: movimientos, isLoading } = useQuery({
    queryKey: ['inventario-movimientos'],
    queryFn: async () => { const r = await inventarioAPI.getMovimientos(); return r.data.datos || []; },
  });

  return (
    <FlatList
      style={styles.container}
      data={movimientos}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={[styles.tipo, item.tipo === 'entrada' ? styles.entrada : styles.salida]}>
              {item.tipo?.toUpperCase()}
            </Text>
            <Text style={styles.cantidad}>{item.cantidad}</Text>
          </View>
          <Text style={styles.producto}>{item.producto_nombre || 'Producto'}</Text>
          <Text style={styles.motivo}>{item.motivo || ''}</Text>
          <Text style={styles.fecha}>{item.fecha}</Text>
        </View>
      )}
      ListEmptyComponent={!isLoading ? <EmptyState message="No hay movimientos de inventario" /> : null}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tipo: { fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  entrada: { backgroundColor: '#D1FAE5', color: COLORS.success },
  salida: { backgroundColor: '#FEE2E2', color: COLORS.danger },
  cantidad: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  producto: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: 6 },
  motivo: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  fecha: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
});
