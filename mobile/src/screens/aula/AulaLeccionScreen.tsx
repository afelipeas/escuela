import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { aulaAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';

export default function AulaLeccionScreen({ route }: any) {
  const { leccionId } = route.params;
  const queryClient = useQueryClient();
  const [comentario, setComentario] = useState('');

  const { data: leccion, isLoading } = useQuery({
    queryKey: ['aula-leccion', leccionId],
    queryFn: async () => { const r = await aulaAPI.getDetalleLeccion(leccionId); return r.data.datos; },
  });

  const { data: comentarios } = useQuery({
    queryKey: ['aula-comentarios', leccionId],
    queryFn: async () => { const r = await aulaAPI.getComentarios(leccionId); return r.data.datos || []; },
  });

  const completar = useMutation({
    mutationFn: () => aulaAPI.completarLeccion(leccionId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['aula-leccion', leccionId] });
      queryClient.invalidateQueries({ queryKey: ['aula-lecciones'] });
      queryClient.invalidateQueries({ queryKey: ['aula-resumen'] });
      const pts = res.data.datos?.puntos_ganados || 50;
      Alert.alert('Leccion completada', `Ganaste ${pts} Puntos Fe!`);
    },
  });

  const publicarComentario = useMutation({
    mutationFn: (texto: string) => aulaAPI.postComentario(leccionId, texto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aula-comentarios', leccionId] });
      setComentario('');
    },
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const videoUrl = leccion?.video_url || '';

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>{leccion?.titulo}</Text>

      {videoUrl ? (
        <View style={styles.videoContainer}>
          <WebView
            source={{ uri: videoUrl }}
            style={styles.video}
            allowsFullscreenVideo
          />
        </View>
      ) : null}

      {leccion?.descripcion ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripcion</Text>
          <Text style={styles.desc}>{leccion.descripcion}</Text>
        </View>
      ) : null}

      {leccion?.materiales?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materiales</Text>
          {leccion.materiales.map((m: any, i: number) => (
            <TouchableOpacity key={i} style={styles.materialCard}>
              <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
              <View style={styles.materialInfo}>
                <Text style={styles.materialName}>{m.nombre}</Text>
                <Text style={styles.materialType}>{m.tipo?.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!leccion?.completada ? (
        <TouchableOpacity style={styles.completarBtn} onPress={() => completar.mutate()} disabled={completar.isPending}>
          <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
          <Text style={styles.completarText}>{completar.isPending ? 'Completando...' : 'Marcar como completada'}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.completadoBadge}>
          <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
          <Text style={styles.completadoText}>Leccion completada</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comentarios ({comentarios?.length || 0})</Text>
        {(comentarios || []).map((c: any) => (
          <View key={c.id} style={styles.commentCard}>
            <Text style={styles.commentAuthor}>{c.nombre_usuario || 'Anonimo'}</Text>
            <Text style={styles.commentText}>{c.texto}</Text>
          </View>
        ))}

        <View style={styles.commentInput}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un comentario..."
            value={comentario}
            onChangeText={setComentario}
            multiline
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => {
              if (comentario.trim()) publicarComentario.mutate(comentario.trim());
            }}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 20, fontWeight: '700', color: COLORS.text, padding: 16 },
  videoContainer: { marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  video: { height: 220, backgroundColor: '#000' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  desc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  materialCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surface,
    padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  materialInfo: { flex: 1 },
  materialName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  materialType: { fontSize: 12, color: COLORS.muted },
  completarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, backgroundColor: COLORS.success, padding: 14, borderRadius: 12,
  },
  completarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  completadoBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, backgroundColor: '#F0FDF4', padding: 14, borderRadius: 12,
  },
  completadoText: { color: COLORS.success, fontSize: 16, fontWeight: '700' },
  commentCard: {
    backgroundColor: COLORS.surface, padding: 12, borderRadius: 10,
    marginBottom: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  commentText: { fontSize: 14, color: COLORS.text, marginTop: 4 },
  commentInput: { flexDirection: 'row', gap: 8, marginTop: 8 },
  input: {
    flex: 1, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 12, fontSize: 14, minHeight: 44,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
});
