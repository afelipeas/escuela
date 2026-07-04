import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { productosAPI } from '../../api/endpoints';
import { COLORS, CATEGORIAS_PRODUCTO } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

export default function TiendaCatalogoScreen({ navigation }: any) {
  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos-tienda'],
    queryFn: async () => { const r = await productosAPI.getAll(); return r.data.datos || []; },
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={productos}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        contentContainerStyle={{ padding: 8 }}
        columnWrapperStyle={{ gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('TiendaDetalle', { productoId: item.id })}
          >
            {item.imagen_url ? (
              <Image source={{ uri: item.imagen_url }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imageEmoji}>📦</Text>
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.nombre} numberOfLines={2}>{item.nombre}</Text>
              <Text style={styles.precio}>{formatCurrency(item.precio)}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!isLoading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No hay productos disponibles</Text>
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  image: { width: '100%', height: 140, resizeMode: 'cover' },
  imagePlaceholder: {
    width: '100%', height: 140, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
  },
  imageEmoji: { fontSize: 40 },
  cardBody: { padding: 10 },
  nombre: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  precio: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { color: COLORS.muted, fontSize: 16 },
});
