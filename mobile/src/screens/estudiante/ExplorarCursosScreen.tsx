import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { cursosAPI, aulaAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';

export default function ExplorarCursosScreen({ navigation }: any) {
  const queryClient = useQueryClient();

  const { data: cursos, isLoading } = useQuery({
    queryKey: ['cursos-disponibles'],
    queryFn: async () => { const r = await cursosAPI.getAll(); return r.data.datos || []; },
  });

  const { data: inscritos } = useQuery({
    queryKey: ['mis-inscripciones'],
    queryFn: async () => { const r = await aulaAPI.getMisInscripciones(); return r.data.datos || []; },
  });

  const inscribir = useMutation({
    mutationFn: (id_curso: number) => aulaAPI.inscribir(id_curso),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-inscripciones'] });
      queryClient.invalidateQueries({ queryKey: ['aula-cursos'] });
      Alert.alert('Exito', 'Te has inscrito en el curso');
    },
    onError: () => Alert.alert('Error', 'No se pudo inscribir'),
  });

  const isInscribed = (cursoId: number) => (inscritos || []).includes(cursoId);

  return (
    <FlatList
      style={styles.container}
      data={cursos}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            if (isInscribed(item.id)) {
              navigation.navigate('AulaCurso', { cursoId: item.id, cursoTitulo: item.titulo });
            }
          }}
        >
          <Text style={styles.icon}>{item.icono || '📚'}</Text>
          <View style={styles.info}>
            <Text style={styles.titulo}>{item.titulo}</Text>
            {item.descripcion ? <Text style={styles.desc} numberOfLines={2}>{item.descripcion}</Text> : null}
            {isInscribed(item.id) ? (
              <View style={styles.inscrito}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.inscritoText}>Inscrito</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.inscribirBtn} onPress={() => inscribir.mutate(item.id)}>
                <Text style={styles.inscribirText}>Inscribirse</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No hay cursos disponibles</Text> : null}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  card: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  icon: { fontSize: 40 },
  info: { flex: 1 },
  titulo: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  desc: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  inscrito: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  inscritoText: { color: COLORS.success, fontSize: 13, fontWeight: '600' },
  inscribirBtn: {
    marginTop: 8, backgroundColor: COLORS.primary, paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start',
  },
  inscribirText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 40, fontSize: 16 },
});
