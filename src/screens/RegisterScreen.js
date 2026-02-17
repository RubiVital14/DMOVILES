import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { registerUser } from '../db/database';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleRegister = async () => {
    const u = username.trim().toLowerCase();
    const p = password;

    if (!u || !p) {
      Alert.alert('Error', 'Completa todo');
      return;
    }

    try {
      await registerUser(u, p, 'user');
      Alert.alert('Listo', 'Cuenta creada');
      navigation.replace('Login');
    } catch (e) {
      const msg = String(e?.message || e);

      if (msg.toLowerCase().includes('unique')) {
        Alert.alert('Error', 'Ese usuario ya existe');
      } else {
        Alert.alert('Error', msg);
      }
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 20 }}>Registro</Text>

      <TextInput
        placeholder="Usuario"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 12 }}
      />

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <TextInput
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPass}
          style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8 }}
        />
        <TouchableOpacity
          onPress={() => setShowPass(!showPass)}
          style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' }}
        >
          <Text>{showPass ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleRegister}
        style={{ marginTop: 16, backgroundColor: '#111', padding: 14, borderRadius: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Crear cuenta</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace('Login')} style={{ marginTop: 12 }}>
        <Text style={{ textAlign: 'center' }}>Ya tengo cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}