import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import React, { useState } from "react";
import { Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import AntDesign from "@expo/vector-icons/AntDesign";
import Feather from "@expo/vector-icons/Feather";

// imports para idiomas 
import Fontisto from "@expo/vector-icons/Fontisto";
import i18n, {changeLanguage} from "../i18n";
import { Languages } from "../localizacion";


// URL base del backend usada para autenticación y actualizaciones iniciales.
const API_URL = "http://www.tulote.somee.com";

const login = ({ navigation }) => {
  // Estado del correo ingresado por el usuario.
  const [Correo, setEmail] = useState("");

  // Estado de la contraseña ingresada por el usuario.
  const [Contraseña, setPassword] = useState("");

  // Controla si el proceso de inicio de sesión está en ejecución.
  const [loading, setloading] = useState(false);

  // Controla si la contraseña se muestra visible o enmascarada.
  const [icon, seticon] = useState(false);

  // Valida campos, consulta el login en la API y navega a la pantalla principal si las credenciales son correctas.
  const handleLogin = async () => {
    if (!Correo.trim() || !Contraseña.trim()) {
      alert("Por favor, complete todos los campos");
      return;
    }

    setloading(true);
    console.log(API_URL)
    try {
      // Ejecuta en paralelo el login y una actualización masiva del estado de lotes.
      const [reslogin, resactualizacion] = await Promise.all([
        fetch(`${API_URL}/Usuario/usuario_Login/${Correo}/${Contraseña}`),
        fetch(`${API_URL}/Lote/lote_ActualizarEstadoMasivo`),

      ]);
      console.log(reslogin)
       console.log(Contraseña)
      
      const data = await reslogin.json();
      console.log(data)
      if (data && data.length > 0) {
        // Toma el primer usuario devuelto por la API y normaliza su identificador.
        const usuario = data[0];
        const idUsuario = usuario.IdUsuario || usuario.idUsuario || usuario.Id || usuario.id;

        // Reemplaza la pantalla actual por la navegación principal y envía datos del usuario autenticado.
        navigation.replace("MainTabs", {
          rol: usuario.TipoUsuario,
          nombre: usuario.Nombre,
          idUsuario,
        });
      } else {
        alert("Usuario o contraseña incorrectos");
      }
    } catch (error) {
      alert("Error al iniciar sesión");
      
    } finally {
      setloading(false);
    }
  };


  // funcion de idiomas 
  // Idioma actual seleccionado en la pantalla de login.
  const [language,setlanguage] = useState<Languages>("es");

  // Alterna el idioma entre español e inglés y actualiza i18n.
  const handlechangeLanguage = ()=> {
    const lang: Languages = language === "en" ? "es" :"en";
    changeLanguage(lang);
    setlanguage(lang);
  }


  return (
    /* Fondo principal con degradado para la pantalla de acceso. */
    <LinearGradient
      colors={["#069488", "#a1f3ec", "#069488"]}
      style={styles.contenedor}
    >
      {/* Tarjeta central donde vive todo el formulario de acceso. */}
      <View style={styles.card}>

        {/* Botón flotante para cambiar el idioma de la interfaz. */}
        <View style={styles.idioma}>
          <TouchableOpacity onPress={handlechangeLanguage}>
            <Fontisto name="world-o" size={25}/>
          </TouchableOpacity>
        </View>

        {/* Logo principal de la aplicación. */}
        <Image source={require("../img/logoLote.webp")} style={styles.logo} />

        {/* Encabezado textual con título y subtítulo traducibles. */}
        <View style={{alignItems:'center',marginBottom:20}}>

          <Text style={styles.title}>{i18n.t("title")}</Text>

          <Text style={styles.subtitle}>{i18n.t("subtitle")}</Text>
        
        </View>
        

        {/* Campo de entrada para el correo del usuario. */}
        <View style={styles.textInput}>
          <AntDesign name="user" size={24} color="#09caba" />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-addres"
            autoCorrect={false}
            style={styles.inputcontrol}
            placeholder={i18n.t("Email")}
            value={Correo}
            onChangeText={(text) => setEmail(text)}
          />
        </View>

        {/* Campo de contraseña con opción para mostrar u ocultar el contenido. */}
        <View style={styles.textInput}>
          <Feather name="lock" size={24} color="#09caba" />
          <TextInput
            secureTextEntry={!icon}
            style={styles.inputcontrol}
            placeholder={i18n.t("pswd")}
            value={Contraseña}
            onChangeText={(text) => setPassword(text)}
            placeholderTextColor={"gray"}
          />
          <AntDesign
            name={icon ? "eye" : "eye-invisible"}
            size={24}
            color={icon ? "black" : "gray"}
            onPress={() => seticon(!icon)}
            style={styles.imgkey}
          />
        </View>

        {/* Botón principal que ejecuta el proceso de login. */}
        <TouchableOpacity style={styles.btn} onPress={handleLogin}>
          <Text style={{color:"#fff", fontWeight:'bold', fontSize:16}}>{i18n.t("btnLogin")}</Text>
        </TouchableOpacity>

        {/* Navega a la pantalla de registro para usuarios nuevos. */}
        <TouchableOpacity
          style={styles.btnR}
          onPress={() => navigation.replace("loginRegistrate")}
        >
          <Text style={styles.btnText}>
            {i18n.t("register")}
          </Text>
        </TouchableOpacity>

        {/* Navega a la pantalla de soporte o cambio de contraseña. */}
        <TouchableOpacity
          style={styles.btnCambiar}
          activeOpacity={0.7}
          onPress={() => navigation.replace("loginCambiarContraseña")}
        >
          <Text style={styles.btnText}>
            {i18n.t("suport")}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};
const styles = StyleSheet.create({
  // Estilos del contenedor principal con centrado de la tarjeta.
  contenedor: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Estilo del botón flotante para cambio de idioma.
  idioma:{
    position: 'absolute',

    top: 20,           // Separación del borde inferior
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

  // Tarjeta principal que contiene el formulario de login.
  card: {
    position: "absolute",
    bottom: 40,
    left: 20,
    width: "90%",
    height: "85%",
    backgroundColor: "#a1f3ec",
    borderRadius: 10,
    padding: 20,
    boxShadow:
      "-4px 4px 4px -4px rgba(0, 0, 0, 0.1), -4px 4px 4px 4px rgba(0, 0, 0, 0.06)",
  },

  // Estilos del título principal.
  title:{
    color:'#000000',
    fontSize:35,
    fontWeight:'bold'
    
  },

  // Estilos del subtítulo descriptivo.
  subtitle:{
    color:'#000000',
    fontSize:15
    
  },

  // Estilos de la imagen/logo central.
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    borderRadius: 40,
    borderWidth: 4,
    borderColor:"#09caba" ,
    padding: 80,
    margin: 30,
    marginBottom: 15,
  },

  // Contenedor visual de cada campo de entrada con su ícono.
  textInput: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingLeft: 10,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
  },

  // Estilos internos del TextInput.
  inputcontrol: {
    flex: 1,
    height: 44,

    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 15,
    fontWeight: "500",
    color: "#222",
  },

  // Estilo del ícono para mostrar u ocultar la contraseña.
  imgkey: {
    marginRight: 12,
    fontSize: 25,
    alignSelf: "center",
  },

  // Botón principal de inicio de sesión.
  btn: {
    height: 44,
    backgroundColor: "#09caba",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },

  // Botón/enlace para soporte o cambio de contraseña.
  btnCambiar: {
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    marginTop: "auto",
    alignContent: "flex-end",
  },

  // Texto reutilizado por botones secundarios.
  btnText: {
    fontWeight: "bold",
    color: "#069488",
  },

  // Botón/enlace para navegación hacia registro.
  btnR: {
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    marginTop: 15,
  },
});

export default login;
