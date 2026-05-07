import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from '@react-navigation/native';

// imports para idiomas 
import Fontisto from "@expo/vector-icons/Fontisto";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import i18n, {changeLanguage} from "../i18n";
import { Languages } from "../localizacion";

const API_URL = "http://10.246.197.207:90";

const usuario = ({navigation, route}) => {
  const { nombre, rol } = route.params || {};
  const tabBarHeight = useBottomTabBarHeight();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);

// funcion de idiomas //////////////////////////////////////////////

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [language,setlanguage] = useState<Languages>("es");
    const handlechangeLanguage = ()=> {
      const lang: Languages = language === "en" ? "es" :"en";
      changeLanguage(lang);
      setlanguage(lang);
    }  

///////////////////////////////////////////////////////////////////

  const obtenerUsuarios = async () => {
    try {
      const response = await fetch(`${API_URL}/Usuario/usuario_Listar`);
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al listar asesores:", error);
    } finally {
      setCargando(false);
    }
  };

  const anularUsuario = async (IdUsuario) => {
    try {
      const response = await fetch(`${API_URL}/Usuario/usuario_Anular/${IdUsuario}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        Alert.alert("Éxito", "Usuario anulado correctamente");
        obtenerUsuarios();
      } else {
        const errorMsg = await response.text();
        console.log("Error del server:", errorMsg);
        Alert.alert("Error", "No se pudo anular el Usuario");
      }
    } catch (error) {
      console.error("Error al anular Usuario:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    }
  };

  useFocusEffect(() => {
    obtenerUsuarios();
  });

  if (cargando)
    return (
      <ActivityIndicator size="large" color="#069488" style={{ flex: 1 }} />
    );

////////////////////////////////////////////////////////////////////////////////////////////////////////

const cerrarSesion = () => {
    // Simplemente redirigimos y reseteamos el historial
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }], // Cambia 'Login' por el nombre exacto de tu pantalla inicial
    });
  };
/////////////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestion de Usuarios:</Text>
        {/* ///////////////////////////////////////////////////////////////////////////////////////// */}
  {/* funcion de boton desplegable patra idioma y exit */}

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
                <Fontisto name="world-o" size={25}/>
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.subtitle}>Selecciona un Usuario:</Text>

        {usuarios.map((usuario, index) => {
          const nombreCompleto = [
            usuario.Nombre
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <TouchableOpacity
              key={usuario.IdUsuario ? usuario.IdUsuario.toString() : index.toString()}
              style={styles.card}
              onPress={() =>
                Alert.alert(
                  "Opciones para Usuarios",
                  `¿Qué deseas hacer con ${nombreCompleto}?`,
                  [
                    {
                      text: "Anular",
                      onPress: () => anularUsuario(usuario.IdUsuario),
                    },
                    {
                      text: "Modificar",
                      onPress: () =>
                        navigation.navigate("ModificarUsuario", {
                          asesor: usuario,
                          onRefresh: obtenerUsuarios,
                        }),
                    },
                    {
                      text: "Cancelar",
                      style: "cancel",
                    },
                  ]
                )
              }
            >
              <Text style={styles.cardTitle}>{nombreCompleto || "Asesor sin nombre"}</Text>
              <Text style={styles.cardText}>Celular: {usuario.Celular || "N/A"}</Text>
              <Text style={styles.cardText}>Correo: {usuario.Correo || "N/A"}</Text>
              <Text style={styles.cardText}>Contraseña: {usuario.Contraseña || "N/A"}</Text>
              <Text style={styles.cardText}>TipoUsuario: {usuario.TipoUsuario || "N/A"}</Text>
              <Text style={styles.cardText}>Estado: {usuario.Estado || "N/A"}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.grid}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("RegistrarAsesor", { onRefresh: obtenerAsesores })
          }
          style={styles.btnRegistrar}
        >
          <Text style={styles.btnRegisText}>Nuevo Asesor</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // estilos para boton desplegable
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
    alignItems:"center",
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
  idioma:{
    top:5,   // Separación del borde inferior
    
    marginTop:5,
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
    marginTop:5,
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
// ///////////////////////////////////////////////
  container: {
    flex: 1,
    backgroundColor: "#e4f5f3",
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#069488",
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 15,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#069488",
  },
  cardText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 3,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },
  btnRegistrar: {
    backgroundColor: "#29c268",
    width: 378,
    height: 50,
    marginBottom: 5,
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  btnRegisText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default usuario