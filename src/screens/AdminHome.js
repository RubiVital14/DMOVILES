// src/screens/AdminHome.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function AdminHome({ navigation }) {
  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 26, fontWeight: '800', marginBottom: 30 }}>Panel Administrador</Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('AdminCreateWorker')}
        style={{ backgroundColor: '#111', padding: 14, borderRadius: 8, marginBottom: 12, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Registrar trabajador</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('History')}
        style={{ backgroundColor: '#444', padding: 14, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Ver historial</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.replace('Main')}
        style={{ marginTop: 18, padding: 12, alignItems: 'center' }}
      >
        <Text style={{ color: '#333' }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}