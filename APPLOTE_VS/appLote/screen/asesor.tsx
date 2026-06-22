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
import { MaterialIcons } from "@expo/vector-icons";
import Fontisto from "@expo/vector-icons/Fontisto";
import { Languages } from "../localizacion";
import i18n, { changeLanguage } from "../i18n";
import { API_URL } from "../config/apiUrl";
import { WebListHeader, webListStyles } from "../components/web-list-layout";

//Revisión
type AsesorScreenProps = { navigation: any; route: any };

const Asesor = ({ navigation, route }: AsesorScreenProps) => {
  const esWeb = Platform.OS === "web";
  const { nombre, rol, asesorSeleccionadoDNI, asesorSeleccionadoNombre } = route.params || {};
  const tabBarHeight = useBottomTabBarHeight();
  const [asesores, setAsesores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const scrollAsesoresRef = useRef<ScrollView | null>(null);
  const posicionesAsesoresRef = useRef<Record<string, number>>({});

  // funcion de idiomas //////////////////////////////////////////////

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setlanguage] = useState<Languages>("es");
  const handlechangeLanguage = () => {
    const lang: Languages = language === "en" ? "es" : "en";
    changeLanguage(lang);
    setlanguage(lang);
  }

  ///////////////////////////////////////////////////////////////////

  const obtenerAsesores = async () => {
    try {
      const response = await fetch(`${API_URL}/Asesor/asesor_Listar`);
      const data = await response.json();
      
      setAsesores(data);
    } catch (error) {
      console.error("Error al listar asesores:", error);
    } finally {
      setCargando(false);
    }
  };

   const anularAsesor = async (asesorItem: any) => {
    // 1. Validamos el estado de manera segura (tolerante a mayúsculas/minúsculas y espacios)
    const estadoRaw = asesorItem.Estado || "Inactivo";
    const esActivo = String(estadoRaw).trim().toUpperCase() === "ACTIVO";
    
    // 2. Definimos los textos que saldrán en los mensajes de éxito o error
    const accionTexto = esActivo ? "anular" : "restaurar";
    const exitoTexto = esActivo ? "anulado" : "restaurado";

    try {
      // 3. Consumimos la API usando el DNI correcto extraído del objeto
      const response = await fetch(`${API_URL}/Asesor/asesor_Anular/${asesorItem.DNI}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        Alert.alert("Éxito", `Asesor ${exitoTexto} correctamente`);
        obtenerAsesores(); // Recarga la lista para cambiar Activo <-> Inactivo en pantalla
      } else {
        const errorMsg = await response.text();
        console.log("Error del server:", errorMsg);
        Alert.alert("Error", `No se pudo ${accionTexto} el asesor`);
      }
    } catch (error) {
      console.error("Error al anular asesor:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    }
  };

  useFocusEffect(() => {
    obtenerAsesores();
  });

  // ATAMAINE: Si llegamos desde ReporteAsesores, movemos la lista hasta el asesor marcado.
  useEffect(() => {
    if (!asesorSeleccionadoDNI || cargando) return;
    const timer = setTimeout(() => {
      const posicion = posicionesAsesoresRef.current[String(asesorSeleccionadoDNI)];
      if (typeof posicion === "number") {
        scrollAsesoresRef.current?.scrollTo({ y: Math.max(posicion - 18, 0), animated: true });
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [asesorSeleccionadoDNI, cargando, asesores]);

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

  // ATAMAINE: Ver desde ReporteAsesores muestra exclusivamente el asesor
  // seleccionado; el acceso normal conserva el listado completo.
  const asesoresVisibles = asesorSeleccionadoDNI
    ? asesores.filter(
      (asesorItem) => String(asesorItem.DNI || "") === String(asesorSeleccionadoDNI),
    )
    : asesores;

  return (
    <View style={[styles.container, esWeb && webListStyles.page]}>
      {esWeb ? (
        <WebListHeader
          title="Gestión de Asesores"
          subtitle="Organiza el equipo comercial y consulta su información actualizada."
          count={asesoresVisibles.length}
          actionLabel="Nuevo Asesor"
          onAction={() => navigation.navigate("RegistrarAsesor", { onRefresh: obtenerAsesores })}
        />
      ) : <Text style={styles.title}>Gestion de Asesores:</Text>}
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
                <Fontisto name="world-o" size={25}></Fontisto>
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
        ref={scrollAsesoresRef}
        style={{ flex: 1 }}
        contentContainerStyle={[{ paddingBottom: tabBarHeight + 20 }, esWeb && webListStyles.listContent]}
        showsVerticalScrollIndicator={true}
      >
        {!esWeb ? <Text style={styles.subtitle}>Selecciona un Asesor:</Text> : null}
        {asesorSeleccionadoDNI ? (
          <View style={[styles.selectedNotice, esWeb && webListStyles.fullWidth]}>
            <Text style={styles.selectedNoticeText}>
              Mostrando solo el asesor seleccionado: {asesorSeleccionadoNombre || asesorSeleccionadoDNI}
            </Text>
          </View>
        ) : null}

        {asesoresVisibles.map((asesorItem, index) => {
          const nombreCompleto = [
            asesorItem.Nombre1,
            asesorItem.Nombre2,
            asesorItem.Apaterno,
            asesorItem.Amaterno,
          ]
            .filter(Boolean)
            .join(" ");
          // ATAMAINE: La marca visual se hace por DNI para coincidir con el registro del reporte.
          const estaSeleccionado = String(asesorItem.DNI || "") === String(asesorSeleccionadoDNI || "");
          // EVALUACIÓN DE ESTADOS CON TOLERANCIA A FORMATOS DE API
          const estadoDeBaseDatos = asesorItem.Estado || "Inactivo";
          const estaActivo = String(estadoDeBaseDatos).trim().toUpperCase() === "ACTIVO";

          const textoBotonEstado = estaActivo ? "Anular" : "Restaurar";
          const textoVisualEstado = estaActivo ? "Activo" : "Inactivo";
          return (
            <TouchableOpacity
              key={asesorItem.IdAsesor ? asesorItem.IdAsesor.toString() : index.toString()}
              style={[styles.card, esWeb && webListStyles.card, estaSeleccionado && styles.cardSeleccionada]}
              onLayout={(event) => {
                if (asesorItem.DNI) {
                  posicionesAsesoresRef.current[String(asesorItem.DNI)] = event.nativeEvent.layout.y;
                }
              }}
              onPress={() =>
                Alert.alert(
                  "Opciones para Asesor",
                  `¿Qué deseas hacer con ${nombreCompleto}?`,
                  [
                    {
                      text: textoBotonEstado,
                      onPress: () => anularAsesor(asesorItem),
                    },
                    {
                      text: "Modificar",
                      onPress: () =>
                        navigation.navigate("ModificarAsesor", {
                          asesor: asesorItem,
                          onRefresh: obtenerAsesores,
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
              {estaSeleccionado ? (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>Seleccionado</Text>
                </View>
              ) : null}
              <Text style={styles.cardTitle}>{nombreCompleto || "Asesor sin nombre"}</Text>
              <Text style={styles.cardText}>DNI: {asesorItem.DNI || "N/A"}</Text>
              <Text style={styles.cardText}>Celular: {asesorItem.Celular || "N/A"}</Text>
              <Text style={styles.cardText}>Observaciones: {asesorItem.Observaciones || "N/A"}</Text>
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
      </ScrollView>

      {!esWeb ? <View style={styles.grid}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("RegistrarAsesor", { onRefresh: obtenerAsesores })
          }
          style={styles.btnRegistrar}
        >
          <Text style={styles.btnRegisText}>Nuevo Asesor</Text>
        </TouchableOpacity>
      </View> : null}
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
    borderRadius: 21, // Redondeado circular para simetría
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  // Estilos generales de la pantalla y del listado de asesores
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

  // Tarjetas estándar de asesores
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 148, 136, 0.08)',
    borderLeftWidth: 5,
    borderLeftColor: "#069488", // Borde esmeralda identificador
    shadowColor: "#087c72",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  // ATAMAINE: Resaltado premium pulido para ubicar el asesor seleccionado desde el reporte
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
    color: "#111827", // Nombre del asesor en tono oscuro premium
  },
  cardText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#475569", // Gris oscuro para los datos de contacto/ventas
    marginBottom: 4,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
  },

  // Estilos del botón para registrar nuevos asesores (Diseño limpio responsivo)
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

export default Asesor
