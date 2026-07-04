import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../api/endpoints';
import { UserRole } from '../types/models';

interface User {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (datos: any) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => ({ ok: false }),
  register: async () => ({ ok: false }),
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync('perfil_usuario');
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch {
        await SecureStore.deleteItemAsync('perfil_usuario');
        await SecureStore.deleteItemAsync('auth_token');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await authAPI.login(email, password);
      if (res.data.ok && res.data.datos?.token) {
        await SecureStore.setItemAsync('auth_token', res.data.datos.token);
        const perfil = {
          id: res.data.datos.usuario.id,
          nombre: res.data.datos.usuario.nombre,
          email: res.data.datos.usuario.email,
          rol: res.data.datos.usuario.rol,
        };
        await SecureStore.setItemAsync('perfil_usuario', JSON.stringify(perfil));
        setUser(perfil);
        return { ok: true };
      }
      return { ok: false, error: res.data.mensaje || 'Credenciales incorrectas' };
    } catch (err: any) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        return { ok: false, error: 'El servidor no responde. Intenta de nuevo en unos segundos.' };
      }
      if (!err.response) {
        return { ok: false, error: 'Error de conexion' };
      }
      const msg = err.response?.data?.mensaje || 'Error del servidor';
      return { ok: false, error: msg };
    }
  }, []);

  const register = useCallback(async (datos: any) => {
    try {
      const res = await authAPI.registro(datos);
      if (res.data.ok) {
        return { ok: true };
      }
      return { ok: false, error: res.data.mensaje || 'Error al registrar' };
    } catch (err: any) {
      const msg = err.response?.data?.mensaje || 'Error de conexion';
      return { ok: false, error: msg };
    }
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('perfil_usuario');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
