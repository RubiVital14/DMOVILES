import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { API_BASE_URL } from '../config/api';

export default function WorkerScanScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/workers`);
        const data = await res.json();
        setWorkers(data.rows || []);
        setIdx(0);
      } catch {
        Alert.alert('Error', 'No pude conectar con el backend. ¿Está prendido el FastAPI?');
      }
    })();
  }, []);

  const current = workers[idx];

  const sendLog = async (action) => {
    try {
      if (!current) {
        Alert.alert('Error', 'No hay trabajadores registrados.');
        return;
      }
      const res = await fetch(`${API_BASE_URL}/worker-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_no: current.employee_no, action }),
      });
      const data = await res.json();
      if (!data.ok) {
        Alert.alert('Error', 'No encontrado');
        return;
      }
      Alert.alert('✅', `${action}: ${data.name}`);
      navigation.replace('Main');
    } catch {
      Alert.alert('Error', 'No pude registrar. Revisa el backend.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 12 }}>Trabajador</Text>

      <View style={{ padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, marginBottom: 14 }}>
        <Text style={{ fontWeight: '700' }}>Seleccionado:</Text>
        <Text>
          {current ? `#${current.employee_no} - ${current.full_name} (${current.area})` : '—'}
        </Text>

        <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
          <TouchableOpacity
            onPress={() => setIdx((p) => Math.max(0, p - 1))}
            style={{ backgroundColor: '#eee', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' }}
          >
            <Text>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIdx((p) => Math.min(workers.length - 1, p + 1))}
            style={{ backgroundColor: '#eee', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' }}
          >
            <Text>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={() => sendLog('ENTRADA')}
        style={{ backgroundColor: '#111', padding: 14, borderRadius: 8, marginBottom: 12, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Registrar ENTRADA</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => sendLog('SALIDA')}
        style={{ backgroundColor: '#444', padding: 14, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Registrar SALIDA</Text>
      </TouchableOpacity>
    </View>
  );
}