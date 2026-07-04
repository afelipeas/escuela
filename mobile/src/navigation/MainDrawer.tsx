import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '../store/authStore';
import AdminTabs from './AdminTabs';
import DocenteTabs from './DocenteTabs';
import EstudianteTabs from './EstudianteTabs';
import VendedorTabs from './VendedorTabs';
import AlmacenTabs from './AlmacenTabs';
import ClienteTabs from './ClienteTabs';
import DrawerContent from '../components/layout/DrawerContent';

const Drawer = createDrawerNavigator();

export default function MainDrawer() {
  const { user } = useAuth();

  const getInitialRoute = () => {
    switch (user?.rol) {
      case 'admin': return 'AdminTabs';
      case 'docente': return 'DocenteTabs';
      case 'estudiante': return 'EstudianteTabs';
      case 'vendedor': return 'VendedorTabs';
      case 'almacen': return 'AlmacenTabs';
      case 'cliente': return 'ClienteTabs';
      default: return 'ClienteTabs';
    }
  };

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      initialRouteName={getInitialRoute()}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="AdminTabs" component={AdminTabs} />
      <Drawer.Screen name="DocenteTabs" component={DocenteTabs} />
      <Drawer.Screen name="EstudianteTabs" component={EstudianteTabs} />
      <Drawer.Screen name="VendedorTabs" component={VendedorTabs} />
      <Drawer.Screen name="AlmacenTabs" component={AlmacenTabs} />
      <Drawer.Screen name="ClienteTabs" component={ClienteTabs} />
    </Drawer.Navigator>
  );
}
