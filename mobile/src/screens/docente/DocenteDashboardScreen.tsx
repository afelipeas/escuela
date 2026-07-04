import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { clasesAPI, cursosAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import KPICard from '../../components/common/KPICard';
import { formatCurrency } from '../../utils/formatters';

export default function DocenteDashboardScreen() {
  const { data: resumen } = useQuery({
    queryKey: ['docente-resumen'],
    queryFn: async () => { const r = await clasesAPI.getResumenDocente(); return r.data.datos || []; },
  });

  const { data: clases } = useQuery({
    queryKey: ['docente-clases'],
    queryFn: async () => { const r = await clasesAPI.getAll(); return r.data.datos || []; },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.kpiGrid}>
        {(resumen || []).map((kpi: any, i: number) => (
          <View key={i} style={styles.kpiItem}>
            <KPICard titulo={kpi.titulo} valor={kpi.valor} tendencia={kpi.tendencia} icono={kpi.icono} />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Proximas Clases</Text>
        {(clases || []).slice(0, 5).map((clase: any) => (
          <View key={clase.id} style={styles.claseCard}>
            <Ionicons name="calendar-outline" size={24} color={COLORS.info} />
            <View style={styles.claseInfo}>
              <Text style={styles.claseTitulo}>{clase.titulo}</Text>
              <Text style={styles.claseFecha}>{clase.fecha} - {clase.hora}</Text>
              <Text style={styles.claseCurso}>{clase.curso_titulo}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  kpiItem: { width: '48%' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  claseCard: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border, gap: 12, alignItems: 'center',
  },
  claseInfo: { flex: 1 },
  claseTitulo: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  claseFecha: { fontSize: 13, color: COLORS.info, marginTop: 2 },
  claseCurso: { fontSize: 13, color: COLORS.textSecondary },
});
