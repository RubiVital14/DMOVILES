import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { clearUsers, getAllUsers } from '../db/database';

export default function HomeScreen({ route, navigation }) {
  const { username, role } = route.params;

  const handleLogout = () => {
    navigation.replace('Login');
  };

  const handleClear = async () => {
    await clearUsers();
    Alert.alert('Listo', 'Usuarios borrados');
    navigation.replace('Login');
  };

  const handleShowUsers = async () => {
    try {
      const users = await getAllUsers();
      Alert.alert('Usuarios', JSON.stringify(users, null, 2));
      console.log('USERS:', users);
    } catch (e) {
      Alert.alert('Error', String(e?.message || e));
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>
        Bienvenida, {username}
      </Text>
      <Text style={{ marginTop: 8 }}>Rol: {role}</Text>

      <TouchableOpacity
        onPress={handleLogout}
        style={{ marginTop: 20, backgroundColor: '#111', padding: 14, borderRadius: 10, width: 200 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleClear}
        style={{ marginTop: 10, backgroundColor: '#444', padding: 14, borderRadius: 10, width: 200 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
          (DEV) Borrar usuarios
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleShowUsers}
        style={{ marginTop: 10, backgroundColor: '#777', padding: 14, borderRadius: 10, width: 200 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
          (DEV) Ver usuarios
        </Text>
      </TouchableOpacity>
    </View>
  );
}