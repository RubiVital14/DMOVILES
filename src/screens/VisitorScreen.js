import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { createVisitor } from "../services/api";

export default function VisitorScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 900;

  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [step, setStep] = useState("menu"); // menu | camera | form | success
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [mode, setMode] = useState("IN");
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");

  const [savedVisitor, setSavedVisitor] = useState(null);

  const openCamera = async (selectedMode) => {
    try {
      setMode(selectedMode);

      if (!permission?.granted) {
        const res = await requestPermission();
        if (!res.granted) {
          Alert.alert("Permiso requerido", "Necesitas permitir la cámara");
          return;
        }
      }

      setStep("camera");
    } catch (e) {
      Alert.alert("Error", "No se pudo abrir la cámara");
    }
  };

  const handleTakePhoto = async () => {
    try {
      if (!cameraRef.current) {
        Alert.alert("Error", "La cámara aún no está lista");
        return;
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        skipProcessing: true,
      });

      setCapturedPhoto(photo?.uri || null);
      setStep("form");
    } catch (e) {
      Alert.alert("Error", "No se pudo tomar la foto");
    }
  };

  const handleSaveVisitor = async () => {
    try {
      if (!fullName.trim()) {
        Alert.alert("Error", "Ingresa el nombre completo");
        return;
      }

      setSaving(true);

      const visitor = await createVisitor({
        full_name: fullName.trim(),
        company: company.trim() || null,
        phone: phone.trim() || null,
        reason: reason.trim() || null,
        photo_uri: capturedPhoto || null,
      });

      setSavedVisitor(visitor);
      setStep("success");
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo guardar el visitante");
    } finally {
      setSaving(false);
    }
  };

  const resetFlow = () => {
    setCapturedPhoto(null);
    setFullName("");
    setCompany("");
    setPhone("");
    setReason("");
    setSavedVisitor(null);
    setSaving(false);
    setStep("menu");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bgGlowOne} />
      <View style={styles.bgGlowTwo} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { minHeight: height },
          isTablet && styles.scrollContentTablet,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, isTablet && styles.containerTablet]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Inicio</Text>
          </TouchableOpacity>

          {step === "menu" && (
            <>
              <View style={styles.iconBox}>
                <Text style={styles.iconTxt}>👤</Text>
              </View>

              <Text style={styles.title}>Visitante</Text>
              <Text style={styles.subtitle}>Registro de entrada y salida</Text>

              <TouchableOpacity
                style={[styles.bigBtn, styles.inBtn]}
                onPress={() => openCamera("IN")}
              >
                <Text style={styles.bigBtnText}>Registrar Entrada</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bigBtn, styles.outBtn]}
                onPress={() => openCamera("OUT")}
              >
                <Text style={styles.bigBtnText}>Registrar Salida</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "camera" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Captura del visitante</Text>

              <View style={styles.cameraWrap}>
                {permission?.granted ? (
                  <CameraView ref={cameraRef} style={styles.camera} facing="front" />
                ) : (
                  <View style={styles.cameraPlaceholder}>
                    <Text style={styles.cameraPlaceholderText}>
                      Permite acceso a cámara
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.mainBtn} onPress={handleTakePhoto}>
                <Text style={styles.mainBtnText}>Tomar foto</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === "form" && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Datos del visitante</Text>

              {capturedPhoto ? (
                <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
              ) : null}

              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                placeholderTextColor="#8ea0c0"
                value={fullName}
                onChangeText={setFullName}
              />

              <TextInput
                style={styles.input}
                placeholder="Empresa"
                placeholderTextColor="#8ea0c0"
                value={company}
                onChangeText={setCompany}
              />

              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                placeholderTextColor="#8ea0c0"
                value={phone}
                onChangeText={setPhone}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Motivo de visita"
                placeholderTextColor="#8ea0c0"
                value={reason}
                onChangeText={setReason}
                multiline
              />

              <TouchableOpacity
                style={[styles.mainBtn, saving && styles.disabledBtn]}
                onPress={handleSaveVisitor}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.mainBtnText}>
                    {mode === "IN" ? "Guardar entrada" : "Guardar salida"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === "success" && (
            <View style={styles.successWrap}>
              <View style={styles.successIconBox}>
                <Text style={styles.successIcon}>{mode === "IN" ? "↪" : "↩"}</Text>
              </View>

              <Text style={styles.successLabel}>
                {mode === "IN" ? "BIENVENIDO" : "HASTA LUEGO"}
              </Text>

              <Text style={styles.successName}>
                Hola, {savedVisitor?.full_name || "Visitante"}
              </Text>

              <Text style={styles.successMeta}>
                {mode === "IN" ? "Entrada registrada" : "Salida registrada"}
              </Text>

              <TouchableOpacity style={styles.mainBtn} onPress={resetFlow}>
                <Text style={styles.mainBtnText}>Volver</Text>
              </TouchableOpacity>
            </View>
          )}
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
  bgGlowOne: {
    position: "absolute",
    top: 70,
    left: -30,
    width: 220,
    height: 220,
    borderRadius: 160,
    backgroundColor: "rgba(41,98,255,0.13)",
  },
  bgGlowTwo: {
    position: "absolute",
    bottom: 100,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 160,
    backgroundColor: "rgba(14,165,233,0.10)",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: "center",
  },
  scrollContentTablet: {
    paddingHorizontal: 40,
    paddingVertical: 36,
  },
  container: {
    width: "100%",
    alignSelf: "center",
    alignItems: "center",
  },
  containerTablet: {
    maxWidth: 900,
  },
  backText: {
    alignSelf: "flex-start",
    color: "#9fb2d9",
    fontSize: 16,
    marginBottom: 12,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: "rgba(14,165,233,0.18)",
  },
  iconTxt: {
    fontSize: 28,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    color: "#8ea0c0",
    fontSize: 16,
    textAlign: "center",
  },
  bigBtn: {
    width: "100%",
    maxWidth: 420,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 14,
  },
  inBtn: {
    backgroundColor: "#0b6aa0",
  },
  outBtn: {
    backgroundColor: "#8b5428",
  },
  bigBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  card: {
    width: "100%",
    maxWidth: 620,
    backgroundColor: "rgba(12,23,46,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 20,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  cameraWrap: {
    width: "100%",
    aspectRatio: 1.2,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#0e1627",
    marginBottom: 16,
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraPlaceholderText: {
    color: "#c8d6f3",
  },
  previewImage: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#2a3954",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    marginBottom: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  mainBtn: {
    backgroundColor: "#2d4da5",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  mainBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  successWrap: {
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    backgroundColor: "rgba(14,165,233,0.18)",
  },
  successIcon: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "700",
  },
  successLabel: {
    color: "#b4c1dc",
    fontSize: 14,
    letterSpacing: 4,
    marginBottom: 12,
  },
  successName: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "300",
    textAlign: "center",
  },
  successMeta: {
    color: "#8ea0c0",
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 18,
  },
});