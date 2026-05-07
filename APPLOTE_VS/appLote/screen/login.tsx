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


const API_URL = "http://www.tuloteprueba.somee.com";

const login = ({ navigation }) => {
  const [Correo, setEmail] = useState("");
  const [Contraseña, setPassword] = useState("");

  const [loading, setloading] = useState(false);
  const [icon, seticon] = useState(false);

  const handleLogin = async () => {
    if (!Correo.trim() || !Contraseña.trim()) {
      alert("Por favor, complete todos los campos");
      return;
    }

    setloading(true);
    console.log(API_URL)
    try {
      const [reslogin, resactualizacion] = await Promise.all([
        fetch(`${API_URL}/Usuario/usuario_Login/${Correo}/${Contraseña}`),
        fetch(`${API_URL}/Lote/lote_ActualizarEstadoMasivo`),

      ]);
      console.log(reslogin)
       console.log(Contraseña)
      
      const data = await reslogin.json();
      console.log(data)
      if (data && data.length > 0) {
        const usuario = data[0];
        const idUsuario = usuario.IdUsuario || usuario.idUsuario || usuario.Id || usuario.id;
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
  const [language,setlanguage] = useState<Languages>("es");
  const handlechangeLanguage = ()=> {
    const lang: Languages = language === "en" ? "es" :"en";
    changeLanguage(lang);
    setlanguage(lang);
  }


  return (
    <LinearGradient
      colors={["#069488", "#a1f3ec", "#069488"]}
      style={styles.contenedor}
    >
      <View style={styles.card}>

        <View style={styles.idioma}>
          <TouchableOpacity onPress={handlechangeLanguage}>
            <Fontisto name="world-o" size={25}/>
          </TouchableOpacity>
        </View>

        <Image source={require("../img/logoLote.webp")} style={styles.logo} />

        <View style={{alignItems:'center',marginBottom:20}}>

          <Text style={styles.title}>{i18n.t("title")}</Text>

          <Text style={styles.subtitle}>{i18n.t("subtitle")}</Text>
        
        </View>
        

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
        <TouchableOpacity style={styles.btn} onPress={handleLogin}>
          <Text style={{color:"#fff", fontWeight:'bold', fontSize:16}}>{i18n.t("btnLogin")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnR}
          onPress={() => navigation.replace("loginRegistrate")}
        >
          <Text style={styles.btnText}>
            {i18n.t("register")}
          </Text>
        </TouchableOpacity>

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
  contenedor: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  title:{
    color:'#000000',
    fontSize:35,
    fontWeight:'bold'
    
  },
  subtitle:{
    color:'#000000',
    fontSize:15
    
  },
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
  textInput: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingLeft: 10,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
  },
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
  imgkey: {
    marginRight: 12,
    fontSize: 25,
    alignSelf: "center",
  },
  btn: {
    height: 44,
    backgroundColor: "#09caba",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  btnCambiar: {
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    marginTop: "auto",
    alignContent: "flex-end",
  },
  btnText: {
    fontWeight: "bold",
    color: "#069488",
  },
  btnR: {
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    marginTop: 15,
  },
});

export default login;
