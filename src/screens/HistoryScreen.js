// src/screens/HistoryScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { getLogs } from '../db/database';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function HistoryScreen() {
  const [tab, setTab] = useState('WORKER');
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    (async () => {
      const rows = await getLogs(tab);
      setLogs(rows);
    })();
  }, [tab]);

  return (
    <View style={{ flex: 1, padding: 14 }}>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <TouchableOpacity
          onPress={() => setTab('WORKER')}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            backgroundColor: tab === 'WORKER' ? '#111' : '#ddd',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: tab === 'WORKER' ? 'white' : '#111', fontWeight: '700' }}>Trabajadores</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('VISITOR')}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 8,
            backgroundColor: tab === 'VISITOR' ? '#111' : '#ddd',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: tab === 'VISITOR' ? 'white' : '#111', fontWeight: '700' }}>Visitantes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {logs.length === 0 ? (
          <Text style={{ color: '#555' }}>No hay registros.</Text>
        ) : (
          logs.map((l) => (
            <View key={l.id} style={{ padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginBottom: 10 }}>
              <Text style={{ fontWeight: '800' }}>{l.full_name} — {l.action}</Text>
              <Text style={{ color: '#555' }}>{formatDate(l.at)}</Text>

              {tab === 'VISITOR' && (
                <Text style={{ marginTop: 6 }}>
                  <Text style={{ fontWeight: '700' }}>Motivo:</Text> {l.reason || '—'}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}