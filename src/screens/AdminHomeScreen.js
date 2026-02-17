import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function AdminHomeScreen({ navigation, route }) {
  const adminUser = route?.params?.adminUser || 'admin';

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '800' }}>Bienvenida, {adminUser}</Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('AdminCreateWorker')}
        style={{ backgroundColor: '#111', padding: 14, borderRadius: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Registrar trabajador</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('AdminLogs')}
        style={{ backgroundColor: '#444', padding: 14, borderRadius: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Historial</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.replace('Main')}
        style={{ backgroundColor: '#888', padding: 14, borderRadius: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}