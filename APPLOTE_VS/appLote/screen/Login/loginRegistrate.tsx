import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Platform,
  Alert
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";

// imports para idiomas 
import AntDesign from "@expo/vector-icons/AntDesign";
import Fontisto from "@expo/vector-icons/Fontisto";
import i18n, { changeLanguage } from "../../i18n";
import { Languages } from "../../localizacion";
import { API_URL } from "../../config/apiUrl";


const LoginRegistrate = ({ navigation }) => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [celular, setCelular] = useState("");
  const [loading, setCargando] = useState(false);
  const [icon, seticon] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 900;


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


        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={Registro}
          activeOpacity={0.9}
          disabled={loading}
        >
          <LinearGradient
            colors={["#14b8a6", "#0f8f83", "#086b63"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.btnGradient, !isDesktop && styles.btnGradientMobile]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={[styles.btnLabel, !isDesktop && styles.btnLabelMobile]}>
                {i18n.t("btnRegister")}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.regresar}
          onPress={() => navigation.replace("Login")}
        >
          <Text style={{ color: "#000000", fontWeight: "bold" }}>{i18n.t("Comeback")}</Text>
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
    backgroundColor: "#f8fafc", // Fondo gris claro muy sutil como el anterior
  },
  idioma: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#ffffff', // Fondo blanco para que combine limpio
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb', // Borde sutil del primer diseño
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
    maxWidth: 520, // Evita que se deforme en pantallas grandes
    minHeight: "75%",
    borderRadius: 26, // Bordes redondeados modernos (loginPanelMobile)
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.96)", // Blanco limpio
    borderWidth: 1,
    borderColor: "rgba(6, 148, 136, 0.12)",
    // Sombras nativas idénticas al anterior
    shadowColor: "#087c72",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  title: {
    color: "#111827",
    fontSize: 30,
    lineHeight: 35,
    fontWeight: "900", // Tipografía robusta del primer diseño
    marginBottom: 16,
    textAlign: "center",
  },
  label: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    paddingTop: 12,
    paddingBottom: 6,
  },
  input: {
    minHeight: 48,
    flexDirection: "row",
    backgroundColor: "#fbfffe", // Consistencia textInputMobile
    paddingHorizontal: 12,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#d5e7e3",
    shadowColor: "#0f766e",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  inputcontrol: {
    flex: 1,
    height: 44,
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  imgkey: {
    marginRight: 12,
    fontSize: 20,
    alignSelf: "center",
  },
  btn: {
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#069488",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 5,
  },
  btnDisabled: {
    opacity: 0.68,
  },
   btnGradient: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGradientMobile: {
    height: 50,
    borderLeftWidth: 6,
    borderLeftColor: "rgba(255,255,255,0.32)",
  },
  btnLabel: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 17,
  },
  btnLabelMobile: {
    fontSize: 16,
  },

  regresar: {
    backgroundColor: "transparent", // Sin fondo para que no compita con el botón principal
    borderWidth: 1.5,
    borderColor: "#079487", // Borde estilizado
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    height: 44,
    width: 110,
    borderRadius: 12,
    marginTop: "auto",
    alignSelf: "center",
  },
});


export default LoginRegistrate;
