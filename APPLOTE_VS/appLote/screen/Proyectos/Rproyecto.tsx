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

// Ícono usado para el botón flotante de cambio de idioma.
import Fontisto from "@expo/vector-icons/Fontisto";

// Íconos usados para el menú flotante y el botón de cerrar sesión.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// Instancia de traducción y función auxiliar para cambiar idioma dinámicamente.
import i18n, { changeLanguage } from "../../i18n";

// Tipo que restringe los idiomas válidos manejados por la aplicación.
import { Languages } from "../../localizacion";



const API_URL = process.env.EXPO_PUBLIC_API_URL;

const Rproyecto = ({ navigation, route }) => {
  const { nombre, rol } = route.params;

  // funcion de idiomas 
  // Estado que controla si el menú flotante está abierto o cerrado.
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Idioma actualmente seleccionado en la interfaz.
  const [language, setlanguage] = useState<Languages>("es");

  // Alterna entre español e inglés y actualiza el motor de traducciones.
  const handlechangeLanguage = () => {
    const lang: Languages = language === "en" ? "es" : "en";
    changeLanguage(lang);
    setlanguage(lang);
  }



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

  // Reinicia la navegación y devuelve al usuario a la pantalla de login.
  const cerrarSesion = () => {
    // Simplemente redirigimos y reseteamos el historial
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }], // Cambia 'Login' por el nombre exacto de tu pantalla inicial
    });
  };



  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("PrjRegis")}:</Text>


      {/* Menú flotante para cambiar idioma y cerrar sesión. */}
      <View style={styles.containerFlotante}>
        <TouchableOpacity
          style={styles.btnPrincipal}
          onPress={() => setIsMenuOpen(!isMenuOpen)}
        >
          <MaterialIcons
            name={isMenuOpen ? "close" : "menu"} // Puedes usar menu/close o flechas
            size={28}
            color="white"
          />
        </TouchableOpacity>
        {isMenuOpen && (
          <View style={styles.menuDesplegado}>

            <View>
              <TouchableOpacity style={styles.idioma} onPress={handlechangeLanguage}>
                <Fontisto name="world-o" size={25} />
              </TouchableOpacity>
            </View>
            <View>
              <TouchableOpacity style={styles.btnsalir} onPress={cerrarSesion}>
                <MaterialIcons
                  name="exit-to-app"
                  size={28}
                  color="white"
                />
              </TouchableOpacity>
            </View>

          </View>
        )}

      </View>
      {/* ///////////////////////////////////////////////////////////////////////////////////////// */}


      <View style={styles.form}>

        <Text style={styles.label}>{i18n.t("CodProyt")}:</Text>
        <TextInput
          style={styles.input}
          placeholder={i18n.t("CodProyt")}
          value={codProyecto}
          onChangeText={setcodProyecto}
        />

        <Text style={styles.label}>{i18n.t("NameProyt")}:</Text>
        <TextInput
          style={styles.input}
          placeholder={i18n.t("NameProyt")}
          value={Nombre}
          onChangeText={setnombre}
        />

        <Text style={styles.label}>{i18n.t("location")}:</Text>
        <TextInput
          style={styles.input}
          placeholder={i18n.t("location")}
          value={ubicacion}
          onChangeText={setubicacion}
        />

        <Text style={styles.label}>{i18n.t("NumHect")}:</Text>
        <TextInput
          style={styles.input}
          placeholder={i18n.t("NumHect")}
          keyboardType="numeric"
          value={numHectareas}
          onChangeText={setnumHecatreas}
        />

        <Text style={styles.label}>{i18n.t("PartRegis")}:</Text>
        <TextInput
          style={styles.input}
          placeholder={i18n.t("PartRegis")}
          value={partidaRegistral}
          onChangeText={setPartidaRegistral}
        />

        <Text style={styles.label}>{i18n.t("selecplane")}:</Text>
        <TouchableOpacity
          style={styles.btnArchivo}
          onPress={seleccionarArchivo}
        >
          <Text style={styles.btnTextArchivo}>
            {archivoCSV
              ? `Seleccionado: ${archivoCSV.name}`
              : `📁 ${i18n.t("selecplane")} (.csv)`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGuardar} onPress={registrarProyecto}>
          <Text style={styles.btnTextGuardar}>{i18n.t("saveProyt")}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.btnregresar}
        onPress={() => navigation.goBack()}
      >
        <Text>{i18n.t("Comeback")}</Text>
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  // Estilos del menú flotante superior derecho.
  containerFlotante: {
    position: 'absolute',
    top: 40,           // Ajusta según la pantalla
    right: 20,
    zIndex: 999,       // Siempre al frente
    alignItems: 'center',


  },
  menuDesplegado: {
    // Los botones aparecen antes (arriba) del principal, 
    // o puedes ponerlos después para que bajen.
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  btnPrincipal: {
    backgroundColor: '#333', // Un color neutro o el de tu app
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  // estilos de exit y idioma :
  idioma: {
    top: 5,   // Separación del borde inferior

    marginTop: 5,
    backgroundColor: '#22c5aa', // Color de fondo del botón
    width: 45,
    height: 45,
    borderRadius: 28,     // Hace que sea circular
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,         // Sombra en Android
    shadowColor: '#000',  // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
  },
  btnsalir: {
    backgroundColor: "#f30a0a9c",
    marginTop: 5,
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  // ///////////////////////////////////
  container: {
    flex: 1,
    backgroundColor: "#e4f5f3",
    paddingTop: 40,
    paddingBottom: 40,
    padding: 10,
  },
  title: {
    color: "#069488",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom:10
  },
  label:{
    fontWeight:"bold",
    marginBottom:5,
    
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
