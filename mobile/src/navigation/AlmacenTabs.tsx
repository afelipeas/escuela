import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import AlmacenDashboardScreen from '../screens/almacen/AlmacenDashboardScreen';
import AlmacenComprasScreen from '../screens/almacen/AlmacenComprasScreen';
import ProveedoresScreen from '../screens/almacen/ProveedoresScreen';
import AlmacenReportesScreen from '../screens/almacen/AlmacenReportesScreen';

const Tab = createBottomTabNavigator();

export default function AlmacenTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          if (route.name === 'Inicio') iconName = 'cube';
          else if (route.name === 'Compras') iconName = 'receipt';
          else if (route.name === 'Proveedores') iconName = 'business';
          else if (route.name === 'Reportes') iconName = 'bar-chart';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: COLORS.muted,
      })}
    >
      <Tab.Screen name="Inicio" component={AlmacenDashboardScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#DC2626' }, headerTintColor: '#fff', title: 'Almacen' }} />
      <Tab.Screen name="Compras" component={AlmacenComprasScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#DC2626' }, headerTintColor: '#fff', title: 'Compras' }} />
      <Tab.Screen name="Proveedores" component={ProveedoresScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#DC2626' }, headerTintColor: '#fff', title: 'Proveedores' }} />
      <Tab.Screen name="Reportes" component={AlmacenReportesScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#DC2626' }, headerTintColor: '#fff', title: 'Reportes' }} />
    </Tab.Navigator>
  );
}
