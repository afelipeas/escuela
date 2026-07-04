import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { clasesAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';

export default function AlumnosScreen() {
  const { data: alumnos, isLoading } = useQuery({
    queryKey: ['docente-alumnos'],
    queryFn: async () => { const r = await clasesAPI.getMisAlumnos(); return r.data.datos || []; },
  });

  return (
    <FlatList
      style={styles.container}
      data={alumnos}
      keyExtractor={(item: any) => String(item.id || Math.random())}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }: any) => (
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.nombre?.charAt(0) || '?'}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.nombre}>{item.nombre} {item.apellido || ''}</Text>
            <Text style={styles.curso}>{item.curso_titulo || 'Curso'}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No hay alumnos inscritos</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.info,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  info: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  curso: { fontSize: 13, color: COLORS.textSecondary },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 40 },
});
