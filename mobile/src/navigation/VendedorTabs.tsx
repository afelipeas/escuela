import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import VendedorDashboardScreen from '../screens/vendedor/VendedorDashboardScreen';
import NuevaVentaScreen from '../screens/vendedor/NuevaVentaScreen';
import VendedorReportesScreen from '../screens/vendedor/VendedorReportesScreen';
import SoporteVendedorScreen from '../screens/vendedor/SoporteVendedorScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#D97706' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="VendedorDashboard" component={VendedorDashboardScreen} options={{ title: 'Panel Vendedor' }} />
    </Stack.Navigator>
  );
}

export default function VendedorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          if (route.name === 'Inicio') iconName = 'trending-up';
          else if (route.name === 'Venta') iconName = 'cart';
          else if (route.name === 'Reportes') iconName = 'bar-chart';
          else if (route.name === 'Soporte') iconName = 'help-circle';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#D97706',
        tabBarInactiveTintColor: COLORS.muted,
      })}
    >
      <Tab.Screen name="Inicio" component={DashboardStack} />
      <Tab.Screen name="Venta" component={NuevaVentaScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#D97706' }, headerTintColor: '#fff', title: 'Nueva Venta' }} />
      <Tab.Screen name="Reportes" component={VendedorReportesScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#D97706' }, headerTintColor: '#fff', title: 'Reportes' }} />
      <Tab.Screen name="Soporte" component={SoporteVendedorScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#D97706' }, headerTintColor: '#fff', title: 'Soporte' }} />
    </Tab.Navigator>
  );
}
