import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert
} from "react-native";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";

// imports para idiomas 
import AntDesign from "@expo/vector-icons/AntDesign";
import Fontisto from "@expo/vector-icons/Fontisto";
import i18n, { changeLanguage } from "../../i18n";
import { Languages } from "../../localizacion";

// llamo de url de somee desde el archivo .env
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const loginRegistrate = ({ navigation }) => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [celular, setCelular] = useState("");
  const [loading, setCargando] = useState(false);
  const [icon, seticon] = useState(false);

  const esCorreoValido = (email) => {
    return email.toLowerCase().endsWith("@gmail.com");
  };

  const Registro = async () => {
    if (!nombre.trim() || !correo.trim() || !contraseña.trim() || !celular.trim()) {
      Alert.alert("Campos Incompletos", "Por favor, complete todos los campos");
      return;
    }

    if (!esCorreoValido(correo)) {
      Alert.alert("Error de Formato", "El correo debe terminar en @gmail.com");
      return;
    }
    // NUEVA VALIDACIÓN: Verifica que tenga exactamente 9 caracteres
    if (celular.trim().length !== 9) {
      Alert.alert("Número Inválido", "El número de celular debe tener exactamente 9 dígitos.");
      return; // Detiene el registro
    }


    setCargando(true);
    try {
      // Paso 1: Registrar el usuario en la BD de Somee
      const response = await fetch(`${API_URL}/Usuario/usuario_Registrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Nombre: nombre.trim(),
          Correo: correo.trim().toLowerCase(),
          Contraseña: contraseña.trim(),
          Celular: celular.trim(),
          TipoUsuario: "Cliente", // Rol automático
          Estado: "A",
        }),
      });

      if (response.ok) {
        // Paso 2: El registro fue exitoso. Ahora hacemos un login automático silencioso 
        // para obtener el IdUsuario real generado por la base de datos
        const resLogin = await fetch(`${API_URL}/Usuario/usuario_Login/${correo.trim().toLowerCase()}/${contraseña.trim()}`);
        const dataLogin = await resLogin.json();

        if (dataLogin && dataLogin.length > 0) {
          const usuarioAutenticado = dataLogin[0];
          const idUsuario = usuarioAutenticado.IdUsuario || usuarioAutenticado.idUsuario;

          Alert.alert("Éxito", "Usuario registrado e iniciado sesión correctamente", [
            {
              text: "Ingresar",
              onPress: () => {
                // Paso 3: Enviamos exactamente la misma estructura que tu Login original
                navigation.replace("MainTabs", {
                  rol: "Cliente", // Evaluará "Cliente"
                  nombre: usuarioAutenticado.Nombre,
                  idUsuario: idUsuario,
                });
              }
            }
          ]);
        } else {
          // Si el login falla por retraso del servidor, redirigimos al Login clásico
          navigation.replace("Login");
        }
      } else {
        const errorText = await response.text();
        Alert.alert("Error de registro", errorText);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };


  //funcion para validar el formato en el correo
  const validarformatoGmail = () => {
    if (correo.trim() === "") return;

    //validamos si el texto termina exactamente en @gamil.com
    if (!correo.toLowerCase().endsWith("@gmail.com")) {
      alert(

        "Por favor, ingrese una cuenta de correo valida de Gmail"
      );
    }
  }

  // funcion de idiomas 
  const [language, setlanguage] = useState<Languages>("es");
  const handlechangeLanguage = () => {
    const lang: Languages = language === "en" ? "es" : "en";
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
            <Fontisto name="world-o" size={25} />
          </TouchableOpacity>
        </View>


        <Text style={styles.title}>{i18n.t("Register")}</Text>

        <Text style={styles.label}>{i18n.t("iptNom")}:</Text>
        <TextInput
          placeholder={i18n.t("iptNom")}
          value={nombre}
          onChangeText={setNombre}
          style={styles.input}
        />

        <Text style={styles.label}>{i18n.t("iptCor")}:</Text>
        <TextInput
          placeholder={i18n.t("iptCor")}
          value={correo}
          onChangeText={setCorreo}

          style={styles.input}
          //ajustes para el correo:
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          onBlur={validarformatoGmail}
        />
{/* //////////////////OCULTAR CONTRASEÑA//////////////////////////////// */}
        <Text style={styles.label}>{i18n.t("iptCon")}:</Text>
        <View style={styles.input}>
          <TextInput
            secureTextEntry={!icon}
            placeholder={i18n.t("iptCon")}
            value={contraseña}
            onChangeText={setContraseña}
            autoCapitalize="none"
            style={styles.inputcontrol}
          />
          <AntDesign
            name={icon ? "eye" : "eye-invisible"}
            size={24}
            color={icon ? "black" : "gray"}
            onPress={() => seticon(!icon)}
            style={styles.imgkey}
          />
        </View>
{/* ////////////////////////////////////////////////////////////////////// */}

        <Text style={styles.label}>{i18n.t("iptCel")}:</Text>
        <TextInput
          placeholder={i18n.t("iptCel")}
          value={celular}
          onChangeText={setCelular}
          keyboardType="number-pad"
          maxLength={9}
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
          <Text style={{ color: "#fff", fontWeight: "bold" }}>{i18n.t("Comeback")}</Text>
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
  idioma: {
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
    paddingTop: 32,
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
  label: {
    fontWeight: "bold",
    paddingTop: 10,
    paddingBottom:8
  },
  input: {
    // borderWidth:1.5,
    height:50,
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingLeft:10,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
  
  },
  inputcontrol: {
    flex: 1,
    height: 44,

    backgroundColor: "#ffffff",
    
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
    alignItems: "center",
    height: 40,
    width: 90,
    borderRadius: 10,
    marginTop: "auto",
  },
});

export default loginRegistrate;