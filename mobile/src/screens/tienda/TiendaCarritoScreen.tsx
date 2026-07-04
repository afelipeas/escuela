import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { carritoAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';

export default function TiendaCarritoScreen({ navigation }: any) {
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['carrito'],
    queryFn: async () => { const r = await carritoAPI.get(); return r.data.datos || []; },
  });

  const eliminar = useMutation({
    mutationFn: (id_producto: number) => carritoAPI.eliminar(id_producto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['carrito'] }),
  });

  const vaciar = useMutation({
    mutationFn: () => carritoAPI.vaciar(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['carrito'] }),
  });

  const total = (items || []).reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id_producto)}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <Text style={styles.nombre}>{item.nombre}</Text>
              <Text style={styles.precio}>{formatCurrency(item.precio || 0)}</Text>
              <Text style={styles.cantidad}>Cantidad: {item.cantidad}</Text>
            </View>
            <TouchableOpacity onPress={() => eliminar.mutate(item.id_producto)}>
              <Ionicons name="trash-outline" size={22} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<EmptyState icon="cart-outline" message="Tu carrito esta vacio" />}
        ListFooterComponent={
          (items || []).length > 0 ? (
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
              </View>
              <TouchableOpacity style={styles.checkoutBtn}>
                <Text style={styles.checkoutText}>Proceder al Pago</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.vaciarBtn} onPress={() => vaciar.mutate()}>
                <Text style={styles.vaciarText}>Vaciar Carrito</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  cardBody: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  precio: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  cantidad: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  footer: { marginTop: 16 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  totalLabel: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  totalValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  checkoutBtn: {
    backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center',
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  vaciarBtn: {
    marginTop: 10, padding: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.danger,
  },
  vaciarText: { color: COLORS.danger, fontSize: 14, fontWeight: '600' },
});
