import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { logrosAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';

export default function LogrosScreen() {
  const { data: logros, isLoading } = useQuery({
    queryKey: ['logros-mi-progreso'],
    queryFn: async () => { const r = await logrosAPI.getMiProgreso(); return r.data.datos || []; },
  });

  return (
    <FlatList
      style={styles.container}
      data={logros}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.icon}>{item.icono || '🏆'}</Text>
          <View style={styles.info}>
            <Text style={styles.titulo}>{item.titulo}</Text>
            {item.descripcion ? <Text style={styles.desc}>{item.descripcion}</Text> : null}
            {item.fecha_obtenido ? <Text style={styles.date}>Obtenido: {item.fecha_obtenido}</Text> : null}
          </View>
          <Ionicons name="trophy" size={20} color={COLORS.accent} />
        </View>
      )}
      ListEmptyComponent={!isLoading ? (
        <View style={styles.center}>
          <Ionicons name="trophy-outline" size={48} color={COLORS.muted} />
          <Text style={styles.empty}>Aun no tienes logros. Completa lecciones para ganar!</Text>
        </View>
      ) : null}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  icon: { fontSize: 36 },
  info: { flex: 1 },
  titulo: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  desc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  date: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  center: { alignItems: 'center', gap: 12, paddingVertical: 60 },
  empty: { color: COLORS.muted, fontSize: 16, textAlign: 'center', paddingHorizontal: 40 },
});
