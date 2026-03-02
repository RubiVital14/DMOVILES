import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../config/api';

export default function AdminCreateWorkerScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [area, setArea] = useState('');
  const [email, setEmail] = useState('');
  const [faceKey, setFaceKey] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    try {
      if (!fullName.trim() || !area.trim()) {
        Alert.alert('Error', 'Nombre y área son obligatorios');
        return;
      }

      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/workers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          area: area.trim(),
          email: email.trim() || null,
          face_key: faceKey.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      Alert.alert('Listo ✅', `Trabajador registrado\nNo. Empleado: ${data.employee_no}`);
      setFullName('');
      setArea('');
      setEmail('');
      setFaceKey('');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error al guardar', String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '800', marginBottom: 12 }}>Registrar trabajador</Text>
      <Text style={{ color: '#666', marginBottom: 18 }}>El número de empleado se asigna automáticamente.</Text>

      <TextInput
        placeholder="Nombre completo"
        value={fullName}
        onChangeText={setFullName}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Área (ej. Almacén)"
        value={area}
        onChangeText={setArea}
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Correo (opcional)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 10 }}
      />

      <TextInput
        placeholder="faceKey (opcional)"
        value={faceKey}
        onChangeText={setFaceKey}
        autoCapitalize="characters"
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 14 }}
      />

      <TouchableOpacity
        onPress={loading ? null : save}
        style={{ backgroundColor: '#111', padding: 14, borderRadius: 10, alignItems: 'center', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? <ActivityIndicator /> : <Text style={{ color: 'white', fontWeight: '700' }}>Guardar</Text>}
      </TouchableOpacity>
    </View>
  );
}