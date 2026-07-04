import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { proveedoresAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';

export default function ProveedoresScreen() {
  const { data: proveedores, isLoading } = useQuery({
    queryKey: ['proveedores'],
    queryFn: async () => { const r = await proveedoresAPI.getAll(); return r.data.datos || []; },
  });

  return (
    <FlatList
      style={styles.container}
      data={proveedores}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="business-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.nombre}>{item.nombre}</Text>
            {item.contacto ? <Text style={styles.contacto}>{item.contacto}</Text> : null}
            {item.telefono ? <Text style={styles.telefono}>{item.telefono}</Text> : null}
          </View>
        </View>
      )}
      ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No hay proveedores</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  icon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  info: { flex: 1 },
  nombre: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  contacto: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  telefono: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 40 },
});
