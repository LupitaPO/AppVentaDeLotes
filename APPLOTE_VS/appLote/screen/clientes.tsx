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

// URL base del backend usada para consultar y actualizar datos de clientes.
const API_URL = process.env.EXPO_PUBLIC_API_URL;


const clientes = ({ navigation, route }) => {
  // Datos recibidos desde la navegación para personalizar la vista según el usuario.
  const { nombre, rol } = route.params || {};

  // Altura de la barra inferior para dejar espacio visual al final del ScrollView.
  const tabBarHeight = useBottomTabBarHeight();

  // Lista de clientes obtenida desde la API.
  const [clientes, setClientes] = useState([]);

  // Controla el indicador de carga mientras se consultan los datos.
  const [cargando, setCargando] = useState(true);

// funcion de idiomas //////////////////////////////////////////////

    // Estado que controla la apertura del menú flotante.
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Idioma activo de la pantalla.
    const [language,setlanguage] = useState<Languages>("es");

    // Alterna entre español e inglés y actualiza el sistema de traducción.
    const handlechangeLanguage = ()=> {
      const lang: Languages = language === "en" ? "es" :"en";
      changeLanguage(lang);
      setlanguage(lang);
    }  
    
///////////////////////////////////////////////////////////////////

  // Consulta todos los clientes registrados y los guarda en el estado local.
  const obtenerClientes = async () => {
    try {
      const response = await fetch(`${API_URL}/Cliente/cliente_Listar`);
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error("Error al listar clientes:", error);
    } finally {
      setCargando(false);
    }
  };
//Revisión
  // Envía la solicitud para anular un cliente usando su DNI como identificador.
  const anularCliente = async (dni) => {
    try {
      // 1. Cambiamos la URL para incluir el DNI al final
      // 2. Quitamos el body y el JSON.stringify
      const response = await fetch(`${API_URL}/Cliente/cliente_Anular/${dni}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert("Éxito", "Cliente anulado correctamente");
        obtenerClientes(); // Recargar la lista
      } else {
        // Si quieres ver por qué falla, puedes imprimir el error aquí:
        const errorMsg = await response.text();
        console.log("Error del server:", errorMsg);
        Alert.alert("Error", "No se pudo anular el cliente");
      }
    } catch (error) {
      console.error("Error al anular cliente:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    }
  };

  // Recarga la lista de clientes cada vez que esta pantalla entra en foco.
  useFocusEffect(() => {
    obtenerClientes();
  });

  // Muestra un spinner mientras se completa la carga inicial.
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
      {/* Título principal de la pantalla de gestión de clientes. */}
      <Text style={styles.title}>Gestion de Clientes:</Text>
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

      {/* Lista desplazable de clientes registrados. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarHeight - 50 }}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.subtitle}>Selecciona un Cliente:</Text>

        {clientes.map((cliente, index) => {
          // Construye el nombre completo uniendo los nombres y apellidos disponibles.
          const nombreCompleto = [
            cliente.Nombre1,
            cliente.Nombre2,
            cliente.Apaterno,
            cliente.Amaterno,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            /* Cada tarjeta representa un cliente y abre opciones de gestión. */
            <TouchableOpacity
              key={cliente.IdCliente ? cliente.IdCliente.toString() : index.toString()}
              style={styles.card}
              onPress={() =>
                Alert.alert(
                  "Opciones para Cliente",
                  `¿Qué deseas hacer con ${nombreCompleto}?`,
                  [
                    {
                      text: "Anular",
                      onPress: () => anularCliente(cliente.DNI),
                    },
                    {
                      text: "Modificar",
                      onPress: () => navigation.navigate("ModificarCliente", { cliente, onRefresh: obtenerClientes }),
                    },
                    {
                      text: "Cancelar",
                      style: "cancel",
                    },
                  ]
                )
              }
            >
              <Text style={styles.cardTitle}>{nombreCompleto || "Cliente sin nombre"}</Text>
              <Text style={styles.cardText}>DNI: {cliente.DNI || "N/A"}</Text>
              <Text style={styles.cardText}>Celular: {cliente.Celular || "N/A"}</Text>
              <Text style={styles.cardText}>Correo: {cliente.Correo || "N/A"}</Text>
              <Text style={styles.cardText}>Estado: {cliente.Estado || "N/A"}</Text>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: tabBarHeight - 80 }}></View>
      </ScrollView>

      {/* Botón inferior para navegar al formulario de registro de un nuevo cliente. */}
      <View style={styles.grid}>
        <TouchableOpacity
          onPress={() => navigation.navigate("RegistrarCliente", { onRefresh: obtenerClientes })}
          style={styles.btnRegistrar}
        >
          <Text style={styles.btnRegisText}>Nuevo Cliente</Text>
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
// Estilos generales de la pantalla y del listado de clientes.
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

  // Estilos del botón principal para registrar clientes.
  btnRegistrar: {
    backgroundColor: "#069488",
    width: 378,
    height: 50,
    marginBottom: 5,
    
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },

  // Estilos heredados para botones de modificar y anular dentro de esta pantalla.
  btnModificar: {
    backgroundColor: "#ff761a",
    width: 120,
    height: 50,
    marginBottom: 5,
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  btnAnular: {
    backgroundColor: "#d3002e",
    width: 120,
    height: 50,
    marginBottom: 5,
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },

  // Texto del botón de registro.
  btnRegisText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default clientes;
