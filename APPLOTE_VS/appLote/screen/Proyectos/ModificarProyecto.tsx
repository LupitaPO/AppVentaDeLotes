import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import * as DocumentPicker from "expo-document-picker";

const API_URL = "http://10.246.197.207:90";

const ModificarProyecto = ({ navigation, route }) => {
  const { proyecto } = route.params || {};

  // Estados para el formulario, pre-llenados con los datos del proyecto
  const [codProyecto, setCodProyecto] = useState(proyecto?.CodProyecto || "");
  const [Nombre, setNombre] = useState(proyecto?.Nombre || "");
  const [ubicacion, setUbicacion] = useState(proyecto?.Ubicacion || "");
  const [numHectareas, setNumHectareas] = useState(proyecto?.NumHectareas?.toString() || "");
  const [partidaRegistral, setPartidaRegistral] = useState(proyecto?.PartidaRegistral || "");
  const [archivoCSV, setArchivoCSV] = useState(null);

  // Función para seleccionar el archivo CSV
  const seleccionarArchivo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setArchivoCSV(result.assets[0]);
        Alert.alert("Archivo cargado", result.assets[0].name);
      }
    } catch (err) {
      console.log("Error al seleccionar archivo", err);
    }
  };

  // Función para actualizar (Enviando al Backend)
  const actualizarProyecto = async () => {
    if (!codProyecto.trim() || !Nombre.trim() || !ubicacion.trim() || !numHectareas.trim() || !partidaRegistral.trim()) {
      Alert.alert("Campos incompletos", "Por favor completa todos los campos antes de actualizar.");
      return;
    }

    const formData = new FormData();
    formData.append("IdProyecto", proyecto?.IdProyecto?.toString() || "");
    formData.append("CodProyecto", codProyecto);
    formData.append("Nombre", Nombre);
    formData.append("Ubicacion", ubicacion);
    formData.append("NumeroHectareas", numHectareas);
    formData.append("PartidaRegistral", partidaRegistral);
    formData.append("Estado", proyecto?.Estado || "A");

    if (archivoCSV) {
      formData.append("ArchivoPlano", {
        uri: archivoCSV.uri,
        name: archivoCSV.name,
        type: "text/csv",
      });
    }

    try {
      const response = await fetch(`${API_URL}/Proyecto/proyecto_Actualizar`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = await response.text();
      if (response.ok) {
        Alert.alert("Éxito", "Proyecto actualizado correctamente", [
          {
            text: "OK",
            onPress: () => {
              route.params?.onRefresh?.();
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert("Error", "No se pudo actualizar el proyecto. " + result);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error de red", "Verifica que tu API esté encendida");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modificar Proyecto</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Código de Proyecto:</Text>
        <TextInput
          style={styles.input}
          placeholder="Código de Proyecto"
          value={codProyecto}
          onChangeText={setCodProyecto}
        />

        <Text style={styles.label}>Nombre del Proyecto:</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre del Proyecto"
          value={Nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Ubicación:</Text>
        <TextInput
          style={styles.input}
          placeholder="Ubicación"
          value={ubicacion}
          onChangeText={setUbicacion}
        />

        <Text style={styles.label}>Número de Hectáreas:</Text>
        <TextInput
          style={styles.input}
          placeholder="Número de Hectáreas"
          keyboardType="numeric"
          value={numHectareas}
          onChangeText={setNumHectareas}
        />

        <Text style={styles.label}>Partida Registral:</Text>
        <TextInput
          style={styles.input}
          placeholder="Partida Registral"
          value={partidaRegistral}
          onChangeText={setPartidaRegistral}
        />

        <TouchableOpacity
          style={styles.btnArchivo}
          onPress={seleccionarArchivo}
        >
          <Text style={styles.btnTextArchivo}>
            {archivoCSV
              ? `Seleccionado: ${archivoCSV.name}`
              : "📁 Seleccionar Plano (.csv)"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGuardar} onPress={actualizarProyecto}>
          <Text style={styles.btnTextGuardar}>ACTUALIZAR PROYECTO</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.btnregresar}
        onPress={() => navigation.goBack()}
      >
        <Text>regresar</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
    textAlign: "center",
  },
  form: {
    flex: 1,
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  btnArchivo: {
    backgroundColor: "#ff9800",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
  },
  btnTextArchivo: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  btnGuardar: {
    backgroundColor: "#069488",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  btnTextGuardar: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  btnregresar: {
    alignItems: "center",
    paddingBottom: 20,
  },
});

export default ModificarProyecto;