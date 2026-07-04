import React from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { productosAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

export default function AdminProductosScreen() {
  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos-admin'],
    queryFn: async () => { const r = await productosAPI.getAll({ admin: true }); return r.data.datos || []; },
  });

  return (
    <FlatList
      style={styles.container}
      data={productos}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          {item.imagen_url ? (
            <Image source={{ uri: item.imagen_url }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}><Text>📦</Text></View>
          )}
          <View style={styles.info}>
            <Text style={styles.nombre}>{item.nombre}</Text>
            <Text style={styles.precio}>{formatCurrency(item.precio)}</Text>
            <Text style={styles.stock}>Stock: {item.stock_actual || 0}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No hay productos</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 10, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  image: { width: 60, height: 60, borderRadius: 8, resizeMode: 'cover' },
  imagePlaceholder: {
    width: 60, height: 60, borderRadius: 8, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
  },
  info: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  precio: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  stock: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 40 },
});
