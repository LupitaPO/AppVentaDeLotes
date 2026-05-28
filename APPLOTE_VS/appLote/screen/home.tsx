// Componentes base de React Native para estructura visual, dimensiones, carga y scroll.
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";

// Hooks de React para manejar estado local y ciclos de vida simples del componente.
import React, { useState, useEffect } from "react";

// Componente de gráfica circular usado para mostrar el resumen de lotes vendidos y libres.
import { PieChart } from "react-native-chart-kit";

// Librería de íconos usada en tarjetas y elementos visuales del dashboard.
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Import actualmente presente en el archivo, aunque no forma parte del flujo visual del dashboard.
import { symbolicate } from "react-native/types_generated/Libraries/LogBox/Data/LogBoxSymbolication";

// Soporte para animaciones; en este archivo está importado pero no se usa en la lógica visible.
import Animated from "react-native-reanimated";

// Hook para conocer la altura de la barra inferior de navegación.
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

// Hook que permite recargar datos cuando la pantalla vuelve a tener foco.
import { useFocusEffect } from "@react-navigation/native";
// imports para idiomas 

// Ícono usado para el botón flotante de cambio de idioma.
import Fontisto from "@expo/vector-icons/Fontisto";

// Íconos usados para el menú flotante y el botón de cerrar sesión.
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// Instancia de traducción y función auxiliar para cambiar idioma dinámicamente.
import i18n, {changeLanguage} from "../i18n";

// Tipo que restringe los idiomas válidos manejados por la aplicación.
import { Languages } from "../localizacion";
import { API_URL } from "../config/apiUrl";

// Ancho de la pantalla usado para calcular tamaños del dashboard y de la gráfica.
const screenWidth = Dimensions.get("window").width;

// ATAMAINE: API_URL viene de config/apiUrl para que web use proxy CORS y movil use API real.


