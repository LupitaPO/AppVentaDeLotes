import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from '@react-navigation/native';

const API_URL = "http://10.90.221.207:90";
//Revisión
const asesor = ({ navigation, route }) => {
  const { nombre, rol } = route.params || {};
  const tabBarHeight = useBottomTabBarHeight();
  const [asesores, setAsesores] = useState([]);
  const [cargando, setCargando] = useState(true);

  const obtenerAsesores = async () => {
    try {
      const response = await fetch(`${API_URL}/Asesor/asesor_Listar`);
      const data = await response.json();
      setAsesores(data);
    } catch (error) {
      console.error("Error al listar asesores:", error);
    } finally {
      setCargando(false);
    }
  };

  const anularAsesor = async (dni) => {
    try {
      const response = await fetch(`${API_URL}/Asesor/asesor_Anular/${dni}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        Alert.alert("Éxito", "Asesor anulado correctamente");
        obtenerAsesores();
      } else {
        const errorMsg = await response.text();
        console.log("Error del server:", errorMsg);
        Alert.alert("Error", "No se pudo anular el asesor");
      }
    } catch (error) {
      console.error("Error al anular asesor:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    }
  };

  useFocusEffect(() => {
    obtenerAsesores();
  });

  if (cargando)
    return (
      <ActivityIndicator size="large" color="#069488" style={{ flex: 1 }} />
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestion de Asesores:</Text>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.subtitle}>Selecciona un Asesor:</Text>

        {asesores.map((asesorItem, index) => {
          const nombreCompleto = [
            asesorItem.Nombre1,
            asesorItem.Nombre2,
            asesorItem.Apaterno,
            asesorItem.Amaterno,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <TouchableOpacity
              key={asesorItem.IdAsesor ? asesorItem.IdAsesor.toString() : index.toString()}
              style={styles.card}
              onPress={() =>
                Alert.alert(
                  "Opciones para Asesor",
                  `¿Qué deseas hacer con ${nombreCompleto}?`,
                  [
                    {
                      text: "Anular",
                      onPress: () => anularAsesor(asesorItem.DNI),
                    },
                    {
                      text: "Modificar",
                      onPress: () =>
                        navigation.navigate("ModificarAsesor", {
                          asesor: asesorItem,
                          onRefresh: obtenerAsesores,
                        }),
                    },
                    {
                      text: "Cancelar",
                      style: "cancel",
                    },
                  ]
                )
              }
            >
              <Text style={styles.cardTitle}>{nombreCompleto || "Asesor sin nombre"}</Text>
              <Text style={styles.cardText}>DNI: {asesorItem.DNI || "N/A"}</Text>
              <Text style={styles.cardText}>Celular: {asesorItem.Celular || "N/A"}</Text>
              <Text style={styles.cardText}>Observaciones: {asesorItem.Observaciones || "N/A"}</Text>
              <Text style={styles.cardText}>Estado: {asesorItem.Estado || "N/A"}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.grid}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("RegistrarAsesor", { onRefresh: obtenerAsesores })
          }
          style={styles.btnRegistrar}
        >
          <Text style={styles.btnRegisText}>Registrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e4f5f3",
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#069488",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 15,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#069488",
  },
  cardText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 3,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  btnRegistrar: {
    backgroundColor: "#29c268",
    width: 378,
    height: 50,
    marginBottom: 5,
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  btnRegisText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default asesor