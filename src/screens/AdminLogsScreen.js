import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Linking,
  Alert,
  useWindowDimensions,
} from "react-native";
import { fetchLogs, fetchWorkers, getAsistenciaExcelUrl } from "../services/api";

export default function AdminLogsScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;

  const [logs, setLogs] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [activeTab, setActiveTab] = useState("asistencia");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      const [logsData, workersData] = await Promise.all([
        fetchLogs(),
        fetchWorkers(),
      ]);

      setLogs(Array.isArray(logsData) ? logsData : []);
      setWorkers(Array.isArray(workersData) ? workersData : []);
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo cargar la información");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  const entradasHoy = logs.filter(
    (l) => String(l.action || "").toLowerCase() === "entrada" &&
      String(l.created_at || "").startsWith(today)
  ).length;

  const salidasHoy = logs.filter(
    (l) => String(l.action || "").toLowerCase() === "salida" &&
      String(l.created_at || "").startsWith(today)
  ).length;

  const visitantesHoy = logs.filter(
    (l) =>
      String(l.log_type || "").toLowerCase() === "visitor" &&
      String(l.created_at || "").startsWith(today)
  ).length;

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((l) => {
      const fullName = String(l.full_name || "").toLowerCase();
      const employeeNo = String(l.employee_no || "").toLowerCase();
      const area = String(l.area || "").toLowerCase();
      const action = String(l.action || "").toLowerCase();
      const method = String(l.method || "").toLowerCase();

      return (
        fullName.includes(q) ||
        employeeNo.includes(q) ||
        area.includes(q) ||
        action.includes(q) ||
        method.includes(q)
      );
    });
  }, [logs, search]);

  const openExcel = async () => {
    try {
      await Linking.openURL(getAsistenciaExcelUrl());
    } catch (e) {
      Alert.alert("Error", "No se pudo abrir la descarga");
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bgGlowOne} />
      <View style={styles.bgGlowTwo} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.container, isTablet && styles.containerTablet]}>
          <View style={[styles.headerRow, !isTablet && styles.headerRowPhone]}>
            <View>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.backText}>← Panel</Text>
              </TouchableOpacity>

              <Text style={styles.title}>Panel de Administración</Text>
              <Text style={styles.subtitle}>Control de acceso y asistencia</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerLink}>
                <Text style={styles.headerLinkText}>Cambiar contraseña</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerLink}
                onPress={() => navigation.replace("Main")}
              >
                <Text style={styles.headerLinkText}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.kpiGrid, !isTablet && styles.kpiGridPhone]}>
            <KpiCard label="ENTRADAS HOY" value={entradasHoy} accent="#10b981" icon="↪" />
            <KpiCard label="SALIDAS HOY" value={salidasHoy} accent="#f59e0b" icon="↩" />
            <KpiCard label="EMPLEADOS" value={workers.length} accent="#7c3aed" icon="👥" />
            <KpiCard label="VISITANTES HOY" value={visitantesHoy} accent="#0ea5e9" icon="👤" />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScroll}
          >
            <View style={styles.tabsRow}>
              <TabButton
                label="Asistencia"
                active={activeTab === "asistencia"}
                onPress={() => setActiveTab("asistencia")}
              />
              <TabButton
                label="Visitantes"
                active={activeTab === "visitantes"}
                onPress={() => setActiveTab("visitantes")}
              />
              <TabButton
                label="Empleados"
                active={activeTab === "empleados"}
                onPress={() => setActiveTab("empleados")}
              />
            </View>
          </ScrollView>

          {activeTab === "asistencia" && (
            <>
              <View style={[styles.toolbar, !isTablet && styles.toolbarPhone]}>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar por nombre o número..."
                  placeholderTextColor="#7f8aa3"
                  style={styles.searchInput}
                />

                <TouchableOpacity style={styles.excelBtn} onPress={openExcel}>
                  <Text style={styles.excelBtnText}>Descargar Excel</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tableCard}>
                {isTablet ? (
                  <>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.th, { flex: 2 }]}>Empleado</Text>
                      <Text style={[styles.th, { flex: 1.2 }]}>No. Empleado</Text>
                      <Text style={[styles.th, { flex: 1.6 }]}>Departamento</Text>
                      <Text style={[styles.th, { flex: 1 }]}>Tipo</Text>
                      <Text style={[styles.th, { flex: 1 }]}>Método</Text>
                      <Text style={[styles.th, { flex: 1.8 }]}>Fecha y Hora</Text>
                    </View>

                    {filteredLogs.length === 0 ? (
                      <Text style={styles.emptyText}>No se encontraron registros</Text>
                    ) : (
                      filteredLogs.map((log, idx) => (
                        <View key={`${log.id}-${idx}`} style={styles.tableRow}>
                          <Text style={[styles.td, { flex: 2 }]}>{log.full_name}</Text>
                          <Text style={[styles.td, { flex: 1.2 }]}>{log.employee_no}</Text>
                          <Text style={[styles.td, { flex: 1.6 }]}>{log.area}</Text>
                          <Text
                            style={[
                              styles.badgeText,
                              { flex: 1 },
                              String(log.action).toLowerCase() === "entrada"
                                ? styles.badgeIn
                                : styles.badgeOut,
                            ]}
                          >
                            {log.action}
                          </Text>
                          <Text style={[styles.methodBadge, { flex: 1 }]}>
                            {log.method || "Rostro"}
                          </Text>
                          <Text style={[styles.td, { flex: 1.8 }]}>{log.created_at}</Text>
                        </View>
                      ))
                    )}
                  </>
                ) : (
                  <>
                    {filteredLogs.length === 0 ? (
                      <Text style={styles.emptyText}>No se encontraron registros</Text>
                    ) : (
                      filteredLogs.map((log, idx) => (
                        <View key={`${log.id}-${idx}`} style={styles.mobileCard}>
                          <Text style={styles.mobileName}>{log.full_name}</Text>
                          <Text style={styles.mobileLine}>No. Empleado: {log.employee_no}</Text>
                          <Text style={styles.mobileLine}>Departamento: {log.area}</Text>
                          <Text style={styles.mobileLine}>Tipo: {log.action}</Text>
                          <Text style={styles.mobileLine}>Método: {log.method || "Rostro"}</Text>
                          <Text style={styles.mobileLine}>Fecha: {log.created_at}</Text>
                        </View>
                      ))
                    )}
                  </>
                )}
              </View>
            </>
          )}

          {activeTab === "visitantes" && (
            <View style={styles.tableCard}>
              <Text style={styles.sectionTitle}>Visitantes</Text>
              <Text style={styles.emptyText}>Aquí puedes conectar los registros de visitantes.</Text>
            </View>
          )}

          {activeTab === "empleados" && (
            <View style={styles.tableCard}>
              <Text style={styles.sectionTitle}>Empleados ({workers.length})</Text>

              {workers.length === 0 ? (
                <Text style={styles.emptyText}>No hay empleados registrados</Text>
              ) : (
                workers.map((w, idx) => (
                  <View key={`${w.id}-${idx}`} style={styles.mobileCard}>
                    <Text style={styles.mobileName}>{w.full_name}</Text>
                    <Text style={styles.mobileLine}>No. Empleado: {w.employee_no}</Text>
                    <Text style={styles.mobileLine}>Departamento: {w.area}</Text>
                    <Text style={styles.mobileLine}>Correo: {w.email || "-"}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function KpiCard({ label, value, accent, icon }) {
  return (
    <View style={styles.kpiCard}>
      <View>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
      </View>

      <View style={[styles.kpiIconBox, { backgroundColor: accent }]}>
        <Text style={styles.kpiIcon}>{icon}</Text>
      </View>
    </View>
  );
}

function TabButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#07111f",
  },

  bgGlowOne: {
    position: "absolute",
    top: 90,
    left: 40,
    width: 220,
    height: 220,
    borderRadius: 180,
    backgroundColor: "rgba(41,98,255,0.10)",
  },

  bgGlowTwo: {
    position: "absolute",
    bottom: 120,
    right: 30,
    width: 220,
    height: 220,
    borderRadius: 160,
    backgroundColor: "rgba(124,58,237,0.10)",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  container: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: "rgba(8,18,38,0.82)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },

  containerTablet: {
    maxWidth: 1180,
    padding: 24,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
    marginBottom: 20,
    alignItems: "flex-start",
  },

  headerRowPhone: {
    flexDirection: "column",
    gap: 12,
  },

  backText: {
    color: "#9fb2d9",
    fontSize: 16,
    marginBottom: 8,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#f8fbff",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: "#8ea0c0",
  },

  headerActions: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },

  headerLink: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  headerLinkText: {
    color: "#c5d3ee",
    fontSize: 14,
    fontWeight: "600",
  },

  kpiGrid: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 18,
  },

  kpiGridPhone: {
    flexDirection: "column",
  },

  kpiCard: {
    flex: 1,
    minWidth: 220,
    backgroundColor: "rgba(14,26,51,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  kpiLabel: {
    color: "#8ea0c0",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },

  kpiValue: {
    marginTop: 8,
    color: "#ffffff",
    fontSize: 40,
    fontWeight: "800",
  },

  kpiIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  kpiIcon: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },

  tabsScroll: {
    paddingBottom: 4,
    marginBottom: 16,
  },

  tabsRow: {
    flexDirection: "row",
    gap: 10,
  },

  tabBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tabBtnActive: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },

  tabBtnText: {
    color: "#c2d1ee",
    fontWeight: "700",
    fontSize: 15,
  },

  tabBtnTextActive: {
    color: "#fff",
  },

  toolbar: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
    alignItems: "center",
  },

  toolbarPhone: {
    flexDirection: "column",
    alignItems: "stretch",
  },

  searchInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    color: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },

  excelBtn: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  excelBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  tableCard: {
    backgroundColor: "rgba(7,17,31,0.45)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 14,
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 14,
  },

  tableHeader: {
    flexDirection: "row",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    marginBottom: 6,
  },

  th: {
    color: "#8ea0c0",
    fontSize: 14,
    fontWeight: "700",
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 8,
  },

  td: {
    color: "#f7fbff",
    fontSize: 14,
  },

  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: "hidden",
    color: "#fff",
  },

  badgeIn: {
    backgroundColor: "rgba(16,185,129,0.22)",
  },

  badgeOut: {
    backgroundColor: "rgba(245,158,11,0.22)",
  },

  methodBadge: {
    color: "#d8e2f5",
    fontSize: 13,
    textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: "hidden",
  },

  emptyText: {
    color: "#95a6c5",
    textAlign: "center",
    paddingVertical: 24,
  },

  mobileCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },

  mobileName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  mobileLine: {
    color: "#d8e2f5",
    marginTop: 4,
    fontSize: 14,
  },
});