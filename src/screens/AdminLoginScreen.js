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
  Modal,
} from "react-native";
import {
  adminLogin,
  forgotAdminPassword,
  verifyAdminReset,
} from "../services/api";

export default function AdminLoginScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 900;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetStep, setResetStep] = useState(1);

  const handleLogin = async () => {
    try {
      if (!username.trim() || !password.trim()) {
        Alert.alert("Error", "Ingresa usuario y contraseña");
        return;
      }

      setLoading(true);

      const data = await adminLogin({
        username: username.trim(),
        password: password.trim(),
      });

      if (data?.ok) {
        navigation.replace("AdminHome");
      } else {
        Alert.alert("Error", "Credenciales incorrectas");
      }
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      if (!resetEmail.trim()) {
        Alert.alert("Error", "Ingresa el correo");
        return;
      }

      await forgotAdminPassword({
        email: resetEmail.trim().toLowerCase(),
      });

      setResetStep(2);
      Alert.alert("Correcto", "Se envió un código al correo");
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo enviar el código");
    }
  };

  const handleVerifyReset = async () => {
    try {
      if (!resetEmail.trim() || !resetCode.trim() || !newPassword.trim()) {
        Alert.alert("Error", "Completa todos los campos");
        return;
      }

      await verifyAdminReset({
        email: resetEmail.trim().toLowerCase(),
        code: resetCode.trim(),
        new_password: newPassword.trim(),
      });

      setShowForgotModal(false);
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
      setResetStep(1);

      Alert.alert("Correcto", "Contraseña actualizada");
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo cambiar la contraseña");
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setResetEmail("");
    setResetCode("");
    setNewPassword("");
    setResetStep(1);
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

            <TouchableOpacity onPress={() => setShowForgotModal(true)}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={showForgotModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.card}>
            <Text style={styles.title}>Recuperar contraseña</Text>

            <Text style={styles.label}>Correo del administrador</Text>
            <TextInput
              style={styles.input}
              placeholder="correo@empresa.com"
              placeholderTextColor="#7d8ba8"
              autoCapitalize="none"
              keyboardType="email-address"
              value={resetEmail}
              onChangeText={setResetEmail}
            />

            {resetStep === 2 && (
              <>
                <Text style={styles.label}>Código</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123456"
                  placeholderTextColor="#7d8ba8"
                  value={resetCode}
                  onChangeText={setResetCode}
                  keyboardType="number-pad"
                />

                <Text style={styles.label}>Nueva contraseña</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nueva contraseña"
                  placeholderTextColor="#7d8ba8"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </>
            )}

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={resetStep === 1 ? handleForgotPassword : handleVerifyReset}
            >
              <Text style={styles.loginBtnText}>
                {resetStep === 1 ? "Enviar código" : "Cambiar contraseña"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginBtn, styles.cancelBtn]}
              onPress={closeForgotModal}
            >
              <Text style={styles.loginBtnText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#07111f",
  },
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
  cancelBtn: {
    backgroundColor: "#475569",
    marginTop: 10,
  },
  loginBtnDisabled: {
    opacity: 0.65,
  },
  loginBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
  },
  forgotText: {
    color: "#9fb2d9",
    textAlign: "center",
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    padding: 20,
  },
});