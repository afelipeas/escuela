import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { notificacionesAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

export default function NotificacionesScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['notificaciones'],
    queryFn: async () => {
      const res = await notificacionesAPI.getAll();
      return res.data.datos;
    },
  });

  const markRead = useMutation({
    mutationFn: (id: number) => notificacionesAPI.marcarLeida(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  });

  const items = data?.notificaciones || [];

  if (isLoading) {
    return <View style={styles.center}><Text>Cargando...</Text></View>;
  }

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={48} color={COLORS.muted} />
          <Text style={styles.emptyText}>No tienes notificaciones</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={[styles.card, !item.leido && styles.unread]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.titulo}</Text>
                {!item.leido && <View style={styles.badge} />}
              </View>
              <Text style={styles.cardMessage}>{item.mensaje}</Text>
              <Text style={styles.cardDate}>{formatDateTime(item.fecha_creacion)}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { color: COLORS.muted, fontSize: 16 },
  card: {
    backgroundColor: COLORS.surface, marginHorizontal: 16, marginTop: 12, padding: 16,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  unread: { borderColor: COLORS.primary, backgroundColor: '#EEF2FF' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  badge: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  cardMessage: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  cardDate: { fontSize: 12, color: COLORS.muted, marginTop: 8 },
});