const home = ({ route, navigation }) => {
  const { width } = useWindowDimensions();
  const esPantallaPc = width >= 900;
  const anchoContenido = esPantallaPc ? 720 : width;
  const anchoGrafico = Math.max(300, Math.min(anchoContenido - 60, 680));

  // Altura de la barra inferior para dejar espacio visual al final del contenido.
  const tabBarHeight = useBottomTabBarHeight();

  // Datos del usuario recibidos desde la navegación principal.
  const { nombre, rol } = route.params || {};
  // Aseguramos que route.params exista
  // console.log("rol recibido:", rol);// Aseguramos que route.params exista
  
  // funcion de idiomas 
  // Estado que controla si el menú flotante está abierto o cerrado.
  const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Idioma actualmente seleccionado en la interfaz.
    const [language,setlanguage] = useState<Languages>("es");

    // Alterna entre español e inglés y actualiza el motor de traducciones.
    const handlechangeLanguage = ()=> {
      const lang: Languages = language === "en" ? "es" :"en";
      changeLanguage(lang);
      setlanguage(lang);
    }

  // Objeto con los datos resumidos que devuelve el dashboard desde la API.
  const [datos, setDatos] = useState(null);

  // Controla el spinner inicial mientras se carga la información.
  const [loading, setLoading] = useState(true);

  // Controla el estado del gesto de actualización manual del ScrollView.
  const [refreshing, setRefreshing] = useState(false);

  // --- 2. LÓGICA DE COMUNICACIÓN CON EL PA ---
  // Consulta el resumen general del dashboard y guarda la primera fila devuelta por la API.
  const cargarDashboard = async () => {
    try {
      const response = await fetch(
        `${API_URL}/Dashboard/dashboard_ResumenGeneral`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setDatos(data[0]); // Guardamos la primera fila del PA
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Recarga el dashboard cada vez que esta pantalla vuelve a tener foco.
  useFocusEffect(() => {
    cargarDashboard();
  });

  // Componente local reutilizable para mostrar una métrica con ícono y color.
  const DashCard = ({ titulo, valor, icono, color }) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <MaterialCommunityIcons name={icono} size={28} color={color} />

      <View style={styles.info}>
        <Text style={styles.cardTitle}>{titulo}</Text>
        <Text style={styles.cardValue}>{valor}</Text>
      </View>
    </View>
  );

  // Mientras llega la información del dashboard, se muestra una pantalla de carga.
  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#1A237E" />
      </View>
    );

  // Configuración de la gráfica con tus datos del PA
  // Datos transformados al formato que espera la librería de gráfica circular.
  const pieData = [
    {
      name: "Vendidos",
      population: datos?.TotalVendidos || 0,
      color: "#1A237E",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Libres",
      population: datos?.TotalLotes - datos?.TotalVendidos || 0,
      color: "#E0E0E0",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
  ];

  // Reinicia la navegación y devuelve al usuario a la pantalla de login.
  const cerrarSesion = () => {
    // Simplemente redirigimos y reseteamos el historial
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }], // Cambia 'Login' por el nombre exacto de tu pantalla inicial
    });
  };
  return (
    <View style={styles.root}>
      {/* Cabecera superior con saludo al usuario y menú de acciones rápidas. */}
      <View
        style={styles.topHeader}
      >
        {/* Contenedor del encabezado con nombre del usuario actual. */}
        <View style={styles.headerContainer}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.textheader}>{i18n.t("Dtitle")}</Text>
            <Text style={styles.textheader2}>{nombre || "Usuario"}</Text>
          </View>
      
        </View>
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

      </View>

      {/* Contenedor desplazable del dashboard con soporte para refresco manual. */}
      <ScrollView
        style={{ flexGrow: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={cargarDashboard} />
        }
      >
        {/* El contenido del resumen solo se muestra para roles distintos de Cliente. */}
        {rol !== "Cliente" && (
          <View
            style={[
              styles.container,
              esPantallaPc && styles.containerDesktop,
            ]}

            // refreshControl={<RefreshControl
            // refreshing={refreshing}
            // onRefresh={cargarDashboard} />}
          >
            <Text style={styles.header}>{i18n.t("Dmsj")}</Text>

            {/* Zona de Dinero */}

            {/* Tarjeta principal con el valor total esperado en cartera futura. */}
            <View style={styles.mainBox}>
              <Text style={styles.mainTitle}>{i18n.t("Dmsj2")}</Text>
              <Text style={styles.mainAmount}>
                S/ {datos?.CarteraTotalFutura || "0.00"}
              </Text>
            </View>

            {/* Sección de gráfica circular para comparar lotes vendidos y libres. */}
            <View style={styles.chartBox}>
              <Text style={styles.chartTitle}>{i18n.t("Dmsj3")}</Text>
              <PieChart
                data={pieData} // <--- AQUÍ ES DONDE SE LLAMA A LA CONSTANTE
                width={anchoGrafico}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor={"population"} // Le dice a la gráfica que use el número de 'population'
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute // Para que muestre el número exacto (ej. 50) y no solo el %
              />
            </View>

            {/* Grid de Métricas */}
            {/* Cuadrícula de indicadores rápidos del estado comercial y financiero. */}
            <View style={styles.grid}>
              <DashCard
                titulo={i18n.t("card1")}
                valor={`S/ ${datos?.RecaudadoHistorico}`}
                icono="cash-check"
                color="#4CAF50"
              />

              <DashCard
                titulo={i18n.t("card2")}
                valor={`S/ ${datos?.DineroVencidoHoy}`}
                icono="alert-circle"
                color="#F44336"
              />

              <DashCard
                titulo={i18n.t("card3")}
                valor={`${datos?.TotalVendidos} / ${datos?.TotalLotes}`}
                icono="home-group"
                color="#2196F3"
              />

              <DashCard
                titulo={i18n.t("card4")}
                valor={datos?.CantidadDeudores}
                icono="account-alert"
                color="#FF9800"
              />
            </View>

            {/* Botón estilo "pill" para acceder al menú de reportes (solo diseño visual). */}
            <View style={styles.reportPillWrapper}>
              <TouchableOpacity
                style={styles.reportPill}
                onPress={() =>
                  navigation.navigate("MenuReportes", {
                    rol,
                    nombre,
                    idUsuario: route?.params?.idUsuario,
                  })
                }
                activeOpacity={0.85}
              >
                <View style={styles.reportPillAccent} />
                <MaterialCommunityIcons name="file-chart" size={20} color="#0f766e" style={{ marginRight: 10 }} />
                <Text style={styles.reportPillText}>Reportes</Text>
              </TouchableOpacity>
            </View>

            {/* Espacio extra para que el contenido no quede pegado a la barra inferior. */}
            <View style={{ height: tabBarHeight + 20 }}></View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const { height: screenHeight } = Dimensions.get("window");
const styles = StyleSheet.create({

  // ATAMAINE: Raiz con flex real para que web no corte el dashboard ni esconda Reportes.
 root: {
    flex: 1,
    backgroundColor: "#f4fcfb", // Fondo premium muy limpio con ligero tinte verde
  },

  // Header estable
  topHeader: {
    width: "100%",
    minHeight: 104,
    backgroundColor: "#ffffff",
  },

  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#f4fcfb",
  },

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

  // Botón hamburguesa/principal flotante adaptado a la marca
  btnPrincipal: {
    backgroundColor: '#069488', // El color insignia de tu app
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

  // Botón de idioma estilizado para que comparta el look con las otras pantallas
  idioma: {
    top:5,
    backgroundColor: '#ffffff', 
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

  // Botón salir refinado para que no rompa el esquema con un rojo puro brillante
  btnsalir: {
    backgroundColor: "#ef4444", // Rojo plano moderno y estilizado
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

  // Encabezado del dashboard corregido
  headerContainer: {
    backgroundColor: "#ffffff",
    paddingTop: 40,
    height: 99,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "rgba(15,23,42,0.05)",
    elevation: 4,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },

  textheader: {
    fontWeight: "600",
    color: "#64748b", // Gris elegante para subtextos
    fontSize: 14,
  },

  textheader2: {
    fontWeight: "900", // Peso visual fuerte premium
    fontSize: 22,
    color: "#069488",
  },

  container: {
    width: "100%",
    minHeight: screenHeight,
    backgroundColor: "#f4fcfb",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 60,
  },

  containerDesktop: {
    maxWidth: 760,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 18,
  },

  header: {
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 20,
    color: "#111827", // Color oscuro legible en vez de saturar con verde
  },

  // Tarjeta de métrica principal económica (Gradiente o Sólido Premium)
  mainBox: {
    backgroundColor: "#069488", // Verde esmeralda insignia
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    borderLeftWidth: 6,
    borderLeftColor: "#063834", // Resalte sutil
    elevation: 6,
    shadowColor: "#069488",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },

  mainTitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  mainAmount: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "900",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  // Tarjetas pequeñas individuales adaptadas a loginPanel
  card: {
    backgroundColor: "#ffffff",
    width: "48%",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(6, 148, 136, 0.08)",
    borderLeftWidth: 5,
    borderLeftColor: "#069488", // Borde esmeralda identificador
    shadowColor: "#087c72",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  info: {
    marginLeft: 10,
    flex: 1,
  },

  cardTitle: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
  },

  cardValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },

  // Caja de gráficos adaptada al estilo limpio
  chartBox: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(6, 148, 136, 0.08)",
    elevation: 4,
    shadowColor: "#087c72",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    alignItems: "center",
  },

  chartTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 14,
    textAlign: "center",
  },

  // Botones de acciones refinados para evitar bordes blancos bruscos
  btnRegistrar: {
    backgroundColor: "#10b981", // Verde éxito moderno
    width: 120,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },

  btnModificar: {
    backgroundColor: "#f97316", // Naranja premium plano
    width: 120,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    shadowColor: "#f97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },

  btnAnular: {
    backgroundColor: "#ef4444", 
    width: 120,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },

  btnRegisText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  reportPillWrapper: {
    paddingHorizontal: 0, 
    marginTop: 8,
    marginBottom: 16,
  },

  // Píldora de reporte perfectamente integrada
  reportPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(6, 148, 136, 0.08)",
    elevation: 4,
    shadowColor: "#087c72",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
  },

  reportPillAccent: {
    width: 6,
    height: 28,
    backgroundColor: "#069488",
    borderRadius: 4,
    marginRight: 12,
  },

  reportPillText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
});

export default home;
