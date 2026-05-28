import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";

// imports para idiomas 
import Fontisto from "@expo/vector-icons/Fontisto";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import i18n, { changeLanguage } from "../i18n";
import { Languages } from "../localizacion";

// URL base del backend para consultar el módulo de proyectos.
const API_URL = "http://www.tulote.somee.com";


const ListarProyectos = ({ navigation, route }) => {
  // Estado que controla si el menú flotante está abierto o cerrado.
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // funcion de idiomas 
  // Idioma actual usado por la pantalla para alternar entre español e inglés.
  const [language, setlanguage] = useState<Languages>("es");

  // Cambia el idioma actual y actualiza la configuración global de traducción.
  const handlechangeLanguage = () => {
    const lang: Languages = language === "en" ? "es" : "en";
    changeLanguage(lang);
    setlanguage(lang);
  }

  // Datos recibidos desde la navegación para personalizar la vista y las acciones disponibles.
  const { nombre, rol, idUsuario, onRefresh, proyectoSeleccionadoId, proyectoSeleccionadoNombre, loteSeleccionadoCodigo } = route.params || {};
  {
  }

  // Lista de proyectos cargados desde el servidor.
  const [proyectos, setProyectos] = useState([]);
  const scrollProyectosRef = useRef<ScrollView | null>(null);
  const posicionesProyectosRef = useRef<Record<string, number>>({});

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
  const anularProyecto = async (proyecto) => {
    const esActivo = proyecto.Estado === "A";
    const accionTexto = esActivo ? "anular" : "restaurar";
    const exitoTexto = esActivo ? "anulado" : "restaurado";

    try {
      const response = await fetch(
        `${API_URL}/Proyecto/proyecto_Anular/${proyecto.IdProyecto}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        Alert.alert("Éxito", `Proyecto ${exitoTexto} correctamente`);
        obtenerProyectos(); // Refresca la lista desde el servidor
      } else {
        Alert.alert("Error", `No se pudo ${accionTexto} el proyecto`);
      }
    } catch (error) {
      console.error("Error al cambiar estado del proyecto:", error);
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

  // ATAMAINE: Desde reportes bajamos hasta el proyecto marcado, ya sea por ID o por nombre.
  useEffect(() => {
    if ((!proyectoSeleccionadoId && !proyectoSeleccionadoNombre) || cargando) return;
    const timer = setTimeout(() => {
      const clave = String(proyectoSeleccionadoId || proyectoSeleccionadoNombre || "");
      const posicion = posicionesProyectosRef.current[clave];
      if (typeof posicion === "number") {
        scrollProyectosRef.current?.scrollTo({ y: Math.max(posicion - 18, 0), animated: true });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [proyectoSeleccionadoId, proyectoSeleccionadoNombre, cargando, proyectos]);

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

  const formatearFecha = (fechaRaw) => {
    if (!fechaRaw) return "N/A";
    try {
      const fecha = new Date(fechaRaw);
      // Controla errores si la cadena no es una fecha válida
      if (isNaN(fecha.getTime())) return fechaRaw;

      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(fecha);
    } catch (error) {
      return fechaRaw;
    }
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
                <Fontisto name="world-o" size={25} />
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
          ref={scrollProyectosRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={true}
        >
          {proyectoSeleccionadoId || proyectoSeleccionadoNombre ? (
            <View style={styles.selectedNotice}>
              <Text style={styles.selectedNoticeText}>
                Proyecto seleccionado desde reporte: {proyectoSeleccionadoNombre || proyectoSeleccionadoId}
                {loteSeleccionadoCodigo ? ` | Lote: ${loteSeleccionadoCodigo}` : ""}
              </Text>
            </View>
          ) : null}

          {proyectos.map((proyecto, index) => {
            // ATAMAINE: Marcamos por ID cuando existe; para lotes usamos nombre del proyecto relacionado.
            const coincideId = proyectoSeleccionadoId && String(proyecto.IdProyecto || "") === String(proyectoSeleccionadoId);
            const coincideNombre = proyectoSeleccionadoNombre && String(proyecto.Nombre || "").trim().toLowerCase() === String(proyectoSeleccionadoNombre).trim().toLowerCase();
            const estaSeleccionado = Boolean(coincideId || coincideNombre);

            // EVALUACIÓN DE ESTADOS DINÁMICOS
            const estaActivo = proyecto.Estado === "A";
            const textoBotonEstado = estaActivo ? "Anular" : "Restaurar";
            const textoVisualEstado = estaActivo ? "Activo" : "Inactivo";

            return (
              /* Cada tarjeta representa un proyecto y permite abrir su detalle. */
              <TouchableOpacity
                key={
                  proyecto.IdProyecto
                    ? proyecto.IdProyecto.toString()
                    : index.toString()
                }
                style={[styles.card, estaSeleccionado && styles.cardSeleccionada]}
                onLayout={(event) => {
                  if (proyecto.IdProyecto) {
                    posicionesProyectosRef.current[String(proyecto.IdProyecto)] = event.nativeEvent.layout.y;
                  }
                  if (proyecto.Nombre) {
                    posicionesProyectosRef.current[String(proyecto.Nombre)] = event.nativeEvent.layout.y;
                  }
                }}
                onPress={() =>
                  navigation.navigate("DetalleProyecto", {
                    idProyecto: proyecto.IdProyecto,
                    urlCSV: proyecto.ImagenUrl,
                    info: proyecto,
                    idUsuario,
                  })
                }
              >
                {estaSeleccionado ? (
                  <View style={styles.selectedBadge}>
                    <Text style={styles.selectedBadgeText}>Seleccionado</Text>
                  </View>
                ) : null}
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
                              text: textoBotonEstado,
                              onPress: () => anularProyecto(proyecto),
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
                  Hectareas: {proyecto.NumeroHectareas || "N/A"}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center'}}>
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

                <Text style={styles.cardText}>
                  Fecha Registro: {formatearFecha(proyecto.FechaRegistro)}
                </Text>
              </TouchableOpacity>
            )
          })}
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

  // Contenedor del menú flotante superior derecho (Idéntico a las pantallas previas)
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
    borderRadius: 21, // Redondeado circular para simetría
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  // Estilos generales de la pantalla y del listado de proyectos
  container: {
    flex: 1,
    backgroundColor: "#f4fcfb", // Fondo premium sutil unificado
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  textheader: {
    fontWeight: "600",
    color: "#64748b", // Gris elegante para subtextos de bienvenida
    fontSize: 14,
  },
  textheader2: {
    fontWeight: "900",
    fontSize: 22,
    color: "#069488",
  },
  title: {
    fontSize: 22,
    fontWeight: "900", // Tipografía robusta consistente
    color: "#111827",  // Tono oscuro principal
    marginBottom: 6,
  },
  form: {
    flex: 1,
    justifyContent: "center",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b", // Gris sutil consistente
    marginBottom: 16,
  },

  // Tarjetas estándar de proyectos
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 148, 136, 0.08)',
    borderLeftWidth: 5,
    borderLeftColor: "#069488", // Borde esmeralda de marca
    shadowColor: "#087c72",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  // ATAMAINE: Resaltado premium pulido para ubicar proyectos abiertos desde reportes o lotes
  cardSeleccionada: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#2563eb", // Azul royal controlado
    borderLeftWidth: 6,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  selectedNotice: {
    backgroundColor: "#eff6ff", // Alerta azul sutil muy limpia
    borderLeftWidth: 5,
    borderLeftColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.08)"
  },
  selectedNoticeText: {
    color: "#1d4ed8",
    fontSize: 13.5,
    fontWeight: "800",
  },
  selectedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#2563eb",
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
    color: "#111827", // Título oscuro de alta legibilidad
  },
  cardText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#475569", // Gris oscuro para los datos del proyecto
    marginBottom: 4,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  opciones: {
    width: 40,
    height: 35,
    paddingLeft: 12,
    justifyContent: "center",
    alignItems: "center"
  },
  textOpciones: {
    color: "#64748b", // Gris neutro para el botón de tres puntos / opciones
    fontSize: 22,
    fontWeight: "900",
  },

  // Estilos del botón para registrar nuevos proyectos (Consistencia con Login y Usuarios)
  btnRegistrar: {
    backgroundColor: "#069488",
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
  btnRegisText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16,
  },
  btnregresar: {
    alignItems: "center",
    paddingVertical: 14,
  },
  badgeEstado: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeTexto: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

});

export default ListarProyectos;
