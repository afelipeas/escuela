import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../../store/authStore';
import { COLORS } from '../../utils/constants';

export default function RegistroScreen({ navigation }: any) {
  const { register } = useAuth();
  const [form, setForm] = useState({ nombre_usuario: '', nombre: '', apellido: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim()) {
      Alert.alert('Error', 'Nombre, email y contrasena son obligatorios');
      return;
    }
    setLoading(true);
    const result = await register({ ...form, rol: 'cliente' });
    setLoading(false);
    if (result.ok) {
      Alert.alert('Exito', 'Cuenta creada. Ahora inicia sesion.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', result.error || 'No se pudo registrar');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>Escuela Dominical Virtual</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nombre de usuario</Text>
          <TextInput style={styles.input} value={form.nombre_usuario} onChangeText={(v) => update('nombre_usuario', v)} placeholder="usuario123" autoCapitalize="none" />

          <Text style={styles.label}>Nombre *</Text>
          <TextInput style={styles.input} value={form.nombre} onChangeText={(v) => update('nombre', v)} placeholder="Juan" />

          <Text style={styles.label}>Apellido</Text>
          <TextInput style={styles.input} value={form.apellido} onChangeText={(v) => update('apellido', v)} placeholder="Perez" />

          <Text style={styles.label}>Email *</Text>
          <TextInput style={styles.input} value={form.email} onChangeText={(v) => update('email', v)} placeholder="tu@email.com" keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Contrasena *</Text>
          <TextInput style={styles.input} value={form.password} onChangeText={(v) => update('password', v)} placeholder="Minimo 6 caracteres" secureTextEntry />

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Creando...' : 'Crear Cuenta'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Ya tienes cuenta? Inicia sesion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: COLORS.text },
  subtitle: { fontSize: 16, textAlign: 'center', color: COLORS.textSecondary, marginBottom: 32 },
  form: { gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 8 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, padding: 14, fontSize: 16, color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: COLORS.primary, marginTop: 16, fontSize: 14, marginBottom: 40 },
});
