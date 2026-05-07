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

const Rproyecto = ({ navigation, route }) => {
  const { nombre, rol } = route.params;

  //  estados par el formulario
  const [codProyecto, setcodProyecto] = useState("");
  const [Nombre, setnombre] = useState("");
  const [ubicacion, setubicacion] = useState("");
  const [numHectareas, setnumHecatreas] = useState("");
  const [partidaRegistral, setPartidaRegistral] = useState("");
  const [archivoCSV, setArchivoCSV] = useState(null);
  // Función para seleccionar el archivo CSV
  const seleccionarArchivo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Puedes probar con "text/comma-separated-values" después
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setArchivoCSV(result.assets[0]); // Guardamos el primer archivo seleccionado
        Alert.alert("Archivo cargado", result.assets[0].name);
      }
    } catch (err) {
      console.log("Error al seleccionar archivo", err);
    }
  };

  // Función para registrar (Enviando al Backend)
  const registrarProyecto = async () => {
    // Validar que el archivo exista
    if (!archivoCSV) {
      Alert.alert("Error", "Debes seleccionar el plano de AutoCAD (.csv)");
      return;
    }

    const formData = new FormData();
    // ESTOS NOMBRES DEBEN SER IGUALES A TU CLASE PROYECTO EN C#
    formData.append("CodProyecto", codProyecto);
    formData.append("Nombre", Nombre);
    formData.append("Ubicacion", ubicacion);
    formData.append("NumeroHectareas", numHectareas);
    formData.append("PartidaRegistral", partidaRegistral);

    formData.append("Estado", "A");
    formData.append("ImagenUrl", "Pendiente");

    // Agregamos el archivo
    formData.append("ArchivoPlano", {
      uri: archivoCSV.uri,
      name: archivoCSV.name,
      type: "text/csv", // O 'application/octet-stream'
    });

    try {
      const response = await fetch(`${API_URL}/Proyecto/proyecto_Registrar`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const result = await response.text();
      if (response.ok) {
        Alert.alert("Éxito", "Proyecto y Plano registrados correctamente", [
          {
            text: "OK",
            onPress: () => {
              route.params?.onRefresh?.();
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert("Error", "No se pudo registrar el proyecto " + result);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error de red", "Verifica que tu API esté encendida");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro de Proyectos:</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Código de Proyecto"
          value={codProyecto}
          onChangeText={setcodProyecto}
        />
        <TextInput
          style={styles.input}
          placeholder="Nombre del Proyecto"
          value={Nombre}
          onChangeText={setnombre}
        />
        <TextInput
          style={styles.input}
          placeholder="Ubicación"
          value={ubicacion}
          onChangeText={setubicacion}
        />
        <TextInput
          style={styles.input}
          placeholder="Número de Hectáreas"
          keyboardType="numeric"
          value={numHectareas}
          onChangeText={setnumHecatreas}
        />
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

        <TouchableOpacity style={styles.btnGuardar} onPress={registrarProyecto}>
          <Text style={styles.btnTextGuardar}>GUARDAR PROYECTO</Text>
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
    paddingTop: 40,
    paddingBottom: 40,
    padding: 10,
  },
  title: {
    color: "#069488",
    fontSize: 20,
    fontWeight: "bold",
  },
  form: {
    marginTop: 10,
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ced4da",
  },
  btnArchivo: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#069488",
    borderStyle: "dashed",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  btnTextArchivo: {
    color: "#069488",
    fontWeight: "bold",
  },
  btnGuardar: {
    backgroundColor: "#069488",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  btnTextGuardar: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  btnregresar: {
    backgroundColor: "#09caba",
    width: 80,
    height: 40,
    marginTop: "auto",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
export default Rproyecto;
