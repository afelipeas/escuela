import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { productosAPI, carritoAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

export default function TiendaDetalleScreen({ route }: any) {
  const { productoId } = route.params;
  const queryClient = useQueryClient();
  const [cantidad, setCantidad] = useState(1);

  const { data: producto, isLoading } = useQuery({
    queryKey: ['producto', productoId],
    queryFn: async () => { const r = await productosAPI.getById(productoId); return r.data.datos; },
  });

  const agregar = useMutation({
    mutationFn: () => carritoAPI.agregar(productoId, cantidad),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carrito'] });
      Alert.alert('Agregado', 'Producto agregado al carrito');
    },
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      {producto?.imagen_url ? (
        <Image source={{ uri: producto.imagen_url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={{ fontSize: 64 }}>📦</Text>
        </View>
      )}

      <View style={styles.body}>
        <Text style={styles.nombre}>{producto?.nombre}</Text>
        <Text style={styles.precio}>{formatCurrency(producto?.precio || 0)}</Text>

        {producto?.categoria ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{producto.categoria}</Text>
          </View>
        ) : null}

        {producto?.descripcion ? (
          <Text style={styles.desc}>{producto.descripcion}</Text>
        ) : null}

        <View style={styles.qtyRow}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setCantidad(Math.max(1, cantidad - 1))}>
            <Ionicons name="remove" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{cantidad}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => setCantidad(cantidad + 1)}>
            <Ionicons name="add" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={() => agregar.mutate()} disabled={agregar.isPending}>
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.addBtnText}>{agregar.isPending ? 'Agregando...' : 'Agregar al Carrito'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 280, resizeMode: 'cover' },
  imagePlaceholder: {
    width: '100%', height: 280, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
  },
  body: { padding: 20 },
  nombre: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  precio: { fontSize: 24, fontWeight: '800', color: COLORS.primary, marginTop: 8 },
  badge: {
    alignSelf: 'flex-start', marginTop: 8, backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  badgeText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  desc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginTop: 16 },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20,
    marginTop: 24,
  },
  qtyBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
  },
  qtyText: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 24, backgroundColor: COLORS.primary, padding: 16, borderRadius: 12,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
