import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ventasAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';
import KPICard from '../../components/common/KPICard';

export default function VendedorDashboardScreen() {
  const { data: resumen } = useQuery({
    queryKey: ['vendedor-resumen'],
    queryFn: async () => { const r = await ventasAPI.getResumenAdmin(); return r.data.datos || []; },
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  kpiItem: { width: '48%' },
});
