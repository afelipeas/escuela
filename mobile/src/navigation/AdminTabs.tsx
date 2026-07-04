import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import UsuariosScreen from '../screens/admin/UsuariosScreen';
import AdminProductosScreen from '../screens/admin/AdminProductosScreen';
import NotificacionesScreen from '../screens/shared/NotificacionesScreen';
import PerfilScreen from '../screens/shared/PerfilScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Panel Admin' }} />
      <Stack.Screen name="Notificaciones" component={NotificacionesScreen} options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Mi Perfil' }} />
    </Stack.Navigator>
  );
}

function UsuariosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }}>
      <Stack.Screen name="Usuarios" component={UsuariosScreen} options={{ title: 'Usuarios' }} />
    </Stack.Navigator>
  );
}

function ProductosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }}>
      <Stack.Screen name="AdminProductos" component={AdminProductosScreen} options={{ title: 'Productos' }} />
    </Stack.Navigator>
  );
}

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'grid';
          if (route.name === 'Inicio') iconName = 'grid';
          else if (route.name === 'Usuarios') iconName = 'people';
          else if (route.name === 'Productos') iconName = 'pricetags';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
      })}
    >
      <Tab.Screen name="Inicio" component={DashboardStack} />
      <Tab.Screen name="Usuarios" component={UsuariosStack} />
      <Tab.Screen name="Productos" component={ProductosStack} />
    </Tab.Navigator>
  );
}
