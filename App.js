import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainScreen from "./src/screens/MainScreen";
import AdminLoginScreen from "./src/screens/AdminLoginScreen";
import AdminHome from "./src/screens/AdminHome";
import AdminCreateWorkerScreen from "./src/screens/AdminCreateWorkerScreen";
import WorkerScanScreen from "./src/screens/WorkerScanScreen";
import VisitorScreen from "./src/screens/VisitorScreen";
import AdminLogsScreen from "./src/screens/AdminLogsScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        <Stack.Screen name="Main" component={MainScreen} />

        <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
        <Stack.Screen name="AdminHome" component={AdminHome} />
        <Stack.Screen name="AdminCreateWorker" component={AdminCreateWorkerScreen} />
        <Stack.Screen name="AdminLogs" component={AdminLogsScreen} />

        <Stack.Screen name="WorkerScan" component={WorkerScanScreen} />
        <Stack.Screen name="Visitor" component={VisitorScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}