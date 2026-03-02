import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { API_BASE_URL } from '../config/api';

export default function AdminLogsScreen() {
  const [type, setType] = useState('');   // WORKER | VISITOR
  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [from, setFrom] = useState('');   // 2026-03-01
  const [to, setTo] = useState('');       // 2026-03-02

  const buildParams = (extra = {}) => {
    const q = new URLSearchParams();
    if (type) q.append('type', type);
    if (name) q.append('name', name);
    if (area) q.append('area', area);
    if (from) q.append('from', from);
    if (to) q.append('to', to);

    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length > 0) q.append(k, v);
    });

    return q.toString();
  };

  const showEntradas = async () => {
    try {
      const qs = buildParams({ action: 'ENTRADA' });
      const res = await fetch(`${API_BASE_URL}/logs?${qs}`);
      const data = await res.json();
      const n = data?.rows?.length || 0;
      Alert.alert('ENTRADAS', `Encontré ${n} registros (según filtros).`);
    } catch {
      Alert.alert('Error', 'No pude conectar al backend.');
    }
  };

  const showSalidas = async () => {
    try {
      const qs = buildParams({ action: 'SALIDA' });
      const res = await fetch(`${API_BASE_URL}/logs?${qs}`);
      const data = await res.json();
      const n = data?.rows?.length || 0;
      Alert.alert('SALIDAS', `Encontré ${n} registros (según filtros).`);
    } catch {
      Alert.alert('Error', 'No pude conectar al backend.');
    }
  };

  const exportEventos = () => {
    const qs = buildParams();
    const url = `${API_BASE_URL}/export/logs.xlsx?${qs}`;
    Alert.alert('Excel (EVENTOS)', 'Copia y abre en Chrome (Mac):\n\n' + url);
  };

  const exportConcentrado = () => {
    const qs = buildParams();
    const url = `${API_BASE_URL}/export/concentrado.xlsx?${qs}`;
    Alert.alert('Excel (CONCENTRADO)', 'Copia y abre en Chrome (Mac):\n\n' + url);
  };

  const Btn = ({ title, onPress, bg = '#111' }) => (
    <TouchableOpacity onPress={onPress} style={{ backgroundColor: bg, padding: 14, borderRadius: 10, marginBottom: 10 }}>
      <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 12 }}>Logs + Exportar</Text>

      <TextInput
        placeholder="type: WORKER o VISITOR (opcional)"
        value={type}
        onChangeText={setType}
        autoCapitalize="characters"
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Buscar nombre (opcional)"
        value={name}
        onChangeText={setName}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Área (solo workers, opcional)"
        value={area}
        onChangeText={setArea}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 10 }}
      />

      <TextInput
        placeholder="from: 2026-03-01 (opcional)"
        value={from}
        onChangeText={setFrom}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 10 }}
      />

      <TextInput
        placeholder="to: 2026-03-02 (opcional)"
        value={to}
        onChangeText={setTo}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 14 }}
      />

      <Btn title="Ver ENTRADAS" onPress={showEntradas} bg="#222" />
      <Btn title="Ver SALIDAS" onPress={showSalidas} bg="#444" />

      <View style={{ height: 10 }} />

      <Btn title="Exportar Excel (EVENTOS)" onPress={exportEventos} bg="#111" />
      <Btn title="Exportar Excel (CONCENTRADO Entrada/Salida)" onPress={exportConcentrado} bg="#0b5" />

      <Text style={{ marginTop: 10, color: '#666' }}>
        Tip: abre el link en tu Mac (Chrome) y se descarga el Excel.
      </Text>
    </ScrollView>
  );
}