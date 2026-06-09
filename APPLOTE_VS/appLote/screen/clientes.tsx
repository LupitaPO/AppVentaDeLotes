import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from '@react-navigation/native';

// imports para idiomas 
import Fontisto from "@expo/vector-icons/Fontisto";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import i18n, {changeLanguage} from "../i18n";
import { Languages } from "../localizacion";
import { API_URL } from "../config/apiUrl";



const Clientes = ({ navigation, route }) => {
  // Datos recibidos desde la navegación para personalizar la vista según el usuario.
  const { nombre, rol, clienteSeleccionadoDNI, clienteSeleccionadoNombre } = route.params || {};

  // Altura de la barra inferior para dejar espacio visual al final del ScrollView.
  const tabBarHeight = useBottomTabBarHeight();

  // Lista de clientes obtenida desde la API.
  const [clientes, setClientes] = useState([]);
  const scrollClientesRef = useRef<ScrollView | null>(null);
  const posicionesClientesRef = useRef<Record<string, number>>({});

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
  const anularCliente = async (clienteItem) => {
    const estadoRaw = clienteItem.Estado || "X";
    const esActivo = String(estadoRaw).trim().toUpperCase() === "A";

    const accionTexto = esActivo ? "anular" : "restaurar";
    const exitoTexto = esActivo ? "anulado" : "restaurado";

    try {
      const response = await fetch(`${API_URL}/Cliente/cliente_Anular/${clienteItem.DNI}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert("Éxito", `Cliente ${exitoTexto} correctamente`);
        obtenerClientes(); // Recargar la lista
      } else {
        const errorMsg = await response.text();
        console.log("Error del server:", errorMsg);
        Alert.alert("Error", `No se pudo ${accionTexto} el cliente`);
      }
    } catch (error) {
      console.error("Error al cambiar estado del cliente:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    }
  };

  // Recarga la lista de clientes cada vez que esta pantalla entra en foco.
  useFocusEffect(
    React.useCallback(() => {
      obtenerClientes();
    }, [])
  );


  // ATAMAINE: Si llegamos desde ReporteClientes, bajamos hasta la tarjeta marcada para ubicarla rapido.
  useEffect(() => {
    if (!clienteSeleccionadoDNI || cargando) return;
    const timer = setTimeout(() => {
      const posicion = posicionesClientesRef.current[String(clienteSeleccionadoDNI)];
      if (typeof posicion === "number") {
        scrollClientesRef.current?.scrollTo({ y: Math.max(posicion - 18, 0), animated: true });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [clienteSeleccionadoDNI, cargando, clientes]);

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
        ref={scrollClientesRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: tabBarHeight - 50 }}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.subtitle}>Selecciona un Cliente:</Text>
        {clienteSeleccionadoDNI ? (
          <View style={styles.selectedNotice}>
            <Text style={styles.selectedNoticeText}>
              Cliente seleccionado desde reporte: {clienteSeleccionadoNombre || clienteSeleccionadoDNI}
            </Text>
          </View>
        ) : null}

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

          // ATAMAINE: Comparamos por DNI para pintar exactamente el cliente tocado desde el reporte.
          const estaSeleccionado = String(cliente.DNI || "") === String(clienteSeleccionadoDNI || "");
          
           // CORRECCIÓN: Validación segura basada en la palabra "Activo" que viene de tu API
          const estadoRaw = cliente.Estado || "X";
          const estaActivo = String(estadoRaw).trim().toUpperCase() === "A";

          const textoBotonEstado = estaActivo ? "Anular" : "Restaurar";
          const textoVisualEstado = estaActivo ? "Activo" : "Inactivo";
          return (
            /* Cada tarjeta representa un cliente y abre opciones de gestión. */
            <TouchableOpacity
              key={cliente.IdCliente ? cliente.IdCliente.toString() : index.toString()}
              style={[styles.card, estaSeleccionado && styles.cardSeleccionada]}
              onLayout={(event) => {
                if (cliente.DNI) {
                  posicionesClientesRef.current[String(cliente.DNI)] = event.nativeEvent.layout.y;
                }
              }}
              onPress={() =>
                Alert.alert(
                  "Opciones para Cliente",
                  `¿Qué deseas hacer con ${nombreCompleto}?`,
                  [
                    {
                      text: textoBotonEstado,
                      onPress: () => anularCliente(cliente),
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
              {estaSeleccionado ? (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>Seleccionado</Text>
                </View>
              ) : null}
              <Text style={styles.cardTitle}>{nombreCompleto || "Cliente sin nombre"}</Text>
              <Text style={styles.cardText}>DNI: {cliente.DNI || "N/A"}</Text>
              <Text style={styles.cardText}>Celular: {cliente.Celular || "N/A"}</Text>
              <Text style={styles.cardText}>Correo: {cliente.Correo || "N/A"}</Text>
              {/* Badge Visual de Estado Estilizado */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.cardText}>Estado: </Text>
                <View style={[
                  styles.badgeEstado,
                  { backgroundColor: estaActivo ? '#E6F4F1' : '#FCE8E6' }
                ]}>
                  <Text style={[
                    styles.badgeTexto,
                    { color: estaActivo ? '#069488' : '#D9534F' }
                  ]}>
                    {textoVisualEstado}
                  </Text>
                </View>
              </View>
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
// Contenedor del menú flotante superior derecho (Idéntico a todas tus pantallas)
  containerFlotante: {
    position: 'absolute',
    top: 40,           
    right: 20,
    zIndex: 999,       
    alignItems: 'center',
  },
  menuDesplegado: {
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  btnPrincipal: {
    backgroundColor: '#069488', // Verde insignia de tu app
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#0f766e',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  idioma: {
    top:5,
    backgroundColor: '#ffffff', // Fondo blanco limpio consistente
    width: 42,
    height: 42,
    borderRadius: 21,     
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 3,         
    shadowColor: '#0f172a',  
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  btnsalir: {
    backgroundColor: "#ef4444", // Rojo plano moderno
    height: 42,
    width: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21, // Redondeado circular para simetría absoluta
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  // Estilos generales de la pantalla y del listado de clientes
  container: {
    flex: 1,
    backgroundColor: "#f4fcfb", // Fondo premium sutil unificado
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "900", // Tipografía robusta consistente
    color: "#111827",  // Tono oscuro principal para jerarquía
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",  // Gris elegante para subtextos
    marginBottom: 20,
  },
  
  // Tarjetas estándar de clientes
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 148, 136, 0.08)',
    borderLeftWidth: 5,
    borderLeftColor: "#069488", // Borde esmeralda identificador de marca
    shadowColor: "#087c72",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  
  // ATAMAINE: Resaltado premium pulido para ubicar el cliente seleccionado desde el reporte
  cardSeleccionada: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#14b8a6", // Enfoque esmeralda claro controlado
    borderLeftWidth: 6,
    shadowColor: "#0f766e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  selectedNotice: {
    backgroundColor: "#e6fbf7", // Alerta esmeralda sutil muy limpia
    borderLeftWidth: 5,
    borderLeftColor: "#0f766e",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(15, 118, 110, 0.08)"
  },
  selectedNoticeText: {
    color: "#0f766e",
    fontSize: 13.5,
    fontWeight: "800",
  },
  selectedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#0f766e",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  selectedBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  
  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
    color: "#111827", // Nombre del cliente en tono oscuro premium
  },
  cardText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#475569", // Gris oscuro para los datos informativos del cliente
    marginBottom: 4,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between", // Espaciado inteligente para botones internos
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },

  // Botón para registrar clientes (Diseño responsivo y limpio)
  btnRegistrar: {
    backgroundColor: "#069488", // Verde éxito premium unificado
    width: "100%", 
    maxWidth: 420, 
    height: 52,
    alignSelf: "center",
    marginBottom: 16,
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    shadowColor: "#069488",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },

  // Botones de acción interna (Modificar y Anular dentro de la tarjeta)
  btnModificar: {
    backgroundColor: "#f97316", // Naranja premium plano (sin bordes rústicos blancos)
    flex: 1, // Se adapta dinámicamente al contenedor de la tarjeta
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  btnAnular: {
    backgroundColor: "#ef4444", // Rojo plano moderno pulido
    flex: 1,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },

  // Texto de los botones
  btnRegisText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
  },
      // Badges dinámicos integrados
  badgeEstado: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
});

export default Clientes;
