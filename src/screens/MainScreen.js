import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from "react-native";

export default function MainScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const [time, setTime] = useState(new Date());

  const isTablet = width >= 900;
  const isSmallPhone = width < 430;

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
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
          <Text style={[styles.clock, isTablet && styles.clockTablet, isSmallPhone && styles.clockPhone]}>
            {formatTime(time)}
          </Text>

          <Text style={[styles.date, isTablet && styles.dateTablet]}>
            {formatDate(time)}
          </Text>

          <Text style={[styles.title, isTablet && styles.titleTablet]}>
            SISTEMA DE CONTROL DE ACCESO
          </Text>

          <Text style={[styles.subtitle, isTablet && styles.subtitleTablet]}>
            Selecciona tu perfil para continuar
          </Text>

          <View
            style={[
              styles.cardsWrapper,
              isTablet ? styles.cardsWrapperTablet : styles.cardsWrapperPhone,
            ]}
          >
            <TouchableOpacity
              style={[
                styles.card,
                styles.cardAdmin,
                isTablet ? styles.cardTablet : styles.cardPhone,
              ]}
              onPress={() => navigation.navigate("AdminLogin")}
              activeOpacity={0.9}
            >
              <Text style={styles.cardIcon}>🛡</Text>
              <Text style={styles.cardTitle}>Administrador</Text>
              <Text style={styles.cardDesc}>Gestión y reportes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.card,
                styles.cardWorker,
                isTablet ? styles.cardTablet : styles.cardPhone,
              ]}
              onPress={() => navigation.navigate("WorkerScan")}
              activeOpacity={0.9}
            >
              <Text style={styles.cardIcon}>📷</Text>
              <Text style={styles.cardTitle}>Trabajador</Text>
              <Text style={styles.cardDesc}>Registro de asistencia</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.card,
                styles.cardVisitor,
                isTablet ? styles.cardTablet : styles.cardPhone,
              ]}
              onPress={() => navigation.navigate("Visitor")}
              activeOpacity={0.9}
            >
              <Text style={styles.cardIcon}>👤</Text>
              <Text style={styles.cardTitle}>Visitante</Text>
              <Text style={styles.cardDesc}>Registro de visita</Text>
            </TouchableOpacity>
          </View>
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

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
  },

  scrollContentTablet: {
    paddingHorizontal: 40,
    paddingVertical: 36,
  },

  bgGlowOne: {
    position: "absolute",
    top: 60,
    left: -40,
    width: 220,
    height: 220,
    borderRadius: 140,
    backgroundColor: "rgba(41,98,255,0.14)",
  },

  bgGlowOneTablet: {
    top: 100,
    left: 80,
    width: 300,
    height: 300,
    borderRadius: 180,
  },

  bgGlowTwo: {
    position: "absolute",
    bottom: 90,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 140,
    backgroundColor: "rgba(124,58,237,0.14)",
  },

  bgGlowTwoTablet: {
    bottom: 120,
    right: 100,
    width: 300,
    height: 300,
    borderRadius: 180,
  },

  container: {
    alignItems: "center",
    width: "100%",
    alignSelf: "center",
  },

  containerTablet: {
    maxWidth: 1180,
  },

  clock: {
    fontSize: 56,
    color: "#ffffff",
    fontWeight: "800",
    textAlign: "center",
  },

  clockPhone: {
    fontSize: 48,
  },

  clockTablet: {
    fontSize: 96,
    fontWeight: "300",
  },

  date: {
    marginTop: 6,
    fontSize: 15,
    color: "#9fb2d9",
    textAlign: "center",
  },

  dateTablet: {
    fontSize: 20,
    marginBottom: 8,
  },

  title: {
    marginTop: 26,
    color: "#cbd5f5",
    letterSpacing: 2.4,
    fontSize: 12,
    textAlign: "center",
  },

  titleTablet: {
    fontSize: 15,
    letterSpacing: 4,
  },

  subtitle: {
    color: "#9fb2d9",
    marginTop: 8,
    marginBottom: 26,
    textAlign: "center",
    fontSize: 14,
  },

  subtitleTablet: {
    fontSize: 18,
    marginBottom: 38,
  },

  cardsWrapper: {
    width: "100%",
  },

  cardsWrapperPhone: {
    gap: 14,
  },

  cardsWrapperTablet: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
  },

  card: {
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 20,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  cardPhone: {
    width: "100%",
    minHeight: 128,
  },

  cardTablet: {
    flex: 1,
    minHeight: 170,
    maxWidth: 320,
  },

  cardIcon: {
    fontSize: 28,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },

  cardDesc: {
    marginTop: 6,
    color: "#e6e9ff",
    fontSize: 15,
  },

  cardAdmin: {
    backgroundColor: "#7c3aed",
  },

  cardWorker: {
    backgroundColor: "#059669",
  },

  cardVisitor: {
    backgroundColor: "#2563eb",
  },
});