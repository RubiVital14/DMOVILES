import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function AdminHome({ navigation }) {
  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: 'bold', marginBottom: 20 }}>Panel Administrador</Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('AdminCreateWorker')}
        style={{ backgroundColor: '#111', padding: 14, borderRadius: 10 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>
          Registrar trabajador
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('AdminLogs')}
        style={{ backgroundColor: '#333', padding: 14, borderRadius: 10 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>
          Ver logs + Exportar Excel
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Main')} style={{ marginTop: 20, padding: 10 }}>
        <Text style={{ textAlign: 'center' }}>⬅️ Volver</Text>
      </TouchableOpacity>
    </View>
  );
}