import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { fetchWorkers, createLog, sendOtp, verifyOtp } from "../services/api";

const getWorkerId = (w) => Number(w?.id ?? w?.worker_id ?? w?.employee_no);

export default function WorkerScanScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 900;
  const isPhone = width < 500;

  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [time, setTime] = useState(new Date());
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [mode, setMode] = useState("IN");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpInfo, setOtpInfo] = useState("");
  const [successState, setSuccessState] = useState(null);

  const [emailInput, setEmailInput] = useState("");
  const [otpWorker, setOtpWorker] = useState(null);
  const [sendingOtp, setSendingOtp] = useState(false);

  const recognizedWorker = useMemo(() => {
    if (!workers.length) return null;
    return workers[0];
  }, [workers]);

  const detectedWorkerByEmail = useMemo(() => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return null;

    return (
      workers.find(
        (w) => String(w.email || "").trim().toLowerCase() === email
      ) || null
    );
  }, [emailInput, workers]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      setLoadingWorkers(true);
      const data = await fetchWorkers();
      setWorkers(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudieron cargar trabajadores");
    } finally {
      setLoadingWorkers(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDate = (date) => {
    return date
      .toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      .toUpperCase();
  };

  const showSuccess = (action, worker) => {
    setSuccessState({ type: action, worker });

    setTimeout(() => {
      setSuccessState(null);
    }, 3000);
  };

  const registerLogForWorker = async (worker, action, method) => {
    await createLog({
      worker_id: getWorkerId(worker),
      action,
      log_type: "worker",
      method,
    });
  };

  // Demo temporal de reconocimiento
  const recognizeWorkerFromPhoto = async () => {
    if (!workers.length) {
      throw new Error("No hay trabajadores registrados");
    }
    return workers[0];
  };

  const handleScanFace = async () => {
    try {
      if (!permission?.granted) {
        const res = await requestPermission();
        if (!res.granted) {
          Alert.alert("Permiso requerido", "Necesitas permitir el acceso a la cámara");
          return;
        }
      }

      if (!cameraRef.current) {
        Alert.alert("Error", "La cámara aún no está lista");
        return;
      }

      setScanning(true);

      await cameraRef.current.takePictureAsync({
        quality: 0.5,
        skipProcessing: true,
      });

      const worker = await recognizeWorkerFromPhoto();

      await registerLogForWorker(worker, mode, "Rostro");
      showSuccess(mode, worker);
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo reconocer al trabajador");
    } finally {
      setScanning(false);
    }
  };

  const findWorkerByEmail = () => {
    const email = emailInput.trim().toLowerCase();

    if (!email) {
      throw new Error("Escribe un correo electrónico");
    }

    const found = workers.find(
      (w) => String(w.email || "").trim().toLowerCase() === email
    );

    if (!found) {
      throw new Error("Ese correo no pertenece a ningún empleado registrado");
    }

    return found;
  };

  const handleSendOtp = async () => {
    try {
      setSendingOtp(true);

      const worker = findWorkerByEmail();

      await sendOtp({
        worker_id: getWorkerId(worker),
        action: mode,
      });

      setOtpWorker(worker);
      setOtpCode("");
      setOtpInfo(`Código enviado a ${worker.email}`);
      setShowOtpModal(true);
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo enviar el código");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setSendingOtp(true);

      const worker = findWorkerByEmail();

      await sendOtp({
        worker_id: getWorkerId(worker),
        action: mode,
      });

      setOtpWorker(worker);
      setOtpInfo(`Código reenviado a ${worker.email}`);
      Alert.alert("Listo", "Se reenvió el código");
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo reenviar el código");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      if (!otpWorker) {
        Alert.alert("Error", "Primero envía el código");
        return;
      }

      if (!otpCode.trim()) {
        Alert.alert("Error", "Ingresa el código");
        return;
      }

      await verifyOtp({
        worker_id: getWorkerId(otpWorker),
        action: mode,
        code: otpCode.trim(),
      });

      setShowOtpModal(false);
      setOtpCode("");
      setOtpInfo("");
      setEmailInput("");

      showSuccess(mode, otpWorker);
      setOtpWorker(null);
    } catch (e) {
      Alert.alert("Error", e?.message || "Código incorrecto");
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.bgGlowOne, isTablet && styles.bgGlowOneTablet]} />
      <View style={[styles.bgGlowTwo, isTablet && styles.bgGlowTwoTablet]} />

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

          <Text
            style={[
              styles.clock,
              isTablet && styles.clockTablet,
              isPhone && styles.clockPhone,
            ]}
          >
            {formatTime(time)}
          </Text>

          <Text style={[styles.date, isTablet && styles.dateTablet]}>
            {formatDate(time)}
          </Text>

          {!successState ? (
            <>
              <View
                style={[
                  styles.iconBox,
                  mode === "IN" ? styles.iconBoxIn : styles.iconBoxOut,
                ]}
              >
                <Text style={styles.iconTxt}>⌁</Text>
              </View>

              <Text style={[styles.title, isTablet && styles.titleTablet]}>
                Registro de Trabajador
              </Text>

              <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>
                Escanea tu rostro para registrar asistencia
              </Text>

              <View style={[styles.cameraCard, isTablet && styles.cameraCardTablet]}>
                <View style={styles.cameraWrap}>
                  {permission?.granted ? (
                    <CameraView
                      ref={cameraRef}
                      style={styles.camera}
                      facing="front"
                    />
                  ) : (
                    <View style={styles.cameraPlaceholder}>
                      <Text style={styles.cameraPlaceholderText}>
                        Permite acceso a cámara para continuar
                      </Text>
                    </View>
                  )}

                  <View style={styles.faceGuide} />
                </View>

                <View style={styles.modeRow}>
                  <TouchableOpacity
                    style={[styles.modeBtn, mode === "IN" && styles.modeBtnActiveIn]}
                    onPress={() => setMode("IN")}
                  >
                    <Text
                      style={[
                        styles.modeBtnText,
                        mode === "IN" && styles.modeBtnTextActive,
                      ]}
                    >
                      Entrada
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modeBtn, mode === "OUT" && styles.modeBtnActiveOut]}
                    onPress={() => setMode("OUT")}
                  >
                    <Text
                      style={[
                        styles.modeBtnText,
                        mode === "OUT" && styles.modeBtnTextActive,
                      ]}
                    >
                      Salida
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.mainActionBtn}
                  onPress={handleScanFace}
                  disabled={scanning}
                >
                  {scanning ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.mainActionBtnText}>Escanear Rostro</Text>
                  )}
                </TouchableOpacity>

                <Text style={styles.orText}>O BIEN</Text>

                <View style={styles.emailCard}>
                  <Text style={styles.emailTitle}>Verificación por correo</Text>
                  <Text style={styles.emailSubtitle}>
                    Escribe el correo del empleado para recibir un código de acceso
                  </Text>

                  <TextInput
                    style={styles.emailInput}
                    placeholder="tu@correo.com"
                    placeholderTextColor="#8ea0c0"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={emailInput}
                    onChangeText={setEmailInput}
                  />

                  {emailInput.trim().length > 0 &&
                    (detectedWorkerByEmail ? (
                      <View style={styles.detectedWorkerBox}>
                        <Text style={styles.detectedWorkerTitle}>
                          Empleado encontrado
                        </Text>
                        <Text style={styles.detectedWorkerText}>
                          {detectedWorkerByEmail.full_name} · {detectedWorkerByEmail.area}
                        </Text>
                        <Text style={styles.detectedWorkerSubtext}>
                          Empleado #{detectedWorkerByEmail.employee_no}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.notFoundBox}>
                        <Text style={styles.notFoundText}>
                          No se encontró un empleado con ese correo
                        </Text>
                      </View>
                    ))}

                  <TouchableOpacity
                    style={styles.codeBtn}
                    onPress={handleSendOtp}
                    disabled={sendingOtp}
                  >
                    <Text style={styles.codeBtnText}>
                      {sendingOtp ? "Enviando..." : "Enviar Código"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={handleResendOtp}
                    disabled={sendingOtp}
                  >
                    <Text style={styles.resendBtnText}>Reenviar código</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    {loadingWorkers
                      ? "Cargando empleados..."
                      : workers.length
                      ? "Puedes usar el correo registrado de cualquier empleado"
                      : "No hay trabajadores registrados"}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.successWrap}>
              <View
                style={[
                  styles.successIconBox,
                  successState.type === "IN"
                    ? styles.successIconBoxIn
                    : styles.successIconBoxOut,
                ]}
              >
                <Text style={styles.successIcon}>
                  {successState.type === "IN" ? "↪" : "↩"}
                </Text>
              </View>

              <Text style={styles.successLabel}>
                {successState.type === "IN" ? "BIENVENIDO" : "HASTA LUEGO"}
              </Text>

              <Text style={[styles.successName, isTablet && styles.successNameTablet]}>
                Hola, {successState.worker.full_name}
              </Text>

              <Text style={styles.successMeta}>
                Empleado #{successState.worker.employee_no} · {successState.worker.area}
              </Text>

              <Text
                style={[
                  styles.successStatus,
                  successState.type === "IN"
                    ? styles.successStatusIn
                    : styles.successStatusOut,
                ]}
              >
                {successState.type === "IN"
                  ? "Entrada registrada"
                  : "Salida registrada"}
              </Text>

              <Text style={styles.successTime}>
                {new Date().toLocaleDateString()} · {new Date().toLocaleTimeString()}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={showOtpModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isTablet && styles.modalCardTablet]}>
            <View style={[styles.modalIconBox, styles.modalIconCode]}>
              <Text style={styles.modalIcon}>✉</Text>
            </View>

            <Text style={styles.modalName}>Código de verificación</Text>
            <Text style={styles.modalMeta}>
              {otpInfo || "Ingresa el código enviado al correo registrado"}
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="Ej: 123456"
              placeholderTextColor="#8ea0c0"
              keyboardType="number-pad"
              value={otpCode}
              onChangeText={setOtpCode}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setShowOtpModal(false);
                  setOtpCode("");
                  setOtpInfo("");
                }}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleVerifyOtp}
              >
                <Text style={styles.confirmBtnText}>Verificar código</Text>
              </TouchableOpacity>
            </View>
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

  bgGlowOne: {
    position: "absolute",
    top: 70,
    left: -30,
    width: 220,
    height: 220,
    borderRadius: 160,
    backgroundColor: "rgba(41,98,255,0.13)",
  },

  bgGlowOneTablet: {
    top: 110,
    left: 100,
    width: 320,
    height: 320,
    borderRadius: 200,
  },

  bgGlowTwo: {
    position: "absolute",
    bottom: 100,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 160,
    backgroundColor: "rgba(124,58,237,0.10)",
  },

  bgGlowTwoTablet: {
    bottom: 120,
    right: 120,
    width: 320,
    height: 320,
    borderRadius: 200,
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
    maxWidth: 1100,
  },

  backText: {
    alignSelf: "flex-start",
    color: "#9fb2d9",
    fontSize: 16,
    marginBottom: 12,
  },

  clock: {
    fontSize: 52,
    color: "#ffffff",
    fontWeight: "800",
    textAlign: "center",
  },

  clockPhone: {
    fontSize: 46,
  },

  clockTablet: {
    fontSize: 82,
    fontWeight: "300",
  },

  date: {
    fontSize: 15,
    color: "#9fb2d9",
    marginBottom: 18,
    textAlign: "center",
  },

  dateTablet: {
    fontSize: 18,
    marginBottom: 24,
  },

  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  iconBoxIn: {
    backgroundColor: "rgba(16,185,129,0.18)",
  },

  iconBoxOut: {
    backgroundColor: "rgba(245,158,11,0.18)",
  },

  iconTxt: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "700",
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#f8fbff",
    textAlign: "center",
  },

  titleTablet: {
    fontSize: 38,
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    color: "#8ea0c0",
    fontSize: 16,
    textAlign: "center",
  },

  subtitleTablet: {
    fontSize: 18,
    marginBottom: 28,
  },

  cameraCard: {
    width: "100%",
    maxWidth: 620,
    backgroundColor: "rgba(12,23,46,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 20,
    marginBottom: 18,
    alignItems: "center",
  },

  cameraCardTablet: {
    maxWidth: 760,
    padding: 24,
  },

  cameraWrap: {
    width: "100%",
    aspectRatio: 1.25,
    maxHeight: 290,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#0e1627",
    marginBottom: 18,
  },

  camera: {
    flex: 1,
  },

  cameraPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  cameraPlaceholderText: {
    color: "#c8d6f3",
    textAlign: "center",
  },

  faceGuide: {
    position: "absolute",
    alignSelf: "center",
    top: "18%",
    width: "48%",
    height: "56%",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
    borderRadius: 180,
  },

  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    width: "100%",
  },

  modeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },

  modeBtnActiveIn: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },

  modeBtnActiveOut: {
    backgroundColor: "#f59e0b",
    borderColor: "#f59e0b",
  },

  modeBtnText: {
    color: "#d9e3f9",
    fontWeight: "700",
  },

  modeBtnTextActive: {
    color: "#fff",
  },

  mainActionBtn: {
    width: "100%",
    backgroundColor: "#1f2937",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },

  mainActionBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  orText: {
    textAlign: "center",
    color: "#7f8aa3",
    marginTop: 18,
    marginBottom: 12,
    fontSize: 12,
    letterSpacing: 2,
  },

  emailCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 16,
    marginTop: 2,
  },

  emailTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },

  emailSubtitle: {
    color: "#8ea0c0",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 14,
  },

  emailInput: {
    backgroundColor: "#2a3954",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    marginBottom: 12,
  },

  detectedWorkerBox: {
    backgroundColor: "rgba(16,185,129,0.12)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.35)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  detectedWorkerTitle: {
    color: "#34d399",
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },

  detectedWorkerText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },

  detectedWorkerSubtext: {
    color: "#b7c8e6",
    fontSize: 13,
    marginTop: 3,
    textAlign: "center",
  },

  notFoundBox: {
    backgroundColor: "rgba(239,68,68,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.28)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  notFoundText: {
    color: "#fca5a5",
    fontWeight: "600",
    textAlign: "center",
  },

  codeBtn: {
    width: "100%",
    backgroundColor: "#2d4da5",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 10,
  },

  codeBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  resendBtn: {
    width: "100%",
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  resendBtnText: {
    color: "#dbe8ff",
    fontWeight: "700",
    fontSize: 15,
  },

  infoBox: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    width: "100%",
  },

  infoText: {
    color: "#9fb2d9",
    fontSize: 13,
    textAlign: "center",
  },

  successWrap: {
    flex: 1,
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
  },

  successIconBoxIn: {
    backgroundColor: "rgba(16,185,129,0.18)",
  },

  successIconBoxOut: {
    backgroundColor: "rgba(245,158,11,0.18)",
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

  successNameTablet: {
    fontSize: 52,
  },

  successMeta: {
    color: "#8ea0c0",
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
  },

  successStatus: {
    marginTop: 10,
    fontWeight: "700",
    fontSize: 16,
  },

  successStatusIn: {
    color: "#34d399",
  },

  successStatusOut: {
    color: "#fbbf24",
  },

  successTime: {
    color: "#7c8ba6",
    marginTop: 6,
    fontSize: 13,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#1b2840",
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },

  modalCardTablet: {
    maxWidth: 430,
  },

  modalIconBox: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  modalIconCode: {
    backgroundColor: "rgba(14,165,233,0.18)",
  },

  modalIcon: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },

  modalName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },

  modalMeta: {
    color: "#9fb2d9",
    marginTop: 8,
    textAlign: "center",
  },

  otpInput: {
    width: "100%",
    marginTop: 18,
    marginBottom: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    letterSpacing: 4,
  },

  modalBtnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },

  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  cancelBtn: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  cancelBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  confirmBtn: {
    backgroundColor: "#f59e0b",
  },

  confirmBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});