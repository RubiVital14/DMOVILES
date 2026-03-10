import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  useWindowDimensions,
  Modal,
  Image,
} from "react-native";
import {
  fetchWorkers,
  fetchLogs,
  fetchVisitors,
  createWorker,
  updateWorker,
  deleteWorker,
  createAdmin,
  changeAdminPassword,
  getAsistenciaExcelUrl,
} from "../services/api";

export default function AdminHome({ navigation }) {
  const { width } = useWindowDimensions();
  const isPhone = width < 700;
  const isTablet = width >= 900;
  const horizontalPadding = isTablet ? 28 : 16;

  const [workers, setWorkers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("asistencia");

  const [filterType, setFilterType] = useState("Todos");
  const [filterDept, setFilterDept] = useState("Todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [email, setEmail] = useState("");

  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [passwordUsername, setPasswordUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editWorkerId, setEditWorkerId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const loadData = async () => {
    try {
      const workersData = await fetchWorkers();
      const logsData = await fetchLogs();
      const visitorsData = await fetchVisitors();

      setWorkers(Array.isArray(workersData) ? workersData : []);
      setLogs(Array.isArray(logsData) ? logsData : []);
      setVisitors(Array.isArray(visitorsData) ? visitorsData : []);
    } catch (e) {
      Alert.alert("Error", "No se pudieron cargar los datos");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const now = new Date();
  const today =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0");

  const departamentos = useMemo(() => {
    const set = new Set(workers.map((w) => w.area).filter(Boolean));
    return ["Todos", ...Array.from(set)];
  }, [workers]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        String(l.full_name || "").toLowerCase().includes(q) ||
        String(l.employee_no || "").toLowerCase().includes(q) ||
        String(l.area || "").toLowerCase().includes(q);

      const matchesType =
        filterType === "Todos" || String(l.action || "") === filterType;

      const matchesDept =
        filterDept === "Todos" || String(l.area || "") === filterDept;

      const logDate = String(l.created_at || "").slice(0, 10);

      const matchesFrom = !dateFrom || logDate >= dateFrom;
      const matchesTo = !dateTo || logDate <= dateTo;

      return matchesSearch && matchesType && matchesDept && matchesFrom && matchesTo;
    });
  }, [logs, search, filterType, filterDept, dateFrom, dateTo]);

  const filteredWorkers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return workers;

    return workers.filter((w) => {
      return (
        String(w.full_name || "").toLowerCase().includes(q) ||
        String(w.employee_no || "").toLowerCase().includes(q) ||
        String(w.area || "").toLowerCase().includes(q) ||
        String(w.email || "").toLowerCase().includes(q)
      );
    });
  }, [workers, search]);

  const filteredVisitors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visitors;

    return visitors.filter((v) => {
      return (
        String(v.full_name || "").toLowerCase().includes(q) ||
        String(v.company || "").toLowerCase().includes(q) ||
        String(v.phone || "").toLowerCase().includes(q) ||
        String(v.reason || "").toLowerCase().includes(q)
      );
    });
  }, [visitors, search]);

  const entradasHoy = logs.filter(
    (l) =>
      l.action === "Entrada" &&
      String(l.created_at || "").slice(0, 10) === today
  ).length;

  const salidasHoy = logs.filter(
    (l) =>
      l.action === "Salida" &&
      String(l.created_at || "").slice(0, 10) === today
  ).length;

  const visitantesHoy = visitors.filter(
    (v) => String(v.created_at || "").slice(0, 10) === today
  ).length;

  const handleCreateWorker = async () => {
    try {
      if (!name.trim() || !area.trim()) {
        Alert.alert("Error", "Completa nombre y departamento");
        return;
      }

      await createWorker({
        full_name: name.trim(),
        area: area.trim(),
        email: email.trim() || null,
        face_key: null,
      });

      setName("");
      setArea("");
      setEmail("");
      setShowWorkerForm(false);
      await loadData();
      Alert.alert("Correcto", "Empleado creado");
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo crear el empleado");
    }
  };

  const handleCreateAdmin = async () => {
    try {
      if (!adminUsername.trim() || !adminPassword.trim()) {
        Alert.alert("Error", "Completa usuario y contraseña");
        return;
      }

      await createAdmin({
        username: adminUsername.trim(),
        password: adminPassword.trim(),
      });

      setAdminUsername("");
      setAdminPassword("");
      setShowAdminForm(false);
      Alert.alert("Correcto", "Administrador creado");
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo crear el administrador");
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!passwordUsername.trim() || !currentPassword.trim() || !newPassword.trim()) {
        Alert.alert("Error", "Completa todos los campos");
        return;
      }

      await changeAdminPassword({
        username: passwordUsername.trim(),
        current_password: currentPassword.trim(),
        new_password: newPassword.trim(),
      });

      setPasswordUsername("");
      setCurrentPassword("");
      setNewPassword("");
      setShowPasswordModal(false);
      Alert.alert("Correcto", "Contraseña actualizada");
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo cambiar la contraseña");
    }
  };

  const openEditModal = (worker) => {
    setEditWorkerId(worker.id);
    setEditName(worker.full_name || "");
    setEditArea(worker.area || "");
    setEditEmail(worker.email || "");
    setEditModalVisible(true);
  };

  const handleUpdateWorker = async () => {
    try {
      if (!editName.trim() || !editArea.trim()) {
        Alert.alert("Error", "Completa nombre y departamento");
        return;
      }

      await updateWorker(editWorkerId, {
        full_name: editName.trim(),
        area: editArea.trim(),
        email: editEmail.trim() || null,
        face_key: null,
      });

      setEditModalVisible(false);
      await loadData();
      Alert.alert("Correcto", "Empleado actualizado");
    } catch (e) {
      Alert.alert("Error", e?.message || "No se pudo actualizar");
    }
  };

  const handleDeleteWorker = async (worker) => {
    Alert.alert(
      "Eliminar empleado",
      `¿Deseas eliminar a ${worker.full_name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWorker(worker.id);
              await loadData();
              Alert.alert("Correcto", "Empleado eliminado");
            } catch (e) {
              Alert.alert("Error", e?.message || "No se pudo eliminar");
            }
          },
        },
      ]
    );
  };

  const descargarExcel = async () => {
    try {
      await Linking.openURL(getAsistenciaExcelUrl());
    } catch {
      Alert.alert("Error", "No se pudo descargar el Excel");
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sí",
        onPress: () => navigation.replace("AdminLogin"),
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.bgGlowOne} />
      <View style={styles.bgGlowTwo} />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Panel de Administración</Text>
            <Text style={styles.subtitle}>Control de acceso y asistencia</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerGhostBtn}
              onPress={() => setShowAdminForm(true)}
            >
              <Text style={styles.headerGhostText}>Agregar Administrador</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerGhostBtn}
              onPress={() => setShowPasswordModal(true)}
            >
              <Text style={styles.headerGhostText}>Cambiar contraseña</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerGhostBtn} onPress={handleLogout}>
              <Text style={styles.headerGhostText}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <KpiCard label="ENTRADAS HOY" value={entradasHoy} accent="#10b981" />
          <KpiCard label="SALIDAS HOY" value={salidasHoy} accent="#f59e0b" />
          <KpiCard label="EMPLEADOS" value={workers.length} accent="#7c3aed" />
          <KpiCard label="VISITANTES HOY" value={visitantesHoy} accent="#0ea5e9" />
        </View>

        <View style={styles.tabsRow}>
          <Tab label="Asistencia" active={activeTab === "asistencia"} onPress={() => setActiveTab("asistencia")} />
          <Tab label="Visitantes" active={activeTab === "visitantes"} onPress={() => setActiveTab("visitantes")} />
          <Tab label="Empleados" active={activeTab === "empleados"} onPress={() => setActiveTab("empleados")} />
        </View>

        {activeTab === "asistencia" && (
          <>
            <View style={styles.filtersWrap}>
              <TextInput
                style={styles.search}
                placeholder="Buscar por nombre o número..."
                placeholderTextColor="#8ea0c0"
                value={search}
                onChangeText={setSearch}
              />

              <View style={styles.selectMock}>
                <Text style={styles.selectText}>{filterType}</Text>
              </View>

              <View style={styles.selectMock}>
                <Text style={styles.selectText}>{filterDept}</Text>
              </View>

              <TouchableOpacity
                style={styles.selectMock}
                onPress={() => {
                  const next = filterType === "Todos"
                    ? "Entrada"
                    : filterType === "Entrada"
                    ? "Salida"
                    : "Todos";
                  setFilterType(next);
                }}
              >
                <Text style={styles.selectText}>{filterType}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.selectMock}
                onPress={() => {
                  const idx = departamentos.indexOf(filterDept);
                  const next = departamentos[(idx + 1) % departamentos.length];
                  setFilterDept(next);
                }}
              >
                <Text style={styles.selectText}>{filterDept}</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.dateInput}
                placeholder="2026-03-01"
                placeholderTextColor="#8ea0c0"
                value={dateFrom}
                onChangeText={setDateFrom}
              />
              <TextInput
                style={styles.dateInput}
                placeholder="2026-03-10"
                placeholderTextColor="#8ea0c0"
                value={dateTo}
                onChangeText={setDateTo}
              />

              <TouchableOpacity style={styles.excelBtn} onPress={descargarExcel}>
                <Text style={styles.excelText}>Descargar Excel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tableShell}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 1.4 }]}>Empleado</Text>
                <Text style={[styles.headerCell, { flex: 1.1 }]}>No. Empleado</Text>
                <Text style={[styles.headerCell, { flex: 1.3 }]}>Departamento</Text>
                <Text style={[styles.headerCell, { flex: 1 }]}>Tipo</Text>
                <Text style={[styles.headerCell, { flex: 1 }]}>Método</Text>
                <Text style={[styles.headerCell, { flex: 1.6 }]}>Fecha y Hora</Text>
              </View>

              <View style={styles.tableCard}>
                {filteredLogs.map((l) => (
                  <View key={l.id} style={styles.workerRow}>
                    <View style={[styles.cell, { flex: 1.4 }]}>
                      <Text style={styles.workerName}>{l.full_name}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1.1 }]}>
                      <Text style={styles.workerMeta}>{l.employee_no}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1.3 }]}>
                      <Text style={styles.workerMeta}>{l.area}</Text>
                    </View>
                    <View style={[styles.cell, { flex: 1 }]}>
                      <View style={l.action === "Entrada" ? styles.entryBadge : styles.exitBadge}>
                        <Text style={styles.badgeText}>{l.action}</Text>
                      </View>
                    </View>
                    <View style={[styles.cell, { flex: 1 }]}>
                      <View style={styles.methodBadge}>
                        <Text style={styles.badgeText}>{l.method || "Rostro"}</Text>
                      </View>
                    </View>
                    <View style={[styles.cell, { flex: 1.6 }]}>
                      <Text style={styles.workerMeta}>{l.created_at}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {activeTab === "empleados" && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Empleados ({filteredWorkers.length})</Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setShowWorkerForm(!showWorkerForm)}
              >
                <Text style={styles.primaryBtnText}>
                  {showWorkerForm ? "Cerrar" : "+ Nuevo Empleado"}
                </Text>
              </TouchableOpacity>
            </View>

            {showWorkerForm && (
              <View style={styles.formCard}>
                <Text style={styles.label}>Nombre completo</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Nombre completo"
                  placeholderTextColor="#8ea0c0"
                />

                <Text style={styles.label}>Departamento</Text>
                <TextInput
                  style={styles.input}
                  value={area}
                  onChangeText={setArea}
                  placeholder="Departamento"
                  placeholderTextColor="#8ea0c0"
                />

                <Text style={styles.label}>Correo</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="correo@empresa.com"
                  placeholderTextColor="#8ea0c0"
                />

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWorkerForm(false)}>
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtnSmall} onPress={handleCreateWorker}>
                    <Text style={styles.primaryBtnText}>Crear Empleado</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.tableShell}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 0.8 }]}>Foto</Text>
                <Text style={[styles.headerCell, { flex: 1.5 }]}>Nombre</Text>
                <Text style={[styles.headerCell, { flex: 1.2 }]}>No. Empleado</Text>
                <Text style={[styles.headerCell, { flex: 1.5 }]}>Departamento</Text>
                <Text style={[styles.headerCell, { flex: 1.7 }]}>Correo</Text>
                <Text style={[styles.headerCell, { flex: 1 }]}>Estado</Text>
                <Text style={[styles.headerCell, { flex: 1 }]}>Acciones</Text>
              </View>

              <View style={styles.tableCard}>
                {filteredWorkers.map((w) => (
                  <View key={w.id} style={styles.workerRow}>
                    <View style={[styles.cell, { flex: 0.8 }]}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarLetter}>
                          {String(w.full_name || "?").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={[styles.cell, { flex: 1.5 }]}>
                      <Text style={styles.workerName}>{w.full_name}</Text>
                    </View>

                    <View style={[styles.cell, { flex: 1.2 }]}>
                      <Text style={styles.workerMeta}>{w.employee_no}</Text>
                    </View>

                    <View style={[styles.cell, { flex: 1.5 }]}>
                      <Text style={styles.workerMeta}>{w.area}</Text>
                    </View>

                    <View style={[styles.cell, { flex: 1.7 }]}>
                      <Text style={styles.workerMeta}>{w.email || "-"}</Text>
                    </View>

                    <View style={[styles.cell, { flex: 1 }]}>
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Activo</Text>
                      </View>
                    </View>

                    <View style={[styles.cell, { flex: 1 }]}>
                      <View style={styles.actionsRow}>
                        <TouchableOpacity onPress={() => openEditModal(w)}>
                          <Text style={styles.editText}>✎</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteWorker(w)}>
                          <Text style={styles.deleteText}>🗑</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {activeTab === "visitantes" && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Visitantes ({filteredVisitors.length})</Text>
            </View>

            <View style={styles.tableShell}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, { flex: 0.8 }]}>Foto</Text>
                <Text style={[styles.headerCell, { flex: 1.5 }]}>Nombre</Text>
                <Text style={[styles.headerCell, { flex: 1.4 }]}>Empresa</Text>
                <Text style={[styles.headerCell, { flex: 1.1 }]}>Teléfono</Text>
                <Text style={[styles.headerCell, { flex: 1.5 }]}>Motivo</Text>
                <Text style={[styles.headerCell, { flex: 1.5 }]}>Fecha</Text>
              </View>

              <View style={styles.tableCard}>
                {filteredVisitors.map((v) => (
                  <View key={v.id} style={styles.workerRow}>
                    <View style={[styles.cell, { flex: 0.8 }]}>
                      {v.photo_uri ? (
                        <Image source={{ uri: v.photo_uri }} style={styles.visitorThumb} />
                      ) : (
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarLetter}>V</Text>
                        </View>
                      )}
                    </View>

                    <View style={[styles.cell, { flex: 1.5 }]}>
                      <Text style={styles.workerName}>{v.full_name}</Text>
                    </View>

                    <View style={[styles.cell, { flex: 1.4 }]}>
                      <Text style={styles.workerMeta}>{v.company || "-"}</Text>
                    </View>

                    <View style={[styles.cell, { flex: 1.1 }]}>
                      <Text style={styles.workerMeta}>{v.phone || "-"}</Text>
                    </View>

                    <View style={[styles.cell, { flex: 1.5 }]}>
                      <Text style={styles.workerMeta}>{v.reason || "-"}</Text>
                    </View>

                    <View style={[styles.cell, { flex: 1.5 }]}>
                      <Text style={styles.workerMeta}>{v.created_at || "-"}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar empleado</Text>

            <Text style={styles.label}>Nombre completo</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Nombre completo"
              placeholderTextColor="#8ea0c0"
            />

            <Text style={styles.label}>Departamento</Text>
            <TextInput
              style={styles.input}
              value={editArea}
              onChangeText={setEditArea}
              placeholder="Departamento"
              placeholderTextColor="#8ea0c0"
            />

            <Text style={styles.label}>Correo</Text>
            <TextInput
              style={styles.input}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="correo@empresa.com"
              placeholderTextColor="#8ea0c0"
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryBtnSmall}
                onPress={handleUpdateWorker}
              >
                <Text style={styles.primaryBtnText}>Guardar cambios</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showAdminForm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agregar Administrador</Text>

            <Text style={styles.label}>Usuario</Text>
            <TextInput
              style={styles.input}
              value={adminUsername}
              onChangeText={setAdminUsername}
              placeholder="Nuevo usuario"
              placeholderTextColor="#8ea0c0"
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={adminPassword}
              onChangeText={setAdminPassword}
              placeholder="Nueva contraseña"
              placeholderTextColor="#8ea0c0"
              secureTextEntry
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAdminForm(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryBtnSmall}
                onPress={handleCreateAdmin}
              >
                <Text style={styles.primaryBtnText}>Crear administrador</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cambiar contraseña</Text>

            <Text style={styles.label}>Usuario</Text>
            <TextInput
              style={styles.input}
              value={passwordUsername}
              onChangeText={setPasswordUsername}
              placeholder="Usuario"
              placeholderTextColor="#8ea0c0"
            />

            <Text style={styles.label}>Contraseña actual</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Contraseña actual"
              placeholderTextColor="#8ea0c0"
              secureTextEntry
            />

            <Text style={styles.label}>Nueva contraseña</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Nueva contraseña"
              placeholderTextColor="#8ea0c0"
              secureTextEntry
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryBtnSmall}
                onPress={handleChangePassword}
              >
                <Text style={styles.primaryBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function KpiCard({ label, value, accent }) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <View style={styles.kpiBottom}>
        <Text style={styles.kpiValue}>{value}</Text>
        <View style={[styles.kpiIcon, { backgroundColor: accent }]}>
          <Text style={styles.kpiIconText}>•</Text>
        </View>
      </View>
    </View>
  );
}

function Tab({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#07111f" },
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
  container: { paddingVertical: 24, paddingBottom: 50 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  title: { fontSize: 32, color: "#fff", fontWeight: "700" },
  subtitle: { color: "#8ea0c0", marginTop: 4 },
  headerActions: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  headerGhostBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  headerGhostText: { color: "#b8c7e6", fontSize: 13, fontWeight: "600" },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 24 },
  kpiCard: {
    backgroundColor: "#0f1b34",
    borderRadius: 16,
    padding: 18,
    minWidth: 170,
    flexGrow: 1,
  },
  kpiLabel: { color: "#8ea0c0", fontSize: 12, marginBottom: 12 },
  kpiBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  kpiValue: { color: "#fff", fontSize: 34, fontWeight: "800" },
  kpiIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiIconText: { color: "#fff", fontSize: 22, fontWeight: "900" },
  tabsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  tab: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: "#111827",
  },
  tabActive: { backgroundColor: "#7c3aed" },
  tabText: { color: "#9fb2d9", fontWeight: "700" },
  tabTextActive: { color: "#fff" },
  filtersWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
    alignItems: "center",
  },
  search: {
    flex: 1,
    minWidth: 240,
    backgroundColor: "#111827",
    padding: 13,
    borderRadius: 10,
    color: "#fff",
  },
  selectMock: {
    minWidth: 120,
    backgroundColor: "#1b2943",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  selectText: { color: "#d6e1f6" },
  dateInput: {
    minWidth: 130,
    backgroundColor: "#1b2943",
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    color: "#fff",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  sectionTitle: { color: "#fff", fontSize: 28, fontWeight: "700" },
  primaryBtn: {
    backgroundColor: "#7c3aed",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  primaryBtnSmall: {
    backgroundColor: "#7c3aed",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  formCard: {
    backgroundColor: "#16233b",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  formRow: { flexDirection: "row", gap: 18, flexWrap: "wrap" },
  photoBox: {
    width: 140,
    minHeight: 150,
    borderRadius: 16,
    backgroundColor: "#25344f",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  photoIcon: { fontSize: 28, marginBottom: 8 },
  photoText: { color: "#d9e3f9", fontWeight: "700" },
  photoSubtext: { marginTop: 6, color: "#c9a84a", fontSize: 12, textAlign: "center" },
  formInputs: { flex: 1, minWidth: 260 },
  label: { color: "#c8d6f3", marginBottom: 6, marginTop: 8, fontWeight: "600" },
  input: {
    backgroundColor: "#2a3954",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
  },
  readonlyBox: {
    backgroundColor: "#2a3954",
    borderRadius: 10,
    padding: 14,
  },
  readonlyText: { color: "#8ea0c0" },
  inlineRow: { flexDirection: "row", gap: 12, marginTop: 2, flexWrap: "wrap" },
  inlineCol: { flex: 1, minWidth: 180 },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
    flexWrap: "wrap",
  },
  cancelBtn: {
    backgroundColor: "#111827",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cancelBtnText: { color: "#fff", fontWeight: "700" },
  tableShell: { gap: 8 },
  tableHeader: { flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10 },
  headerCell: { color: "#8ea0c0", fontSize: 12, fontWeight: "700" },
  tableCard: {
    backgroundColor: "#0f1b34",
    borderRadius: 16,
    overflow: "hidden",
  },
  workerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 10,
  },
  cell: { justifyContent: "center" },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#2f3e5b",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: "#d9e3f9", fontWeight: "800" },
  workerName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  workerMeta: { color: "#8ea0c0", fontSize: 14 },
  activeBadge: {
    backgroundColor: "rgba(16,185,129,0.18)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  activeBadgeText: { color: "#34d399", fontWeight: "700", fontSize: 12 },
  entryBadge: {
    backgroundColor: "rgba(16,185,129,0.18)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  exitBadge: {
    backgroundColor: "rgba(245,158,11,0.18)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  methodBadge: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  editText: { color: "#c2b3ff", fontSize: 18 },
  deleteText: { color: "#ff8a8a", fontSize: 18 },
  actionsRow: { flexDirection: "row", gap: 12 },
  visitorThumb: { width: 42, height: 42, borderRadius: 12 },
  excelBtn: {
    backgroundColor: "#111827",
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  excelText: { color: "#fff", fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#16233b",
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: { color: "#fff", fontSize: 24, fontWeight: "700", marginBottom: 8 },
});