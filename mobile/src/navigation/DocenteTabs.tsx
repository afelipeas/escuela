import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import DocenteDashboardScreen from '../screens/docente/DocenteDashboardScreen';
import DocenteCursosScreen from '../screens/docente/DocenteCursosScreen';
import CrearClaseScreen from '../screens/docente/CrearClaseScreen';
import AlumnosScreen from '../screens/docente/AlumnosScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#2563EB' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="DocenteDashboard" component={DocenteDashboardScreen} options={{ title: 'Panel Docente' }} />
    </Stack.Navigator>
  );
}

function CursosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#2563EB' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="DocenteCursos" component={DocenteCursosScreen} options={{ title: 'Mis Cursos' }} />
    </Stack.Navigator>
  );
}

export default function DocenteTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          if (route.name === 'Inicio') iconName = 'school';
          else if (route.name === 'Cursos') iconName = 'book';
          else if (route.name === 'Clase') iconName = 'add-circle';
          else if (route.name === 'Alumnos') iconName = 'people';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: COLORS.muted,
      })}
    >
      <Tab.Screen name="Inicio" component={DashboardStack} />
      <Tab.Screen name="Cursos" component={CursosStack} />
      <Tab.Screen name="Clase" component={CrearClaseScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#2563EB' }, headerTintColor: '#fff', title: 'Nueva Clase' }} />
      <Tab.Screen name="Alumnos" component={AlumnosScreen} options={{ headerShown: true, headerStyle: { backgroundColor: '#2563EB' }, headerTintColor: '#fff', title: 'Alumnos' }} />
    </Tab.Navigator>
  );
}
