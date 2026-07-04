import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { aulaAPI, logrosAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import KPICard from '../../components/common/KPICard';

export default function EstudianteDashboardScreen({ navigation }: any) {
  const { data: resumen } = useQuery({
    queryKey: ['aula-resumen'],
    queryFn: async () => { const r = await aulaAPI.getResumen(); return r.data.datos; },
  });

  const { data: cursos } = useQuery({
    queryKey: ['aula-cursos'],
    queryFn: async () => { const r = await aulaAPI.getCursos(); return r.data.datos; },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.kpiGrid}>
        {(resumen || []).slice(0, 4).map((kpi: any, i: number) => (
          <View key={i} style={styles.kpiItem}>
            <KPICard titulo={kpi.titulo} valor={kpi.valor} tendencia={kpi.tendencia} icono={kpi.icono} />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis Cursos</Text>
        {(cursos || []).length === 0 ? (
          <Text style={styles.empty}>No estas inscrito en ningun curso</Text>
        ) : (
          (cursos || []).map((curso: any) => (
            <TouchableOpacity
              key={curso.id}
              style={styles.cursoCard}
              onPress={() => navigation.navigate('AulaCurso', { cursoId: curso.id, cursoTitulo: curso.curso_titulo || curso.titulo })}
            >
              <Text style={styles.cursoIcon}>{curso.curso_icono || '📚'}</Text>
              <View style={styles.cursoInfo}>
                <Text style={styles.cursoTitulo}>{curso.curso_titulo || curso.titulo}</Text>
                <Text style={styles.cursoDocente}>{curso.docente_nombre}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${curso.progreso_pct || 0}%` }]} />
                </View>
                <Text style={styles.progressText}>{curso.progreso_pct || 0}% completado</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Cursos', { screen: 'ExplorarCursos' })}
      >
        <Ionicons name="compass-outline" size={20} color={COLORS.primary} />
        <Text style={styles.exploreText}>Explorar mas cursos</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  kpiItem: { width: '48%' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  empty: { color: COLORS.muted, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  cursoCard: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  cursoIcon: { fontSize: 36 },
  cursoInfo: { flex: 1 },
  cursoTitulo: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  cursoDocente: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  progressBar: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginTop: 8 },
  progressFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  progressText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  exploreButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    margin: 16, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
  },
  exploreText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
});
