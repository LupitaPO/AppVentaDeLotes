import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect } from '@react-navigation/native';

// imports para idiomas 
import Fontisto from "@expo/vector-icons/Fontisto";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import i18n, { changeLanguage } from "../i18n";
import { Languages } from "../localizacion";
import RegistrarAsesor from "./Asesor/RegistrarAsesor";
import RegistrarUsuario from "./Usuarios/RegistrarUsuario";
import { API_URL } from "../config/apiUrl";
import { WebListHeader, webListStyles } from "../components/web-list-layout";
import { ActionOptionsModal } from "../components/action-options-modal";

// URL base del backend para consultar y administrar usuarios.
// ATAMAINE: API_URL viene de config/apiUrl para que web use proxy CORS y movil use API real.

type UsuarioScreenProps = { navigation: any; route: any };

const Usuario = ({ navigation, route }: UsuarioScreenProps) => {
  const esWeb = Platform.OS === "web";
  // Datos recibidos desde navegación para personalizar la pantalla según el contexto del usuario.
  const { nombre, rol, usuarioSeleccionadoId, usuarioSeleccionadoNombre } = route.params || {};

  // Altura de la barra inferior para dejar espacio visual al final del listado.
  const tabBarHeight = useBottomTabBarHeight();

  // Lista de usuarios recuperada desde la API.
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const scrollUsuariosRef = useRef<ScrollView | null>(null);
  const posicionesUsuariosRef = useRef<Record<string, number>>({});

  // Estado que controla el indicador de carga mientras llegan los datos.
  const [cargando, setCargando] = useState(true);
  const [opcionesUsuario, setOpcionesUsuario] = useState<any | null>(null);

  // funcion de idiomas //////////////////////////////////////////////

  // Estado que abre o cierra el menú flotante de acciones rápidas.
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Idioma actual seleccionado en la pantalla.
  const [language, setlanguage] = useState<Languages>("es");

  // Alterna entre español e inglés y sincroniza el cambio con i18n.
  const handlechangeLanguage = () => {
    const lang: Languages = language === "en" ? "es" : "en";
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
  const anularUsuario = async (usuario: any) => {
    // Evaluamos si el estado actual es 'A'. Si no lo es, asumimos que es 'X' (u otro estado inactivo)
    const esActivo = usuario.Estado === "A";
    const accionTexto = esActivo ? "anular" : "restaurar";
    const exitoTexto = esActivo ? "anulado" : "restaurado";

    try {
      // Mandamos el ID correcto a la URL de tu API
      const response = await fetch(`${API_URL}/Usuario/usuario_Anular/${usuario.IdUsuario}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        Alert.alert("Éxito", `Usuario ${exitoTexto} correctamente`);
        obtenerUsuarios(); // Esto refresca la lista de la API y cambiará el estado de "A" a "X" (o viceversa)
      } else {
        Alert.alert("Error", `No se pudo ${accionTexto} el Usuario`);
      }
    } catch (error) {
      console.error("Error al cambiar estado del Usuario:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    }
  };

  // Recarga la lista cada vez que la pantalla vuelve a estar en foco.
  useFocusEffect(() => {
    obtenerUsuarios();
  });

  // ATAMAINE: Si llegamos desde ReporteUsuarios, ubicamos visualmente el usuario marcado.
  useEffect(() => {
    if (!usuarioSeleccionadoId || cargando) return;
    const timer = setTimeout(() => {
      const posicion = posicionesUsuariosRef.current[String(usuarioSeleccionadoId)];
      if (typeof posicion === "number") {
        scrollUsuariosRef.current?.scrollTo({ y: Math.max(posicion - 18, 0), animated: true });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [usuarioSeleccionadoId, cargando, usuarios]);

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

  const modificarUsuario = (usuario: any) => {
    navigation.navigate("ModificarUsuario", {
      usuario: usuario,
      onRefresh: obtenerUsuarios,
    });
  };

  const abrirOpcionesUsuario = (usuario: any, nombreCompleto: string, textoBotonEstado: string) => {
    if (esWeb) {
      setOpcionesUsuario({ usuario, nombreCompleto, textoBotonEstado });
      return;
    }

    Alert.alert(
      "Opciones para Usuarios",
      `¿Qué deseas hacer con ${nombreCompleto}?`,
      [
        {
          text: textoBotonEstado,
          onPress: () => anularUsuario(usuario),
        },
        {
          text: "Modificar",
          onPress: () => modificarUsuario(usuario),
        },
        {
          text: "Cancelar",
          style: "cancel",
        },
      ],
    );
  };
  /////////////////////////////////////////////////////////////////////////////////////////////////////////

  // ATAMAINE: Ver desde ReporteUsuarios muestra exclusivamente la persona
  // seleccionada; el acceso normal a esta pantalla conserva la lista completa.
  const usuariosVisibles = usuarioSeleccionadoId
    ? usuarios.filter(
      (usuario) => String(usuario.IdUsuario || "") === String(usuarioSeleccionadoId),
    )
    : usuarios;

  return (
    <View style={[styles.container, esWeb && webListStyles.page]}>
      {/* Título principal de la sección de gestión de usuarios. */}
      {esWeb ? (
        <WebListHeader
          title="Gestión de Usuarios"
          subtitle="Controla perfiles, accesos y estado operativo de los usuarios del sistema."
          count={usuariosVisibles.length}
          actionLabel="Nuevo Usuario"
          onAction={() => navigation.navigate("RegistrarUsuario", { onRefresh: obtenerUsuarios })}
        />
      ) : <Text style={styles.title}>Gestion de Usuarios:</Text>}
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

      {/* Lista desplazable con todos los usuarios registrados. */}
      <ScrollView
        ref={scrollUsuariosRef}
        style={{ flex: 1 }}
        contentContainerStyle={[{ paddingBottom: tabBarHeight + 20 }, esWeb && webListStyles.listContent]}
        showsVerticalScrollIndicator={true}
      >
        {!esWeb ? <Text style={styles.subtitle}>Selecciona un Usuario:</Text> : null}
        {usuarioSeleccionadoId ? (
          <View style={[styles.selectedNotice, esWeb && webListStyles.fullWidth]}>
            <Text style={styles.selectedNoticeText}>
              Mostrando solo el usuario seleccionado: {usuarioSeleccionadoNombre || usuarioSeleccionadoId}
            </Text>
          </View>
        ) : null}

        {usuariosVisibles.map((usuario, index) => {
          // Construye el nombre mostrado usando los campos disponibles del usuario.
          const nombreCompleto = usuario.Nombre || "Usuario sin nombre";

          // EVALUACIÓN DE ESTADOS DINÁMICOS
          const estaActivo = usuario.Estado === "A";
          const textoBotonEstado = estaActivo ? "Anular" : "Restaurar";
          const textoVisualEstado = estaActivo ? "Activo" : "Inactivo";

          // ATAMAINE: Comparamos por IdUsuario para marcar el registro real de la pantalla de usuarios.
          const estaSeleccionado = String(usuario.IdUsuario || "") === String(usuarioSeleccionadoId || "");
          return (
            /* Cada tarjeta representa un usuario y abre acciones de administración. */
            <TouchableOpacity
              key={usuario.IdUsuario ? usuario.IdUsuario.toString() : index.toString()}
              style={[styles.card, esWeb && webListStyles.card, estaSeleccionado && styles.cardSeleccionada]}
              onLayout={(event) => {
                if (usuario.IdUsuario) {
                  posicionesUsuariosRef.current[String(usuario.IdUsuario)] = event.nativeEvent.layout.y;
                }
              }}
              onPress={() => abrirOpcionesUsuario(usuario, nombreCompleto, textoBotonEstado)}
            >
              {estaSeleccionado ? (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>Seleccionado</Text>
                </View>
              ) : null}
              <Text style={styles.cardTitle}>{nombreCompleto || "Asesor sin nombre"}</Text>
              <Text style={styles.cardText}>Celular: {usuario.Celular || "N/A"}</Text>
              <Text style={styles.cardText}>Correo: {usuario.Correo || "N/A"}</Text>

              <Text style={styles.cardText}>TipoUsuario: {usuario.TipoUsuario || "N/A"}</Text>

              {/* Texto de estado transformado ("Activo" o "Inactivo") */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.cardText}>Estado: </Text>
                <View style={[
                  styles.badgeEstado,
                  { backgroundColor: estaActivo ? '#E6F4F1' : '#FCE8E6' } // Fondos pasteles
                ]}>
                  <Text style={[
                    styles.badgeTexto,
                    { color: estaActivo ? '#069488' : '#D9534F' } // Textos fuertes
                  ]}>
                    {textoVisualEstado}
                  </Text>
                </View>
              </View>

            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ActionOptionsModal
        visible={!!opcionesUsuario}
        title="Opciones para Usuarios"
        message={`¿Qué deseas hacer con ${opcionesUsuario?.nombreCompleto || ""}?`}
        statusLabel={opcionesUsuario?.textoBotonEstado || "Anular"}
        onStatusPress={() => opcionesUsuario?.usuario && anularUsuario(opcionesUsuario.usuario)}
        onModifyPress={() => opcionesUsuario?.usuario && modificarUsuario(opcionesUsuario.usuario)}
        onClose={() => setOpcionesUsuario(null)}
      />

      {/* Botón inferior para navegar al formulario de registro. */}
      {!esWeb ? <View style={styles.grid}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("RegistrarUsuario", { onRefresh: obtenerUsuarios })
          }
          style={styles.btnRegistrar}
        >
          <Text style={styles.btnRegisText}>Nuevo Usuario</Text>
        </TouchableOpacity>
      </View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  // Contenedor del menú flotante superior derecho
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
    backgroundColor: "#ef4444", // Rojo plano estilizado moderno
    height: 42,
    width: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21, // Redondeado idéntico al de idioma para simetría
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  // Estilos generales de la pantalla y las tarjetas de usuarios
  container: {
    flex: 1,
    backgroundColor: "#f4fcfb", // Fondo premium sutil unificado
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: "900", // Tipografía robusta consistente
    color: "#111827",  // Texto oscuro legible para encabezados de sección
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",  // Gris elegante para subtextos y guías
    marginBottom: 20,
  },
  
  // Tarjetas de usuarios estándar
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 148, 136, 0.08)',
    borderLeftWidth: 5,
    borderLeftColor: "#069488", // Borde distintivo de la marca
    shadowColor: "#087c72",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  
  // ATAMAINE: Resaltado premium pulido para ubicar usuarios desde reportes
  cardSeleccionada: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#0891b2", // Resalte cian controlado
    borderLeftWidth: 6,
    shadowColor: "#0891b2",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  selectedNotice: {
    backgroundColor: "#ecfeff", // Alerta sutil basada en cian limpio
    borderLeftWidth: 5,
    borderLeftColor: "#0891b2",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(8, 145, 178, 0.08)"
  },
  selectedNoticeText: {
    color: "#0e7490",
    fontSize: 13.5,
    fontWeight: "800",
  },
  selectedBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#0891b2",
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
    color: "#111827", // Título del usuario en tono oscuro premium
  },
  cardText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#475569", // Texto interno gris oscuro de alta legibilidad
    marginBottom: 4,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },

  // Estilos del botón principal para registrar un nuevo usuario/asesor
  btnRegistrar: {
    backgroundColor: "#069488", // Botón principal unificado con el Login
    width: "100%", // Se cambia de ancho estático (378) a relativo para evitar desbordes en pantallas pequeñas
    maxWidth: 420,  // Límite óptimo para pantallas grandes
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

export default Usuario
