import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useRoute } from "@react-navigation/native";

// imports para idiomas 
import Fontisto from "@expo/vector-icons/Fontisto";
import { Languages } from "../../localizacion";
import i18n, {changeLanguage} from "../../i18n";

const loginCambiarContraseña = ({ navigation }) => {
  const route = useRoute();

  const formatearNumero = (num) => {
    return `+${num.slice(0, 2)} ${num.slice(2, 5)} ${num.slice(5, 8)} ${num.slice(8)}`;
  };

  const ASESORES = [
    { id: 1, nombre: "Encargado 1:", numero: "51920538362" },
    { id: 2, nombre: "Encargado 2:", numero: "51941534283" },
    // { id: 3, nombre: 'Soporte Técnico:', numero: '51000000000' },
    // { id: 4, nombre: 'Administración:', numero: '51000000000' },
    // { id: 5, nombre: 'Atención al Cliente:', numero: '51000000000' },
  ];

  const WhatsappEnviar = (numeroSeleccionado) => {
    // Reemplaza con el número de teléfono al que deseas enviar el mensaje
    const mensaje =
      "Hola, Necesito ayuda para recuperar mi contraseña, Mi nombre es:"; // El mensaje que deseas enviar

    const url = `whatsapp://send?phone=${numeroSeleccionado}&text=${encodeURIComponent(mensaje)}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
      }
      Linking.openURL(
        `https://wa.me/${numeroSeleccionado}?text=${encodeURIComponent(mensaje)}`,
      );
    });
  };

  // funcion de idiomas 
    const [language,setlanguage] = useState<Languages>("es");
    const handlechangeLanguage = ()=> {
      const lang: Languages = language === "en" ? "es" :"en";
      changeLanguage(lang);
      setlanguage(lang);
    }
  

  return (
    <LinearGradient
      colors={["#069488", "#a1f3ec", "#069488"]}
      style={styles.container}
    >
      <View style={styles.card}>

        <View style={styles.idioma}>
          <TouchableOpacity onPress={handlechangeLanguage}>
            <Fontisto name="world-o" size={25}/>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>
          {i18n.t("titleSuport")}
        </Text>
        <Text
          style={{ marginBottom: 10, fontWeight: "bold", fontSize:15, color: "#069488" }}
        >
          {i18n.t("msjbss")}
        </Text>
        {ASESORES.map((asesor) => (
          <TouchableOpacity
            key={asesor.id}
            onPress={() => WhatsappEnviar(asesor.numero)}
            style={styles.btnAsesor}
          >
            <Text style={styles.txtAsesor}>{asesor.nombre}</Text>
            <Text style={styles.txtnum}>{formatearNumero(asesor.numero)}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.regresar}
          onPress={() => navigation.replace("Login")}
        >
          <Text style={{color:"#fff", fontWeight:"bold"}}>{i18n.t("Comeback")}</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  idioma:{
    position: 'absolute',

    top: 10,           // Separación del borde inferior
    right: 10,   
             // Separación del borde derecho
    backgroundColor: '#22c5aa', // Color de fondo del botón
    width: 56,
    height: 56,
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
  card: {
    paddingTop:35,
    elevation: 50,
    width: "90%",
    height: "85%",
    borderRadius: 10,
    padding: 20,
    boxShadow:
      "-4px 4px 4px -4px rgba(0, 0, 0, 0.1), -4px 4px 4px 4px rgba(0, 0, 0, 0.06)",
    backgroundColor: "#a1f3ec",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  btnAsesor: {
    backgroundColor: "#FFF",
    paddingLeft: 10,
    borderRadius: 10,
    marginBottom: 10,
    height: 60,
    width: "100%",
    justifyContent: "center",
  },
  txtAsesor: {
    paddingBottom: 5,
    color: "#069488",
    fontWeight: "600",
    fontSize: 18,
  },
  txtnum: {
    color: "#000",
    fontSize: 14,
    fontWeight: "bold",
  },
  regresar: {
    backgroundColor: "#09caba",
    padding: 10,
    justifyContent: "center",
    alignItems:"center",
    height: 40,
    width: 90,
    borderRadius: 10,
    marginTop: "auto",
  },
});

export default loginCambiarContraseña;