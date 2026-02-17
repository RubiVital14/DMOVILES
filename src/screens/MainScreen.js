// src/screens/MainScreen.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function MainScreen({ navigation }) {
  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 8 }}>Kiosko</Text>
      <Text style={{ marginBottom: 24, color: '#555' }}>Selecciona tu rol</Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('AdminLogin')}
        style={{ backgroundColor: '#111', padding: 14, borderRadius: 8, marginBottom: 12, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Administrador</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('WorkerScan')}
        style={{ backgroundColor: '#444', padding: 14, borderRadius: 8, marginBottom: 12, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Trabajador</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Visitor')}
        style={{ backgroundColor: 'green', padding: 14, borderRadius: 8, alignItems: 'center' }}
      >
        <Text style={{ color: 'white', fontWeight: '700' }}>Visitante</Text>
      </TouchableOpacity>
    </View>
  );
}