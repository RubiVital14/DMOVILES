// src/screens/AdminCreateWorkerScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { createWorker } from '../db/database';

export default function AdminCreateWorkerScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [faceKey, setFaceKey] = useState('');

  const handleSave = async () => {
    try {
      await createWorker(fullName, faceKey);
      Alert.alert('Listo', 'Trabajador registrado');
      setFullName('');
      setFaceKey('');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', String(e?.message || e));
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 20 }}>Registrar trabajador</Text>

      <TextInput
        placeholder="Nombre completo (ej. Alfonso García)"
        value={fullName}
        onChangeText={setFullName}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 10 }}
      />

      <TextInput
        placeholder="faceKey (MVP: ej. ALFONSO_001)"
        value={faceKey}
        onChangeText={setFaceKey}
        autoCapitalize="characters"
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 14 }}
      />

      <TouchableOpacity
        onPress={handleSave}
        style={{ backgroundColor: '#111', padding: 14, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}