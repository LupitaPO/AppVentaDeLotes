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
          <Text style={{color:"#000000", fontWeight:"bold"}}>{i18n.t("Comeback")}</Text>
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
    backgroundColor: "#f8fafc", // Fondo gris claro muy sutil idéntico a los anteriores
  },
  idioma: {
    position: 'absolute',
    top: 20,           
    right: 20,   
    backgroundColor: '#ffffff', // Fondo blanco limpio
    width: 48,
    height: 48,
    borderRadius: 24,     
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb', // Borde gris claro premium
    elevation: 4,         
    shadowColor: '#0f172a',  
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    zIndex: 999,  
  },
  card: {
    paddingTop: 36,
    width: "90%",
    maxWidth: 520, // Previene deformaciones en pantallas grandes
    height: "85%",
    borderRadius: 26, // Bordes redondeados modernos consistentes
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.96)", // Blanco limpio en vez del turquesa
    borderWidth: 1,
    borderColor: "rgba(6, 148, 136, 0.12)",
    // Sombras nativas idénticas a tus pantallas previas
    shadowColor: "#087c72",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  title: {
    color: "#111827",
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "900", // Tipografía fuerte y moderna
    marginBottom: 20,
    textAlign: "left"

  },
  btnAsesor: {
    backgroundColor: "#fbfffe", // Consistencia con las cajas de texto anteriores
    paddingHorizontal: 16,
    borderRadius: 15,
    marginBottom: 14,
    height: 64,
    width: "100%",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d5e7e3",
    shadowColor: "#0f766e",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  txtAsesor: {
    paddingBottom: 3,
    color: "#069488", // Verde esmeralda de tu marca
    fontWeight: "700",
    fontSize: 16,
  },
  txtnum: {
    color: "#475569", // Gris oscuro legible para subtextos
    fontSize: 13.5,
    fontWeight: "600",
  },
  regresar: {
    backgroundColor: "transparent", // Botón tipo contorno (Outline) para balancear la UI
    borderWidth: 1.5,
    borderColor: "#079487",
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    height: 44,
    width: 110,
    borderRadius: 12,
    marginTop: "auto",
    alignSelf: "center", // Centrado en la base de la tarjeta
  },
});

export default loginCambiarContraseña;