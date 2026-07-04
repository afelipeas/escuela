import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clasesAPI, cursosAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';

export default function CrearClaseScreen({ navigation }: any) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ titulo: '', id_curso: '', fecha: '', hora: '', descripcion: '' });

  const { data: cursos } = useQuery({
    queryKey: ['docente-cursos-select'],
    queryFn: async () => { const r = await cursosAPI.getMisCursos(); return r.data.datos || []; },
  });

  const crear = useMutation({
    mutationFn: (data: any) => clasesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docente-clases'] });
      Alert.alert('Exito', 'Clase creada correctamente');
      navigation.goBack();
    },
    onError: () => Alert.alert('Error', 'No se pudo crear la clase'),
  });

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.label}>Titulo *</Text>
      <TextInput style={styles.input} value={form.titulo} onChangeText={(v) => update('titulo', v)} placeholder="Titulo de la clase" />

      <Text style={styles.label}>Curso *</Text>
      <View style={styles.selectContainer}>
        {(cursos || []).map((c: any) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.selectItem, form.id_curso === String(c.id) && styles.selectActive]}
            onPress={() => update('id_curso', String(c.id))}
          >
            <Text style={[styles.selectText, form.id_curso === String(c.id) && styles.selectTextActive]}>{c.titulo}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Fecha (YYYY-MM-DD) *</Text>
      <TextInput style={styles.input} value={form.fecha} onChangeText={(v) => update('fecha', v)} placeholder="2026-07-15" />

      <Text style={styles.label}>Hora (HH:MM) *</Text>
      <TextInput style={styles.input} value={form.hora} onChangeText={(v) => update('hora', v)} placeholder="10:00" />

      <Text style={styles.label}>Descripcion</Text>
      <TextInput style={[styles.input, { height: 80 }]} value={form.descripcion} onChangeText={(v) => update('descripcion', v)} multiline placeholder="Descripcion opcional" />

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (!form.titulo || !form.id_curso || !form.fecha || !form.hora) {
            Alert.alert('Error', 'Completa titulo, curso, fecha y hora');
            return;
          }
          crear.mutate({ titulo: form.titulo, id_curso: Number(form.id_curso), fecha: form.fecha, hora: form.hora, descripcion: form.descripcion });
        }}
      >
        <Text style={styles.buttonText}>{crear.isPending ? 'Creando...' : 'Crear Clase'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginTop: 12 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 14, fontSize: 15, marginTop: 6,
  },
  selectContainer: { gap: 6, marginTop: 6 },
  selectItem: {
    padding: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  selectActive: { borderColor: COLORS.info, backgroundColor: '#EFF6FF' },
  selectText: { fontSize: 14, color: COLORS.text },
  selectTextActive: { color: COLORS.info, fontWeight: '600' },
  button: {
    backgroundColor: COLORS.info, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
