// src/screens/AdminLoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { adminLogin } from '../db/database';

export default function AdminLoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Error', 'Completa usuario y contraseña');
      return;
    }
    const ok = await adminLogin(username, password);
    if (!ok) {
      Alert.alert('Error', 'Credenciales incorrectas');
      return;
    }
    navigation.replace('AdminHome');
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 26, fontWeight: '800', marginBottom: 20 }}>Admin</Text>

      <TextInput
        placeholder="usuario"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 10 }}
      />

      <TextInput
        placeholder="contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 14 }}
      />

      <TouchableOpacity
        onPress={handleLogin}
        style={{ backgroundColor: '#111', padding: 14, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}