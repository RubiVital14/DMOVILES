import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { loginUser, getAllUsers } from '../db/database';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    const u = username.trim().toLowerCase();
    const p = password;

    if (!u || !p) {
      Alert.alert('Error', 'Completa todo');
      return;
    }

    try {
      const rows = await loginUser(u, p);

      if (rows.length > 0) {
        navigation.replace('Home', { username: u, role: rows[0].role });
      } else {
        Alert.alert('Error', 'Usuario o contraseña incorrectos');
      }
    } catch (e) {
      Alert.alert('Error', String(e?.message || e));
    }
  };

  const handleDevUsers = async () => {
    try {
      const users = await getAllUsers();
      Alert.alert('Usuarios en BD', JSON.stringify(users, null, 2));
    } catch (e) {
      Alert.alert('Error DEV', String(e?.message || e));
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 20 }}>Login</Text>

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
        onPress={handleLogin}
        style={{ marginTop: 16, backgroundColor: '#111', padding: 14, borderRadius: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace('Register')} style={{ marginTop: 12 }}>
        <Text style={{ textAlign: 'center' }}>Crear cuenta</Text>
      </TouchableOpacity>

      {/* DEV */}
      <TouchableOpacity
        onPress={handleDevUsers}
        style={{ marginTop: 18, backgroundColor: '#444', padding: 12, borderRadius: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>(DEV) Ver usuarios</Text>
      </TouchableOpacity>
    </View>
  );
}