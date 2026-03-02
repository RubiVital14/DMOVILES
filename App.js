import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainScreen from './src/screens/MainScreen';
import AdminLoginScreen from './src/screens/AdminLoginScreen';
import AdminHome from './src/screens/AdminHome';
import AdminCreateWorkerScreen from './src/screens/AdminCreateWorkerScreen';
import WorkerScanScreen from './src/screens/WorkerScanScreen';
import VisitorScreen from './src/screens/VisitorScreen';
import AdminLogsScreen from './src/screens/AdminLogsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Main">
        <Stack.Screen name="Main" component={MainScreen} options={{ title: 'Kiosko' }} />

        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} options={{ title: 'Admin Login' }} />
        <Stack.Screen name="AdminHome" component={AdminHome} options={{ title: 'Admin' }} />
        <Stack.Screen name="AdminCreateWorker" component={AdminCreateWorkerScreen} options={{ title: 'Registrar trabajador' }} />
        <Stack.Screen name="AdminLogs" component={AdminLogsScreen} options={{ title: 'Logs' }} />

        <Stack.Screen name="WorkerScan" component={WorkerScanScreen} options={{ title: 'Trabajador' }} />
        <Stack.Screen name="Visitor" component={VisitorScreen} options={{ title: 'Visitante' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}