import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function AdminHomeScreen({ navigation, route }) {
  const admin = route?.params?.admin;

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 26, fontWeight: '800', marginBottom: 8 }}>
        Panel Admin
      </Text>
      <Text style={{ marginBottom: 24, color: '#555' }}>
        Sesión: {admin?.username || 'admin'}
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('AdminLogs')}
        style={{ backgroundColor: '#111', padding: 14, borderRadius: 10, marginBottom: 12 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>
          Ver registros (entradas/salidas)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('AdminCreateWorker')}
        style={{ backgroundColor: '#444', padding: 14, borderRadius: 10, marginBottom: 12 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>
          Registrar trabajador
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('AdminCreateAdmin')}
        style={{ backgroundColor: '#444', padding: 14, borderRadius: 10, marginBottom: 12 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>
          Crear otro administrador
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.replace('Main')}
        style={{ marginTop: 20, padding: 14, borderRadius: 10, borderWidth: 1 }}
      >
        <Text style={{ textAlign: 'center', fontWeight: '700' }}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
}