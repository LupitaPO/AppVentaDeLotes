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

const API_URL = "http://www.tulote.somee.com";

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
 // Fondo principal de la pantalla suave y consistente
  container: {
    flex: 1,
    backgroundColor: "#f4fcfb", // Fondo premium unificado sutil
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  
  // Título principal del formulario en tipografía robusta
  title: {
    fontSize: 24,
    fontWeight: "900", // Peso visual fuerte idéntico al resto de tu app
    color: "#111827",  // Tono oscuro principal para alta legibilidad
    textAlign: "center",
    marginBottom: 24,
  },
  
  form: {
    flex: 1,
    justifyContent: "center",
  },
  
  // Etiquetas de los campos adaptadas al diseño móvil unificado
  label: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  
  // Campos de texto estilizados exactamente como el login nativo
  input: {
    height: 48,
    backgroundColor: "#fbfffe", // Blanco menta muy limpio
    borderWidth: 1,
    borderColor: "#d5e7e3",    // Contorno esmeralda suave
    borderRadius: 15,          // Curvatura idéntica a tus otras pantallas
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
    shadowColor: "#0f766e",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
    marginBottom: 15,
  },
  
  // Botón para adjuntar archivo/comprobante refinado (Look premium de carga)
  btnArchivo: {
    backgroundColor: "#ffffff",      // Fondo blanco limpio
    borderWidth: 1.5,
    borderColor: "#f97316",         // Borde naranja premium controlado
    borderStyle: "dashed",          // Efecto punteado moderno para indicar carga de archivos
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  
  // Texto del botón de archivo haciendo juego con el contorno
  btnTextArchivo: {
    color: "#f97316",
    fontSize: 14,
    fontWeight: "800",
  },
  
  // Botón Guardar / Confirmar (Diseño responsivo premium insignia)
  btnGuardar: {
    backgroundColor: "#069488", // Verde principal premium
    width: "100%",
    maxWidth: 420,
    height: 52,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    shadowColor: "#069488",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
    marginTop: 20,
  },
  
  btnTextGuardar: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  
  btnregresar: {
    alignItems: "center",
    paddingVertical: 16,
  },
});

export default ModificarProyecto;