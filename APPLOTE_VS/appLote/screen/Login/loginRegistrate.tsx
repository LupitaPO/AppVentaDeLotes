import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";

// imports para idiomas 
import Fontisto from "@expo/vector-icons/Fontisto";
import i18n, {changeLanguage}  from "../../i18n";
import { Languages } from "../../localizacion";


const API_URL = "http://10.28.32.207:90";

const loginRegistrate = ({ navigation }) => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [celular, setCelular] = useState("");

  const Registro = async () => {
    if (
      !nombre.trim() ||
      !correo.trim() ||
      !contraseña.trim() ||
      !celular.trim()
    ) {
      alert("Por favor, complete todos los campos");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/Usuario/usuario_Registrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Nombre: nombre,
          Correo: correo,
          Contraseña: contraseña,
          Celular: celular,
          TipoUsuario: "",
          Estado: "",
        }),
      });
      const data = await response.text();
      if (response.ok) {
        alert("Usuario registrado exitosamente");
        navigation.replace("Login");
      } else {
        alert("Error al registrar usuario" + data);
      }
    } catch (error) {
      console.error(error);
      alert("No se pudo conectar con el servidor. Revisa tu conexión.");
    }
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
        

        <Text style={styles.title}>{i18n.t("Register")}</Text>
        <TextInput
          placeholder={i18n.t("iptNom")}
          value={nombre}
          onChangeText={setNombre}
          style={styles.input}
        />
        <TextInput
          placeholder={i18n.t("iptCor")}
          value={correo}
          onChangeText={setCorreo}
          style={styles.input}
        />
        <TextInput
          placeholder={i18n.t("iptCon")}
          value={contraseña}
          onChangeText={setContraseña}
          secureTextEntry
          style={styles.input}
        />
        <TextInput
          placeholder={i18n.t("iptCel")}
          value={celular}
          onChangeText={setCelular}
          style={styles.input}
        />
        <TouchableOpacity onPress={Registro} style={styles.btregistro}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
            {i18n.t("btnRegister")}
          </Text>
        </TouchableOpacity>

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
    right: 20,   
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
    paddingTop:32,
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
    marginBottom: 8,
  },
  input: {
    // borderWidth:1.5,

    height: 50,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
  },
  btregistro: {
    marginTop: 10,
    justifyContent: "center",
    borderRadius: 10,
    height: 40,
    alignItems: "center",
    backgroundColor: "#09caba",
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

export default loginRegistrate;