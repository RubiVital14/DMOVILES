// src/screens/WorkerScanScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { getWorkers, logWorker } from '../db/database';

export default function WorkerScanScreen({ navigation }) {
  const [workers, setWorkers] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    (async () => {
      const w = await getWorkers();
      setWorkers(w);
      setIdx(0);
    })();
  }, []);

  const current = workers[idx];

  const scan = async (action) => {
    if (!current) {
      Alert.alert('Error', 'No hay trabajadores registrados (el admin debe registrarlos).');
      return;
    }
    const name = await logWorker(current.face_key, action);
    if (!name) {
      Alert.alert('Error', 'No reconocido');
      return;
    }
    if (action === 'ENTRADA') Alert.alert('✅', `Hola ${name}, bienvenido`);
    else Alert.alert('✅', `Hasta luego ${name}`);
    navigation.replace('Main');
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 12 }}>
        Escaneo trabajador (MVP)
      </Text>

      <Text style={{ marginBottom: 16, color: '#555' }}>
        Simulación: selecciona trabajador y registra entrada/salida.
      </Text>

      <View style={{ padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, marginBottom: 14 }}>
        <Text style={{ fontWeight: '700' }}>Seleccionado:</Text>
        <Text>{current ? `${current.full_name} (${current.face_key})` : '—'}</Text>

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
        onPress={() => scan('ENTRADA')}
        style={{ backgroundColor: '#111', padding: 14, borderRadius: 8, marginBottom: 12, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Registrar ENTRADA</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => scan('SALIDA')}
        style={{ backgroundColor: '#444', padding: 14, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Registrar SALIDA</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace('Main')} style={{ marginTop: 18, alignItems: 'center' }}>
        <Text>Regresar</Text>
      </TouchableOpacity>
    </View>
  );
}