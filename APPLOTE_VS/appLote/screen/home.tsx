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

// Ancho de la pantalla usado para calcular tamaños del dashboard y de la gráfica.
const screenWidth = Dimensions.get("window").width;

// URL base del backend para consultar el resumen general del dashboard.
const API_URL = process.env.EXPO_PUBLIC_API_URL;


const home = ({ route, navigation }) => {
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
    <View>
      {/* Cabecera superior con saludo al usuario y menú de acciones rápidas. */}
      <View
        style={{ width: "100%", height: "11%", backgroundColor: "#ffffff" }}
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={cargarDashboard} />
        }
      >
        {/* El contenido del resumen solo se muestra para roles distintos de Cliente. */}
        {rol !== "Cliente" && (
          <View
            style={styles.container}

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
                width={screenWidth - 60}
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

const styles = StyleSheet.create({

  // Estilos del menú flotante superior derecho.
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
// Estilos generales del encabezado y del dashboard.
  
  headerContainer: {
    position: "relative",
    top: 0,
    left: 0,
    right: 0,
    bottom: 5,
    backgroundColor: "#ffffff",
    paddingTop: 40,
    height: 99,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 5,
  },

  // Texto fijo del saludo del encabezado.
  textheader: {
    fontWeight: "500",
    padding: 10,
    color: "#069488",
    fontSize: 17,
  },

  // Nombre del usuario mostrado en el encabezado.
  textheader2: {
    fontWeight: "bold",
    fontSize: 22,
    color: "#069488",
  },

  // Contenedor principal del contenido del dashboard.
  container: {
    width: "100%",
    minHeight: screenWidth,
    backgroundColor: "#e4f5f3",
    paddingTop: 20,
    padding: 10,
    paddingBottom: 50,
  },

  // Título principal del resumen del panel.
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#069488",
  },

  // Tarjeta destacada para la métrica económica principal.
  mainBox: {
    backgroundColor: "#09caba",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },

  // Etiqueta pequeña dentro de la tarjeta principal.
  mainTitle: {
    color: "#ffffff",
    fontSize: 14,
    textTransform: "uppercase",
  },

  // Valor monetario principal mostrado en el dashboard.
  mainAmount: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "bold",
  },

  // Distribución en grilla para las tarjetas de métricas.
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  // Tarjeta pequeña individual de cada indicador.
  card: {
    backgroundColor: "#FFF",
    width: "48%",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 5,
  },

  // Contenedor del texto a la derecha del ícono en cada tarjeta métrica.
  info: {
    marginLeft: 10,
  },

  // Título de una tarjeta métrica pequeña.
  cardTitle: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
  },

  // Valor principal de una tarjeta métrica pequeña.
  cardValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
  },

  // Caja que contiene la gráfica circular y su título.
  chartBox: {
    backgroundColor: "#FFF",

    borderRadius: 20,
    padding: 15,
    marginBottom: 20,
    // MARGEN NEGATIVO para que suba y "pise" el azul
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
    zIndex: 2, // Asegura que esté por encima
  },

  // Título descriptivo de la gráfica.
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },

  // Estilos heredados para botones de acciones genéricas dentro del proyecto.
  btnRegistrar: {
    backgroundColor: "#29c268",
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

  // Estilo heredado para un botón de modificar.
  btnModificar: {
    backgroundColor: "#ff761a",
    width: 120,
    height: 50,
  },

  // Estilo heredado para un botón de anular.
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

  // Texto reutilizable de los botones verdes.
  btnRegisText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  reportPillWrapper: {
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  reportPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  reportPillAccent: {
    width: 8,
    height: 36,
    backgroundColor: "#0f766e",
    borderRadius: 8,
    marginRight: 10,
  },
  reportPillText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#064e3b",
  },
});

export default home;
