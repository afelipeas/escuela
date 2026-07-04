import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import ClienteDashboardScreen from '../screens/cliente/ClienteDashboardScreen';
import PedidosScreen from '../screens/cliente/PedidosScreen';
import AyudaScreen from '../screens/cliente/AyudaScreen';
import TiendaCatalogoScreen from '../screens/tienda/TiendaCatalogoScreen';
import TiendaDetalleScreen from '../screens/tienda/TiendaDetalleScreen';
import TiendaCarritoScreen from '../screens/tienda/TiendaCarritoScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TiendaStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }}>
      <Stack.Screen name="TiendaCatalogo" component={TiendaCatalogoScreen} options={{ title: 'Tienda' }} />
      <Stack.Screen name="TiendaDetalle" component={TiendaDetalleScreen} options={{ title: 'Producto' }} />
      <Stack.Screen name="TiendaCarrito" component={TiendaCarritoScreen} options={{ title: 'Carrito' }} />
    </Stack.Navigator>
  );
}

export default function ClienteTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          if (route.name === 'Inicio') iconName = 'home';
          else if (route.name === 'Pedidos') iconName = 'receipt';
          else if (route.name === 'Tienda') iconName = 'cart';
          else if (route.name === 'Ayuda') iconName = 'help-circle';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: COLORS.muted,
      })}
    >
      <Tab.Screen name="Inicio" component={ClienteDashboardScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#6366F1' }, headerTintColor: '#fff', title: 'Mi Cuenta' }} />
      <Tab.Screen name="Pedidos" component={PedidosScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#6366F1' }, headerTintColor: '#fff', title: 'Mis Pedidos' }} />
      <Tab.Screen name="Tienda" component={TiendaStack} />
      <Tab.Screen name="Ayuda" component={AyudaScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#6366F1' }, headerTintColor: '#fff', title: 'Ayuda' }} />
    </Tab.Navigator>
  );
}
