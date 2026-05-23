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
import RegistrarAsesor from "./Asesor/RegistrarAsesor";
import RegistrarUsuario from "./Usuarios/RegistrarUsuario";

// URL base del backend para consultar y administrar usuarios.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const usuario = ({navigation, route}) => {
  // Datos recibidos desde navegación para personalizar la pantalla según el contexto del usuario.
  const { nombre, rol } = route.params || {};

  // Altura de la barra inferior para dejar espacio visual al final del listado.
  const tabBarHeight = useBottomTabBarHeight();

  // Lista de usuarios recuperada desde la API.
  const [usuarios, setUsuarios] = useState([]);

  // Estado que controla el indicador de carga mientras llegan los datos.
  const [cargando, setCargando] = useState(true);

// funcion de idiomas //////////////////////////////////////////////

    // Estado que abre o cierra el menú flotante de acciones rápidas.
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Idioma actual seleccionado en la pantalla.
    const [language,setlanguage] = useState<Languages>("es");

    // Alterna entre español e inglés y sincroniza el cambio con i18n.
    const handlechangeLanguage = ()=> {
      const lang: Languages = language === "en" ? "es" :"en";
      changeLanguage(lang);
      setlanguage(lang);
    }  

///////////////////////////////////////////////////////////////////

  // Consulta la lista de usuarios registrados y la guarda en el estado local.
  const obtenerUsuarios = async () => {
    try {
      const response = await fetch(`${API_URL}/Usuario/usuario_Listar`);
      const data = await response.json();
      setUsuarios(data);
    } catch (error) {
      console.error("Error al listar Usuario:", error);
    } finally {
      setCargando(false);
    }
  };

  // Envía la solicitud para anular un usuario según su identificador.
  const anularUsuario = async (IdUsuario) => {
    const esActivo = IdUsuario.Estado === "A";
    const accionTexto = esActivo ? "anular" : "restaurar";
    const exitoTexto = esActivo ? "anulado" : "restaurado";

    try {
      const response = await fetch(`${API_URL}/Usuario/usuario_Anular/${IdUsuario}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        Alert.alert("Éxito", `Usuario ${exitoTexto} correctamente`);
        obtenerUsuarios();
      } else {
        const errorMsg = await response.text();
        console.log("Error del server:", errorMsg);
        Alert.alert("Error", `No se pudo ${accionTexto} el Usuario`);
      }
    } catch (error) {
      console.error("Error al anular Usuario:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    }
  };

  // Recarga la lista cada vez que la pantalla vuelve a estar en foco.
  useFocusEffect(() => {
    obtenerUsuarios();
  });

  // Mientras se obtienen los usuarios, muestra un spinner de carga.
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
      {/* Título principal de la sección de gestión de usuarios. */}
      <Text style={styles.title}>Gestion de Usuarios:</Text>
        {/* ///////////////////////////////////////////////////////////////////////////////////////// */}
  {/* funcion de boton desplegable patra idioma y exit */}

      {/* Menú flotante para cambio de idioma y cierre de sesión. */}
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

      {/* Lista desplazable con todos los usuarios registrados. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.subtitle}>Selecciona un Usuario:</Text>

        {usuarios.map((usuario, index) => {
          // Construye el nombre mostrado usando los campos disponibles del usuario.
          const nombreCompleto = [
            usuario.Nombre
          ]
          
          const estaActivo = usuario.Estado === "A";
          const textoBotonestado = estaActivo ? "Anular" : "Restaurar";
          return (
            /* Cada tarjeta representa un usuario y abre acciones de administración. */
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
                      text: textoBotonestado,
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

      {/* Botón inferior para navegar al formulario de registro. */}
      <View style={styles.grid}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("RegistrarUsuario", { onRefresh: obtenerUsuarios })
          }
          style={styles.btnRegistrar}
        >
          <Text style={styles.btnRegisText}>Nuevo Usuario</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Estilos del menú flotante superior.
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
// Estilos generales de la pantalla y las tarjetas de usuarios.
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

  // Estilos del botón principal para registrar un nuevo usuario/asesor.
  btnRegistrar: {
    backgroundColor: "#069488",
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

  // Estilo del texto interno del botón de registro.
  btnRegisText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default usuario