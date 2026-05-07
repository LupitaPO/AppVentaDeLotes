import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import React, { useState } from "react";

const API_URL = "http://10.246.197.207:90";

const RegistrarAsesor = ({ navigation, route }) => {
  const [dni, setDni] = useState("");
  const [nombre1, setNombre1] = useState("");
  const [nombre2, setNombre2] = useState("");
  const [apaterno, setApaterno] = useState("");
  const [amaterno, setAmaterno] = useState("");
  const [celular, setCelular] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [cargando, setCargando] = useState(false);

  const registrarAsesor = async () => {
    if (!dni.trim() || !nombre1.trim() || !apaterno.trim()) {
      Alert.alert("Error", "DNI, Primer Nombre y Apellido Paterno son obligatorios");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/Asesor/asesor_Registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          DNI: dni.trim(),
          Nombre1: nombre1.trim(),
          Nombre2: nombre2.trim() || "",
          Apaterno: apaterno.trim(),
          Amaterno: amaterno.trim(),
          Celular: celular.trim(),
          Observaciones: observaciones.trim() || "",
          Estado: "A",
        }),
      });

      const data = await response.text();
      if (response.ok) {
        Alert.alert("Éxito", "Asesor registrado correctamente", [
          {
            text: "OK",
            onPress: () => {
              route.params?.onRefresh?.();
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert("Error del servidor", data);
      }
    } catch (error) {
      console.error("Error al registrar asesor:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar Nuevo Asesor</Text>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.label}>DNI:</Text>
        <TextInput
          style={styles.input}
          value={dni}
          onChangeText={setDni}
          placeholder="DNI"
          keyboardType="numeric"
        />

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Nombre 1:</Text>
            <TextInput
              style={styles.input}
              value={nombre1}
              onChangeText={setNombre1}
              placeholder="Nombre 1"
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Nombre 2:</Text>
            <TextInput
              style={styles.input}
              value={nombre2}
              onChangeText={setNombre2}
              placeholder="Nombre 2 (opcional)"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Apellido Paterno:</Text>
            <TextInput
              style={styles.input}
              value={apaterno}
              onChangeText={setApaterno}
              placeholder="Apellido Paterno"
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Apellido Materno:</Text>
            <TextInput
              style={styles.input}
              value={amaterno}
              onChangeText={setAmaterno}
              placeholder="Apellido Materno"
            />
          </View>
        </View>

        <Text style={styles.label}>Celular:</Text>
        <TextInput
          style={styles.input}
          value={celular}
          onChangeText={setCelular}
          placeholder="Celular"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Observaciones:</Text>
        <TextInput
          style={styles.input}
          value={observaciones}
          onChangeText={setObservaciones}
          placeholder="Observaciones"
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={styles.btnGuardar}
          disabled={cargando}
          onPress={registrarAsesor}
        >
          <Text style={styles.btnText}>Registrar Asesor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnCancelar}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#069488",
    textAlign: "center",
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginTop: 15,
    marginBottom: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#f1f1f1",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  column: {
    width: "48%",
  },
  btnGuardar: {
    backgroundColor: "#29c268",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  btnCancelar: {
    backgroundColor: "#d3002e",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default RegistrarAsesor;
