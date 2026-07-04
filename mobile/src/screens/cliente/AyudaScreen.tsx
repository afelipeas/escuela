import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, FlatList } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ayudaAPI } from '../../api/endpoints';
import { COLORS } from '../../utils/constants';

export default function AyudaScreen() {
  const queryClient = useQueryClient();
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  const { data: tickets } = useQuery({
    queryKey: ['mis-tickets'],
    queryFn: async () => { const r = await ayudaAPI.getMisTickets(); return r.data.datos || []; },
  });

  const enviar = useMutation({
    mutationFn: () => ayudaAPI.crearSolicitud({ categoria: 'general', asunto, mensaje }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-tickets'] });
      setAsunto('');
      setMensaje('');
      Alert.alert('Exito', 'Solicitud enviada');
    },
    onError: () => Alert.alert('Error', 'No se pudo enviar'),
  });

  return (
    <FlatList
      style={styles.container}
      data={tickets}
      keyExtractor={(item: any) => String(item.id || Math.random())}
      contentContainerStyle={{ padding: 16 }}
      ListHeaderComponent={
        <View style={styles.form}>
          <Text style={styles.formTitle}>Enviar Solicitud</Text>
          <TextInput style={styles.input} value={asunto} onChangeText={setAsunto} placeholder="Asunto" />
          <TextInput style={[styles.input, { height: 80 }]} value={mensaje} onChangeText={setMensaje} multiline placeholder="Tu mensaje..." />
          <TouchableOpacity style={styles.sendBtn} onPress={() => {
            if (!asunto.trim() || !mensaje.trim()) { Alert.alert('Error', 'Completa todos los campos'); return; }
            enviar.mutate();
          }}>
            <Text style={styles.sendText}>{enviar.isPending ? 'Enviando...' : 'Enviar'}</Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }: any) => (
        <View style={styles.ticketCard}>
          <Text style={styles.ticketTitle}>{item.asunto || item.accion || 'Ticket'}</Text>
          <Text style={styles.ticketMsg}>{item.detalles || item.mensaje || ''}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Aun no tienes tickets</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  form: { marginBottom: 24 },
  formTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  input: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 8,
  },
  sendBtn: {
    backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: 'center',
  },
  sendText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ticketCard: {
    backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  ticketTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  ticketMsg: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 20 },
});
