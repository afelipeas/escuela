import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ayudaAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import EmptyState from '../../components/common/EmptyState';

export default function SoporteVendedorScreen() {
  const { data: tickets } = useQuery({
    queryKey: ['tickets-vendedor'],
    queryFn: async () => { const r = await ayudaAPI.getTicketsVendedor(); return r.data.datos || []; },
  });

  return (
    <FlatList
      style={styles.container}
      data={tickets}
      keyExtractor={(item: any) => String(item.id || Math.random())}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }: any) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.info} />
            <Text style={styles.cardTitle}>{item.asunto || item.accion || 'Ticket'}</Text>
          </View>
          <Text style={styles.cardMessage}>{item.detalles || item.mensaje || ''}</Text>
          <Text style={styles.cardDate}>{item.fecha}</Text>
        </View>
      )}
      ListEmptyComponent={<EmptyState icon="headset-outline" message="No hay tickets de soporte" />}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  cardMessage: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  cardDate: { fontSize: 12, color: COLORS.muted, marginTop: 8 },
});
