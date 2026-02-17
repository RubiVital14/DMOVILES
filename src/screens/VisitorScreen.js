// src/screens/VisitorScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { registerVisitor, visitorExit } from '../db/database';

export default function VisitorScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [reason, setReason] = useState('');
  const [visitorId, setVisitorId] = useState(null);

  const handleRegister = async () => {
    try {
      const id = await registerVisitor(fullName, reason);
      setVisitorId(id);
      Alert.alert('Listo', 'Registro de entrada guardado');
      setFullName('');
      setReason('');
    } catch (e) {
      Alert.alert('Error', String(e?.message || e));
    }
  };

  const handleExit = async () => {
    try {
      if (!visitorId) {
        Alert.alert('Error', 'Primero registra un visitante (entrada).');
        return;
      }
      await visitorExit(visitorId);
      Alert.alert('Listo', 'Salida guardada');
      setVisitorId(null);
      navigation.replace('Main');
    } catch (e) {
      Alert.alert('Error', String(e?.message || e));
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: '800', marginBottom: 18 }}>Visitante</Text>

      <TextInput
        placeholder="Nombre completo"
        value={fullName}
        onChangeText={setFullName}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Motivo de visita"
        value={reason}
        onChangeText={setReason}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 14 }}
      />

      <TouchableOpacity
        onPress={handleRegister}
        style={{ backgroundColor: 'green', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Registrar ENTRADA</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleExit}
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