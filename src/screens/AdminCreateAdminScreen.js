import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { createAdmin } from '../db/database';

export default function AdminCreateAdminScreen({ navigation, route }) {
  const admin = route?.params?.admin;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!admin?.id) navigation.replace('AdminLogin');
  }, [admin, navigation]);

  if (!admin?.id) return null;

  const handleCreate = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Error', 'Completa usuario y contraseña');
      return;
    }

    try {
      await createAdmin(username, password);
      Alert.alert('Listo', 'Administrador creado ✅');
      setUsername('');
      setPassword('');
      navigation.goBack();
    } catch (e) {
      const msg = String(e?.message || e);
      if (msg.toLowerCase().includes('unique')) Alert.alert('Error', 'Ese admin ya existe');
      else Alert.alert('Error', msg);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 22, fontWeight: '900', marginBottom: 12 }}>
        Crear administrador
      </Text>

      <TextInput
        placeholder="Usuario"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 12, marginBottom: 12 }}
      />

      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 12, marginBottom: 16 }}
      />

      <TouchableOpacity
        onPress={handleCreate}
        style={{ backgroundColor: '#111', padding: 14, borderRadius: 12 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '900' }}>
          Crear
        </Text>
      </TouchableOpacity>
    </View>
  );
}