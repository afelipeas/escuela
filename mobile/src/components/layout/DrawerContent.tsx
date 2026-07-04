import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../store/authStore';
import { COLORS, ROLES_LABELS } from '../../utils/constants';

const menuByRole: Record<string, { label: string; icon: string; route: string }[]> = {
  admin: [
    { label: 'Dashboard', icon: 'grid', route: 'AdminTabs' },
  ],
  docente: [
    { label: 'Dashboard', icon: 'grid', route: 'DocenteTabs' },
  ],
  estudiante: [
    { label: 'Dashboard', icon: 'grid', route: 'EstudianteTabs' },
  ],
  vendedor: [
    { label: 'Dashboard', icon: 'grid', route: 'VendedorTabs' },
  ],
  almacen: [
    { label: 'Dashboard', icon: 'grid', route: 'AlmacenTabs' },
  ],
  cliente: [
    { label: 'Dashboard', icon: 'grid', route: 'ClienteTabs' },
  ],
};

export default function DrawerContent(props: any) {
  const { user, logout } = useAuth();
  const items = menuByRole[user?.rol || 'cliente'] || [];

  return (
    <DrawerContentScrollView {...props} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.nombre?.charAt(0) || '?'}</Text>
        </View>
        <Text style={styles.userName}>{user?.nombre}</Text>
        <Text style={styles.userRole}>{ROLES_LABELS[user?.rol || ''] || user?.rol}</Text>
      </View>

      <View style={styles.menuSection}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.menuItem}
            onPress={() => props.navigation.navigate(item.route)}
          >
            <Ionicons name={item.icon as any} size={22} color={COLORS.text} />
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.divider} />

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          props.navigation.closeDrawer();
          logout();
        }}
      >
        <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
        <Text style={[styles.menuLabel, { color: COLORS.danger }]}>Cerrar Sesion</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  userName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  userRole: { fontSize: 14, color: COLORS.textSecondary, marginTop: 2 },
  menuSection: { paddingVertical: 8 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 20, gap: 14,
  },
  menuLabel: { fontSize: 16, color: COLORS.text },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 8 },
});
