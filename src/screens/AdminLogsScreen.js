import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { getLogsByType } from '../db/database';

function groupByDate(logs) {
  const map = {};
  for (const l of logs) {
    const d = new Date(l.ts);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!map[key]) map[key] = [];
    map[key].push(l);
  }
  return map;
}

export default function AdminLogsScreen() {
  const [tab, setTab] = useState('WORKER'); // WORKER | VISITOR
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    (async () => {
      const rows = await getLogsByType(tab);
      setLogs(rows);
    })();
  }, [tab]);

  const grouped = useMemo(() => groupByDate(logs), [logs]);
  const dates = useMemo(() => Object.keys(grouped).sort().reverse(), [grouped]);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TouchableOpacity
          onPress={() => setTab('WORKER')}
          style={{ flex: 1, backgroundColor: tab === 'WORKER' ? '#111' : '#777', padding: 12, borderRadius: 10 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Trabajadores</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab('VISITOR')}
          style={{ flex: 1, backgroundColor: tab === 'VISITOR' ? '#111' : '#777', padding: 12, borderRadius: 10 }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: '700' }}>Visitantes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {dates.length === 0 ? (
          <Text style={{ opacity: 0.7, marginTop: 20 }}>Sin registros aún.</Text>
        ) : (
          dates.map((date) => (
            <View key={date} style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 6 }}>{date}</Text>

              {grouped[date].map((l) => {
                const hhmm = new Date(l.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <View key={l.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' }}>
                    <Text style={{ fontWeight: '700' }}>
                      {hhmm} — {l.full_name} — {l.action === 'IN' ? 'ENTRADA' : 'SALIDA'}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}