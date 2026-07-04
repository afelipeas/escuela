import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { usuariosAPI } from '../../api/endpoints';
import { COLORS, COLORES_ROL } from '../../utils/constants';

export default function UsuariosScreen() {
  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => { const r = await usuariosAPI.getAll(); return r.data.datos || []; },
  });

  return (
    <FlatList
      style={styles.container}
      data={usuarios}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={[styles.avatar, { backgroundColor: COLORES_ROL[item.rol] || COLORS.primary }]}>
            <Text style={styles.avatarText}>{item.nombre?.charAt(0) || '?'}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.nombre}>{item.nombre} {item.apellido || ''}</Text>
            <Text style={styles.email}>{item.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{item.rol}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
        </View>
      )}
      ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No hay usuarios</Text> : null}
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
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  email: { fontSize: 13, color: COLORS.textSecondary },
  roleBadge: {
    alignSelf: 'flex-start', marginTop: 4, backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  roleText: { color: COLORS.primary, fontSize: 11, fontWeight: '600' },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 40 },
});
