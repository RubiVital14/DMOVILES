import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { API_BASE_URL } from "../config/api";

export default function AdminLoginScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 900;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      if (!username.trim() || !password.trim()) {
        Alert.alert("Error", "Ingresa usuario y contraseña");
        return;
      }

      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const text = await res.text();
      let data = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!res.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : data?.detail || "No se pudo iniciar sesión"
        );
      }

      if (data?.ok) {
        navigation.replace("AdminHome");
      } else {
        Alert.alert("Error", "Credenciales incorrectas");
      }
    } catch (e) {
      Alert.alert("Error", e?.message || "Network request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { minHeight: height }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, isTablet && styles.containerTablet]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Inicio</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Inicio de Administrador</Text>
          <Text style={styles.subtitle}>
            Accede al panel de control y reportes
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu usuario"
              placeholderTextColor="#7d8ba8"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor="#7d8ba8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginBtnText}>
                {loading ? "Entrando..." : "Entrar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#07111f" },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  container: {
    width: "100%",
    alignSelf: "center",
  },
  containerTablet: {
    maxWidth: 620,
  },
  backText: {
    color: "#9fb2d9",
    fontSize: 16,
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f8fbff",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    color: "#8ea0c0",
    fontSize: 16,
    textAlign: "center",
  },
  card: {
    width: "100%",
    backgroundColor: "rgba(12,23,46,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 20,
  },
  label: {
    color: "#c8d6f3",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
    marginBottom: 6,
  },
  loginBtn: {
    marginTop: 22,
    backgroundColor: "#7c3aed",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  loginBtnDisabled: {
    opacity: 0.65,
  },
  loginBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
});