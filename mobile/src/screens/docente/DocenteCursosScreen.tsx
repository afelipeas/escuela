import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { cursosAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';

export default function DocenteCursosScreen() {
  const { data: cursos, isLoading } = useQuery({
    queryKey: ['docente-cursos'],
    queryFn: async () => { const r = await cursosAPI.getMisCursos(); return r.data.datos || []; },
  });

  return (
    <FlatList
      style={styles.container}
      data={cursos}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.icon}>{item.icono || '📚'}</Text>
          <View style={styles.info}>
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.estado}>{item.estado}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </View>
      )}
      ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No tienes cursos creados</Text> : null}
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
  estado: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 40 },
});
