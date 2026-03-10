import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useWindowDimensions,
  ScrollView,
} from "react-native";

import { createWorker } from "../services/api";

export default function AdminCreateWorkerScreen({ navigation }) {

  const { width } = useWindowDimensions();

  const isTablet = width > 900;

  const [name, setName] = useState("");
  const [employeeNo, setEmployeeNo] = useState("");
  const [area, setArea] = useState("");
  const [email, setEmail] = useState("");

  const saveWorker = async () => {

    if (!name || !employeeNo || !area) {
      Alert.alert("Error", "Completa todos los campos");
      return;
    }

    try {

      await createWorker({
        full_name: name,
        employee_no: employeeNo,
        area: area,
        email: email
      });

      Alert.alert("Correcto", "Trabajador registrado");

      navigation.goBack();

    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={styles.screen}>

      <ScrollView contentContainerStyle={styles.container}>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Nuevo Trabajador</Text>

        <Text style={styles.subtitle}>
          Registrar empleado para control de asistencia
        </Text>

        <View style={[styles.card, isTablet && { maxWidth: 700 }]}>

          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Rubi Sanchez"
            placeholderTextColor="#8ea0c0"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Número de empleado</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 123"
            placeholderTextColor="#8ea0c0"
            value={employeeNo}
            onChangeText={setEmployeeNo}
          />

          <Text style={styles.label}>Departamento / Área</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Tecnología"
            placeholderTextColor="#8ea0c0"
            value={area}
            onChangeText={setArea}
          />

          <Text style={styles.label}>Correo (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@empresa.com"
            placeholderTextColor="#8ea0c0"
            value={email}
            onChangeText={setEmail}
          />

          <TouchableOpacity style={styles.button} onPress={saveWorker}>
            <Text style={styles.buttonText}>Guardar trabajador</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: "#07111f",
  },

  container: {
    padding: 30,
    alignItems: "center",
  },

  back: {
    color: "#9fb2d9",
    alignSelf: "flex-start",
    marginBottom: 20,
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "white",
  },

  subtitle: {
    color: "#9fb2d9",
    marginBottom: 30,
  },

  card: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#0f1b34",
    borderRadius: 20,
    padding: 25,
  },

  label: {
    color: "#c8d6f3",
    marginBottom: 6,
    marginTop: 10,
  },

  input: {
    backgroundColor: "#111827",
    borderRadius: 10,
    padding: 14,
    color: "white",
  },

  button: {
    backgroundColor: "#7c3aed",
    marginTop: 25,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "700",
  }

});