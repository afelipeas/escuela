import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pedidosAPI, usuariosAPI, productosAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

export default function NuevaVentaScreen() {
  const queryClient = useQueryClient();
  const [clienteId, setClienteId] = useState('');
  const [productos, setProductos] = useState<{ id_producto: number; cantidad: number; precio_unitario: number }[]>([]);

  const { data: clientes } = useQuery({
    queryKey: ['clientes-venta'],
    queryFn: async () => { const r = await usuariosAPI.getClientes(); return r.data.datos || []; },
  });

  const { data: allProductos } = useQuery({
    queryKey: ['productos-venta'],
    queryFn: async () => { const r = await productosAPI.getAll(); return r.data.datos || []; },
  });

  const crear = useMutation({
    mutationFn: (data: any) => pedidosAPI.crear(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendedor-resumen'] });
      Alert.alert('Exito', 'Venta registrada');
    },
    onError: () => Alert.alert('Error', 'No se pudo registrar la venta'),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>Cliente</Text>
      <View style={styles.selectContainer}>
        {(clientes || []).slice(0, 10).map((c: any) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.selectItem, clienteId === String(c.id) && styles.selectActive]}
            onPress={() => setClienteId(String(c.id))}
          >
            <Text style={styles.selectText}>{c.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Productos</Text>
      {(allProductos || []).slice(0, 8).map((p: any) => (
        <TouchableOpacity key={p.id} style={styles.productRow}>
          <Text style={styles.productName}>{p.nombre}</Text>
          <Text style={styles.productPrice}>{formatCurrency(p.precio)}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.button}
        onPress={() => Alert.alert('Info', 'Selecciona cliente y productos para completar la venta')}
      >
        <Text style={styles.buttonText}>Registrar Venta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 12 },
  selectContainer: { gap: 4, marginTop: 6 },
  selectItem: { padding: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  selectActive: { borderColor: '#D97706', backgroundColor: '#FFFBEB' },
  selectText: { fontSize: 14, color: COLORS.text },
  productRow: {
    flexDirection: 'row', justifyContent: 'space-between', padding: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  productName: { fontSize: 14, color: COLORS.text },
  productPrice: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  button: {
    backgroundColor: '#D97706', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
