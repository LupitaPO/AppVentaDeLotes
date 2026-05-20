import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

// imports para idiomas 
import Fontisto from "@expo/vector-icons/Fontisto";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import i18n, {changeLanguage} from "../i18n";
import { Languages } from "../localizacion";

// URL base del backend para consultar el módulo de proyectos.
const API_URL = "http://www.tulote.somee.com";


const ListarProyectos = ({ navigation, route }) => {
// Estado que controla si el menú flotante está abierto o cerrado.
const [isMenuOpen, setIsMenuOpen] = useState(false);
 // funcion de idiomas 
  // Idioma actual usado por la pantalla para alternar entre español e inglés.
  const [language,setlanguage] = useState<Languages>("es");

  // Cambia el idioma actual y actualiza la configuración global de traducción.
  const handlechangeLanguage = ()=> {
    const lang: Languages = language === "en" ? "es" :"en";
    changeLanguage(lang);
    setlanguage(lang);
  }

  // Datos recibidos desde la navegación para personalizar la vista y las acciones disponibles.
  const { nombre, rol, idUsuario, onRefresh } = route.params || {};
  {
  }

  // Lista de proyectos cargados desde el servidor.
  const [proyectos, setProyectos] = useState([]);

  // Estado para mostrar indicador de carga mientras se consulta la API.
  const [cargando, setCargando] = useState(true);

  // Obtiene todos los proyectos registrados y los guarda en el estado local.
  const obtenerProyectos = async () => {
    try {
      const response = await fetch(`${API_URL}/Proyecto/proyecto_Listar`);
      const data = await response.json();
      setProyectos(data);
    } catch (error) {
      console.error("Error al listar proyectos:", error);
    } finally {
      setCargando(false);
    }
  };

  // Envía la solicitud para anular un proyecto y luego refresca la lista si la operación fue exitosa.
  const anularProyecto = async (idProyecto) => {
    try {
      const response = await fetch(
        `${API_URL}/Proyecto/proyecto_Anular/${idProyecto}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        Alert.alert("Éxito", "Proyecto anulado correctamente");
        obtenerProyectos();
      } else {
        const errorMsg = await response.text();
        console.log("Error del server:", errorMsg);
        Alert.alert("Error", "No se pudo anular el proyecto");
      }
    } catch (error) {
      console.error("Error al anular proyecto:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    }
  };

  // Carga la lista de proyectos una vez al montar la pantalla.
  useEffect(() => {
    obtenerProyectos();
  }, []);

  // Vuelve a cargar los proyectos cada vez que la pantalla recupera el foco.
  useFocusEffect(
    useCallback(() => {
      obtenerProyectos();
    }, []),
  );

  // Mientras los datos llegan, muestra un indicador de carga a pantalla completa.
  if (cargando)
    return (
      <ActivityIndicator size="large" color="#069488" style={{ flex: 1 }} />
    );

  // Reinicia la navegación para cerrar sesión y volver a la pantalla de login.
  const cerrarSesion = () => {
    // Simplemente redirigimos y reseteamos el historial
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }], // Cambia 'Login' por el nombre exacto de tu pantalla inicial
    });
  };


 


  return (
    <View style={styles.container}>
      {/* Encabezado con el nombre del usuario autenticado.
      <View style={{ flexDirection: "row", justifyContent: "space-between"}}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={styles.textheader}>Bienvenido:</Text>
          <Text style={styles.textheader2}>{nombre || "Usuario"}</Text>
        </View>

        
      </View> */}
  {/* ///////////////////////////////////////////////////////////////////////////////////////// */}
  {/* funcion de boton desplegable patra idioma y exit */}

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


      <View></View>
      <Text style={styles.title}>Gestion de Proyectos:</Text>
      <Text style={styles.subtitle}>Selecciona un Proyecto:</Text>

      {/* Área principal con la lista desplazable de proyectos. */}
      <View style={styles.form}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={true}
        >
          {proyectos.map((proyecto, index) => (
            /* Cada tarjeta representa un proyecto y permite abrir su detalle. */
            <TouchableOpacity
              key={
                proyecto.IdProyecto
                  ? proyecto.IdProyecto.toString()
                  : index.toString()
              }
              style={styles.card}
              onPress={() =>
                navigation.navigate("DetalleProyecto", {
                  idProyecto: proyecto.IdProyecto,
                  urlCSV: proyecto.ImagenUrl,
                  info: proyecto,
                  idUsuario,
                })
              }
            >
              <View style={styles.grid}>
                <Text style={styles.cardTitle}>
                  {proyecto.Nombre || "Proyecto sin nombre"}
                </Text>

                {/* Acciones de administración visibles solo para roles distintos de Cliente. */}
                {rol !== "Cliente" && (
                  <TouchableOpacity
                    style={styles.opciones}
                    onPress={() =>
                      Alert.alert(
                        "Opciones para Proyecto",
                        `¿Qué deseas hacer con ${proyecto.Nombre}?`,
                        [
                          {
                            text: "Anular",
                            onPress: () => anularProyecto(proyecto.IdProyecto),
                          },
                          {
                            text: "Modificar",
                            onPress: () =>
                              navigation.navigate("ModificarProyecto", {
                                proyecto,
                                onRefresh: obtenerProyectos,
                              }),
                          },
                          {
                            text: "Cancelar",
                            style: "cancel",
                          },
                        ],
                      )
                    }
                  >
                    <Text style={styles.textOpciones}>⋮</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.cardText}>
                Ubicación: {proyecto.Ubicacion || "N/A"}
              </Text>
              <Text style={styles.cardText}>
                Ubicación: {proyecto.NumeroHectareas || "N/A"}
              </Text>
              <Text style={styles.cardText}>
                Estado: {proyecto.Estado || "N/A"}
              </Text>
              <Text style={styles.cardText}>
                Fecha Registro: {proyecto.FechaRegistro || "N/A"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Botón para registrar un nuevo proyecto, disponible solo para usuarios con permisos. */}
      <View>
        {rol !== "Cliente" && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Rproyecto", { onRefresh: obtenerProyectos })
            }
            style={styles.btnRegistrar}
          >
            <Text style={styles.btnRegisText}>Nuevo Proyecto</Text>
          </TouchableOpacity>
        )}
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
// Estilos generales de la pantalla y del listado de proyectos.
  container: {
    flex: 1,
    backgroundColor: "#e4f5f3",
    padding: 20,
    paddingTop: 50,
  },
  textheader: {
    fontWeight: "500",
    padding: 10,
    color: "#069488",
    fontSize: 17,
  },
  textheader2: {
    fontWeight: "bold",
    fontSize: 22,
    color: "#069488",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#069488",
    marginBottom: 15,
  },
  form: {
    flex: 1,
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 15,
    color: "#069488",
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
    justifyContent: "space-between",
  },
  opciones: {
    width: 20,
    paddingLeft: 15,
  },

  // Estilo del ícono textual que abre el menú de opciones por proyecto.
  textOpciones: {
    color: "#069488",
    fontSize: 20,
    fontWeight: "bold",
  },

  // Estilos del botón para registrar nuevos proyectos.
  btnRegistrar: {
    backgroundColor: "#069488",
    width: 378,
    height: 50,
    marginBottom: 5,
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  btnRegisText: {
    color: "#fff",
    fontWeight: "bold",
  },
  btnregresar: {
    alignItems: "center",
    paddingBottom: 20,
  },
});

export default ListarProyectos;
