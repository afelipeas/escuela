import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { aulaAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';

export default function AulaCursoScreen({ route, navigation }: any) {
  const { cursoId, cursoTitulo } = route.params;

  const { data: lecciones, isLoading } = useQuery({
    queryKey: ['aula-lecciones', cursoId],
    queryFn: async () => { const r = await aulaAPI.getLecciones(cursoId); return r.data.datos || []; },
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={lecciones}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.card, item.completada && styles.cardCompleted]}
            onPress={() => navigation.navigate('AulaLeccion', { leccionId: item.id, leccionTitulo: item.titulo })}
          >
            <View style={styles.orderBadge}>
              <Text style={styles.orderText}>{index + 1}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.titulo}>{item.titulo}</Text>
              {item.duracion_min ? <Text style={styles.duracion}>{item.duracion_min} min</Text> : null}
            </View>
            {item.completada ? (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            ) : (
              <Ionicons name="chevron-forward" size={22} color={COLORS.muted} />
            )}
          </TouchableOpacity>
        )}
        ListHeaderComponent={<Text style={styles.header}>{cursoTitulo}</Text>}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No hay lecciones</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  cardCompleted: { borderColor: COLORS.success + '40', backgroundColor: '#F0FDF4' },
  orderBadge: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  orderText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  info: { flex: 1 },
  titulo: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  duracion: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 40 },
});
