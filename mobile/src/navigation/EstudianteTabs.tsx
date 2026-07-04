import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import EstudianteDashboardScreen from '../screens/estudiante/EstudianteDashboardScreen';
import ExplorarCursosScreen from '../screens/estudiante/ExplorarCursosScreen';
import LogrosScreen from '../screens/estudiante/LogrosScreen';
import AulaCursoScreen from '../screens/aula/AulaCursoScreen';
import AulaLeccionScreen from '../screens/aula/AulaLeccionScreen';
import NotificacionesScreen from '../screens/shared/NotificacionesScreen';
import PerfilScreen from '../screens/shared/PerfilScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }}>
      <Stack.Screen name="EstudianteDashboard" component={EstudianteDashboardScreen} options={{ title: 'Mi Escuela' }} />
      <Stack.Screen name="AulaCurso" component={AulaCursoScreen} options={{ title: 'Curso' }} />
      <Stack.Screen name="AulaLeccion" component={AulaLeccionScreen} options={{ title: 'Leccion' }} />
      <Stack.Screen name="Notificaciones" component={NotificacionesScreen} options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Mi Perfil' }} />
    </Stack.Navigator>
  );
}

function CursosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }}>
      <Stack.Screen name="ExplorarCursos" component={ExplorarCursosScreen} options={{ title: 'Explorar Cursos' }} />
      <Stack.Screen name="AulaCurso" component={AulaCursoScreen} options={{ title: 'Curso' }} />
      <Stack.Screen name="AulaLeccion" component={AulaLeccionScreen} options={{ title: 'Leccion' }} />
    </Stack.Navigator>
  );
}

function LogrosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }}>
      <Stack.Screen name="Logros" component={LogrosScreen} options={{ title: 'Mis Logros' }} />
    </Stack.Navigator>
  );
}

export default function EstudianteTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          if (route.name === 'Dashboard') iconName = 'school';
          else if (route.name === 'Cursos') iconName = 'book';
          else if (route.name === 'LogrosTab') iconName = 'trophy';
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardStack} />
      <Tab.Screen name="Cursos" component={CursosStack} />
      <Tab.Screen name="LogrosTab" component={LogrosStack} options={{ title: 'Logros' }} />
    </Tab.Navigator>
  );
}
