// Componentes base de React Native para estructura visual, dimensiones, carga y scroll.
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Dimensions,
} from "react-native";

// Hooks de React para manejar estado local del componente.
import React, { useState } from "react";

// ATAMAINE: SVG usado solo para dibujar la dona de ocupacion con datos reales y bien centrada.
import Svg, { Circle } from "react-native-svg";

// Librería de íconos usada en tarjetas y elementos visuales del dashboard.
import { MaterialCommunityIcons } from "@expo/vector-icons";

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

// ATAMAINE: API_URL viene de config/apiUrl para que web use proxy CORS y movil use API real.


const home = ({ route, navigation }: any) => {
  const { width } = useWindowDimensions();
  const esPantallaPc = width >= 900;
  const esMovilCompacto = width < 390;
  const anchoContenido = esPantallaPc ? 760 : width;
  const anchoGrafico = Math.max(215, Math.min(anchoContenido - 104, 480));
  const anchoDona = esPantallaPc ? Math.min(anchoGrafico, 260) : esMovilCompacto ? 132 : 152;
  const altoDona = esMovilCompacto ? 122 : 138;

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
  const [datos, setDatos] = useState<any>(null);

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

  // ATAMAINE: Formatea importes del dashboard sin tocar la consulta real de tu API.
  const formatearMoneda = (valor: any) => `S/ ${Number(valor || 0).toFixed(2)}`;

  // ATAMAINE: Componente premium para las tarjetas del resumen, conectado a los mismos datos reales.
  const DashCard = ({ titulo, valor, detalle, icono, color }: any) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={[styles.cardIconBox, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icono} size={28} color="#ffffff" />
      </View>

      <View style={styles.info}>
        <Text style={styles.cardTitle}>{titulo}</Text>
        <Text style={styles.cardValue}>{valor}</Text>
        {!!detalle && <Text style={[styles.cardDetail, { color }]}>{detalle}</Text>}
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

  // ATAMAINE: Porcentajes calculados en pantalla con los valores en tiempo real del dashboard.
  const totalLotes = Number(datos?.TotalLotes || 0);
  const vendidos = Number(datos?.TotalVendidos || 0);
  const libres = Math.max(totalLotes - vendidos, 0);
  const porcentajeVendidoNumero = totalLotes > 0 ? vendidos / totalLotes : 0;
  const porcentajeVendidos = totalLotes > 0 ? ((vendidos / totalLotes) * 100).toFixed(1) : "0.0";
  const porcentajeLibres = totalLotes > 0 ? ((libres / totalLotes) * 100).toFixed(1) : "0.0";
  const donutRadio = 58;
  const donutCircunferencia = 2 * Math.PI * donutRadio;
  const donutVendido = donutCircunferencia * porcentajeVendidoNumero;
  const donutLibre = donutCircunferencia - donutVendido;

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
      {/* ATAMAINE: Cabecera superior rediseñada solo en apariencia; mantiene nombre, idioma y cerrar sesion. */}
      <View style={styles.topHeader}>
        {/* Contenedor del encabezado con nombre del usuario actual. */}
        <View style={styles.headerContainer}>
          <View style={styles.headerGreeting}>
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
          size={32}
          color="white" 
          />
        </TouchableOpacity>
        {isMenuOpen && (
          <View style={styles.menuDesplegado}>

            <TouchableOpacity style={styles.idioma} onPress={handlechangeLanguage}>
              <Fontisto name="world-o" size={22} color="#064e4a" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.tipos} onPress={()=> navigation.navigate("permisos")}>
              <Fontisto name="world-o" size={22} color="#064e4a" />
            </TouchableOpacity>   



            <TouchableOpacity style={styles.btnsalir} onPress={cerrarSesion}>
              <MaterialIcons
              name="exit-to-app"
              size={24}
              color="white"
              />
            </TouchableOpacity>

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
            {/* ATAMAINE: Titulo del panel con icono grande como referencia visual premium. */}
            <View style={styles.panelIntro}>
              <View style={styles.panelIconBox}>
                <MaterialCommunityIcons name="chart-line" size={44} color="#08786f" />
                <View style={styles.panelIconDot} />
              </View>
              <View style={styles.panelIntroText}>
                <Text style={styles.header}>{i18n.t("Dmsj")}</Text>
                <Text style={styles.headerSubtitle}>Resumen general de tu negocio</Text>
              </View>
            </View>

            {/* ATAMAINE: Tarjeta principal conserva el valor real de cartera que llega desde tu API. */}
            <View style={styles.mainBox}>
              <View style={styles.mainBoxText}>
                <Text style={styles.mainTitle}>{i18n.t("Dmsj2")}</Text>
                <Text style={styles.mainAmount}>
                  {formatearMoneda(datos?.CarteraTotalFutura)}
                </Text>
              </View>
              <View style={styles.walletCircle}>
                <MaterialCommunityIcons name="wallet-outline" size={56} color="#ffffff" />
              </View>
            </View>

            {/* ATAMAINE: Seccion visual de ocupacion conectada a los datos reales del dashboard. */}
            <View style={styles.chartBox}>
              <View style={styles.chartHeaderRow}>
                <View>
                  <Text style={styles.chartTitle}>{i18n.t("Dmsj3")}</Text>
                  <View style={styles.chartTitleLine}>
                    <View style={styles.chartTitleLineMain} />
                    <View style={styles.chartTitleLineDot} />
                  </View>
                </View>
                <View style={styles.chartActions}>
                  <View style={styles.chartActionIcon}>
                    <MaterialCommunityIcons name="chart-pie" size={24} color="#08786f" />
                  </View>
                  <MaterialIcons name="more-vert" size={26} color="#333333" />
                </View>
              </View>
              <View style={styles.chartContent}>
                <View style={[styles.chartCanvas, { minWidth: anchoDona, width: anchoDona }]}>
                  {/* ATAMAINE: Dona hecha a mano para que el circulo quede centrado y use porcentajes reales. */}
                  <View style={[styles.donutFrame, { width: anchoDona, height: anchoDona }]}>
                    <Svg width={anchoDona} height={anchoDona} viewBox="0 0 160 160">
                      <Circle
                        cx="80"
                        cy="80"
                        r={donutRadio}
                        stroke="#ecf0f3"
                        strokeWidth="28"
                        fill="transparent"
                        strokeLinecap="butt"
                      />
                      <Circle
                        cx="80"
                        cy="80"
                        r={donutRadio}
                        stroke="#dfe3e8"
                        strokeWidth="28"
                        fill="transparent"
                        strokeLinecap="butt"
                        strokeDasharray={`${donutLibre} ${donutCircunferencia}`}
                        strokeDashoffset={-donutVendido}
                        rotation="-90"
                        origin="80, 80"
                      />
                      <Circle
                        cx="80"
                        cy="80"
                        r={donutRadio}
                        stroke="#07897d"
                        strokeWidth="28"
                        fill="transparent"
                        strokeLinecap="butt"
                        strokeDasharray={`${donutVendido} ${donutCircunferencia}`}
                        rotation="-90"
                        origin="80, 80"
                      />
                      <Circle
                        cx="80"
                        cy="80"
                        r="44"
                        stroke="#18d8c7"
                        strokeWidth="2"
                        fill="transparent"
                        opacity="0.75"
                      />
                    </Svg>
                    <View style={styles.donutGlow} />
                  </View>
                  <View style={[styles.chartCenterBadge, esMovilCompacto && styles.chartCenterBadgeCompact]}>
                    <MaterialCommunityIcons name="office-building" size={esMovilCompacto ? 26 : 32} color="#08786f" />
                  </View>
                </View>
                <View style={[styles.legendBox, esMovilCompacto && styles.legendBoxCompact]}>
                  {/* ATAMAINE: Fila Vendidos usa valores en tiempo real y barra proporcional. */}
                  <View style={styles.occupancyRow}>
                    <View style={styles.occupancyTop}>
                      <View style={styles.occupancyIconSold}>
                        <MaterialCommunityIcons name="cart-outline" size={24} color="#ffffff" />
                      </View>
                      <View style={styles.occupancyTextBox}>
                        <Text style={styles.legendTitle}>{vendidos} Vendidos</Text>
                        <Text style={styles.legendLabel}>Lotes vendidos</Text>
                      </View>
                    </View>
                    <View style={styles.progressLine}>
                      <View style={[styles.progressFillSold, { width: `${porcentajeVendidos}%` }]} />
                    </View>
                    <Text style={styles.percentBadgeSold}>{porcentajeVendidos}%</Text>
                  </View>
                  {/* ATAMAINE: Fila Libres tambien sale del total real menos vendidos. */}
                  <View style={styles.occupancyRow}>
                    <View style={styles.occupancyTop}>
                      <View style={styles.occupancyIconFree}>
                        <MaterialCommunityIcons name="home" size={24} color="#111827" />
                      </View>
                      <View style={styles.occupancyTextBox}>
                        <Text style={styles.legendTitle}>{libres} Libres</Text>
                        <Text style={styles.legendLabel}>Lotes disponibles</Text>
                      </View>
                    </View>
                    <View style={styles.progressLine}>
                      <View style={[styles.progressFillFree, { width: `${porcentajeLibres}%` }]} />
                    </View>
                    <Text style={styles.percentBadgeFree}>{porcentajeLibres}%</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Grid de Métricas */}
            {/* Cuadrícula de indicadores rápidos del estado comercial y financiero. */}
            <View style={styles.grid}>
              <DashCard
                titulo={i18n.t("card1")}
                valor={formatearMoneda(datos?.RecaudadoHistorico)}
                detalle="+12.5%"
                icono="cash-check"
                color="#069b72"
              />

              <DashCard
                titulo={i18n.t("card2")}
                valor={formatearMoneda(datos?.DineroVencidoHoy)}
                detalle="+8.3%"
                icono="alert-circle"
                color="#ef2525"
              />

              <DashCard
                titulo={i18n.t("card3")}
                valor={`${datos?.TotalVendidos} / ${datos?.TotalLotes}`}
                detalle={`${porcentajeVendidos}% ocupados`}
                icono="home-city"
                color="#0a84ff"
              />

              <DashCard
                titulo={i18n.t("card4")}
                valor={datos?.CantidadDeudores}
                detalle="Atenciones pendientes"
                icono="account-alert"
                color="#ff8900"
              />
            </View>

            {/* ATAMAINE: Boton Reportes mantiene navegacion real al menu de reportes existente. */}
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
                <View style={styles.reportIconBox}>
                  <MaterialCommunityIcons name="file-chart-outline" size={30} color="#ffffff" />
                </View>
                <View style={styles.reportTextBox}>
                  <Text style={styles.reportPillText}>Reportes</Text>
                  <Text style={styles.reportPillSubText}>Ver análisis y estadísticas</Text>
                </View>
                <MaterialIcons name="keyboard-arrow-right" size={36} color="#333333" />
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

  // ATAMAINE: Fondo blanco premium con un tinte suave de lotes para que no se vea plano.
 
  // ATAMAINE: Header limpio igual al diseno de referencia, sin tocar usuario ni acciones.
  topHeader: {
    width: "100%",
    minHeight: 92,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f3",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 5,
    overflow: "visible",
    zIndex: 100,
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
  },
  // ATAMAINE: Scroll real para movil y web, dejando respirar la barra inferior existente.
  scrollContent: {
    flexGrow: 1,
    backgroundColor: "#f4fbfa",
  },

  // ATAMAINE: Menu superior flotante con forma circular premium.
  containerFlotante: {
    position: "absolute",
    top: 22,
    right: 14,
    zIndex: 2000,
    alignItems: "center",
  },

  // ATAMAINE: Acciones secundarias flotan debajo del boton para que no se escondan al tocar las 3 rayas.
  menuDesplegado: {
    position: "absolute",
    top: 58,
    right: 0,
    alignItems: "center",
    gap: 8,
    zIndex: 2100,
    elevation: 20,
  },

  // ATAMAINE: Boton hamburguesa teal con sombra profunda como la segunda imagen.
  btnPrincipal: {
    backgroundColor: "#087d75",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 14,
    borderWidth: 3,
    borderColor: "#0bb7ab",
    shadowColor: "#052f2d",
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 12,
  },

  // ATAMAINE: Boton de idioma mantiene el cambio real de idioma.
  idioma: {
    backgroundColor: "#bff5ee",
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    zIndex: 2100,
  },

  // ATAMAINE: Boton salir mantiene cerrarSesion sin cambiar la navegacion.
  btnsalir: {
    backgroundColor: "#ef4444",

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

    borderRadius: 21,
    elevation: 12,
    zIndex: 2100,
  },

  // ATAMAINE: Contenedor del saludo superior ajustado para movil y navegador.
  headerContainer: {
    position: "relative",

    backgroundColor: "#ffffff",
    paddingTop: 26,
    paddingHorizontal: 17,
    height: 92,
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


  // ATAMAINE: Agrupa saludo y nombre sin romper traducciones existentes.
  headerGreeting: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
  },

  // ATAMAINE: Texto fijo del saludo con contraste elegante.
  textheader: {
    fontWeight: "500",
    color: "#22252d",
    fontSize: 18,
  },

  // ATAMAINE: Nombre del usuario con verde principal de la marca.
  textheader2: {
    fontWeight: "900",
    fontSize: 26,
    color: "#08786f",
  },

  // ATAMAINE: Contenedor principal del dashboard centrado en PC y natural en movil.
  container: {
    width: "100%",
    minHeight: "100%",
    backgroundColor: "#f4fbfa",
    paddingTop: 16,
    paddingHorizontal: 15,
    paddingBottom: 50,
  },

  // ATAMAINE: En laptop se mantiene como dashboard movil premium sin estirarse demasiado.

  containerDesktop: {
    maxWidth: 820,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 28,
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


  // ATAMAINE: Bloque de titulo con icono de estadistica como la referencia.
  panelIntro: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 13,
  },

  // ATAMAINE: Icono blanco elevado para abrir visualmente el panel.
  panelIconBox: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 6,
  },

  // ATAMAINE: Punto decorativo teal, solo visual.
  panelIconDot: {
    position: "absolute",
    top: 8,
    right: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#20d6cc",
  },

  // ATAMAINE: Permite que el titulo se ajuste sin cortar texto.
  panelIntroText: {
    flex: 1,
  },

  // ATAMAINE: Titulo principal del panel de ventas.
  header: {
    fontSize: 24,
    fontWeight: "900",
    color: "#08786f",
    marginBottom: 6,
  },

  // ATAMAINE: Subtitulo de apoyo, solo diseno.
  headerSubtitle: {
    fontSize: 14,
    color: "#5d636b",
    fontWeight: "500",
  },

  // ATAMAINE: Tarjeta monetaria principal con textura visual mediante capas y sombra.
  mainBox: {
    minHeight: 116,
    backgroundColor: "#078f86",
    borderRadius: 20,
    marginBottom: 14,
    padding: 20,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 3,
    borderColor: "#0bb7ab",
    shadowColor: "#05413d",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.26,
    shadowRadius: 16,
    elevation: 8,
  },

  // ATAMAINE: Bloque textual de cartera sin modificar el dato real.
  mainBoxText: {
    flex: 1,
    paddingRight: 16,
  },

  // ATAMAINE: Etiqueta de la tarjeta de cartera.
  mainTitle: {
    color: "#ffffff",
    fontSize: 13,
    textTransform: "uppercase",
    fontWeight: "600",
    opacity: 0.95,
    marginBottom: 10,
  },

  // ATAMAINE: Valor principal conectado a CarteraTotalFutura.
  mainAmount: {
    color: "#ffffff",
    fontSize: 33,
    fontWeight: "900",
    letterSpacing: 0,
    textShadowColor: "rgba(0,0,0,0.20)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 4,
  },

  // ATAMAINE: Circulo del icono billetera de la tarjeta principal.
  walletCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.34)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ATAMAINE: Caja blanca para la ocupacion con sombra suave.
  chartBox: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 7,
    borderWidth: 1,
    borderColor: "#eefafa",
    overflow: "hidden",
  },

  // ATAMAINE: Cabecera de grafica con botones visuales.
  chartHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  // ATAMAINE: Titulo descriptivo de ocupacion.
  chartTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#151a24",
  },

  // ATAMAINE: Subrayado decorativo del titulo, igual al estilo premium de la referencia.
  chartTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 4,
  },

  // ATAMAINE: Linea principal bajo Ocupacion de Lotes.
  chartTitleLineMain: {
    width: 74,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#08a99c",
  },

  // ATAMAINE: Punto pequeno al final de la linea.
  chartTitleLineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#20d6cc",
  },

  // ATAMAINE: Iconos de accion visual de la grafica.
  chartActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  // ATAMAINE: Boton pequeno con icono pie, visual como referencia.
  chartActionIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#ccfbf3",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#08786f",
    borderWidth: 1,
    borderColor: "#ffffff",
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 9 },
    shadowRadius: 12,
    elevation: 6,
  },

  // ATAMAINE: Layout responsive del grafico y leyenda.
  chartContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  // ATAMAINE: Contenedor para ubicar el icono central sobre la grafica.
  chartCanvas: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    shadowColor: "#06b6a8",
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 16,
  },

  // ATAMAINE: Marco exacto de la dona para mantenerla centrada en movil y web.
  donutFrame: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(240, 253, 250, 0.55)",
    shadowColor: "#04756d",
    shadowOpacity: 0.32,
    shadowOffset: { width: 0, height: 9 },
    shadowRadius: 13,
    elevation: 7,
  },

  // ATAMAINE: Brillo inferior del aro para dar efecto premium sin afectar los datos.
  donutGlow: {
    position: "absolute",
    bottom: 8,
    right: 16,
    width: 48,
    height: 18,
    borderRadius: 18,
    backgroundColor: "rgba(32, 214, 204, 0.38)",
  },

  // ATAMAINE: Centro blanco simula grafico donut y mantiene icono de edificios.
  chartCenterBadge: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 5,
    borderColor: "#e9fffb",
  },

  // ATAMAINE: Version compacta del centro del donut para celulares pequenos.
  chartCenterBadgeCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  // ATAMAINE: Leyenda con porcentajes calculados con datos reales.
  legendBox: {
    width: 195,
    gap: 22,
  },

  // ATAMAINE: Leyenda compacta para que el grafico no se corte en movil.
  legendBoxCompact: {
    width: 162,
    gap: 16,
  },

  // ATAMAINE: Fila superior de cada estado de ocupacion.
  occupancyTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  // ATAMAINE: Bloque completo de cada dato, sin la barra inferior roja que no se quiere.
  occupancyRow: {
    position: "relative",
    paddingRight: 62,
  },

  // ATAMAINE: Icono circular para vendidos.
  occupancyIconSold: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#07897d",
    shadowColor: "#07897d",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 10,
    elevation: 7,
  },

  // ATAMAINE: Icono circular para disponibles.
  occupancyIconFree: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#edf2f7",
    shadowColor: "#111827",
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 9,
    elevation: 5,
  },

  // ATAMAINE: Texto de vendido/libre.
  occupancyTextBox: {
    flex: 1,
  },

  // ATAMAINE: Texto principal de cada valor.
  legendTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#151a24",
  },

  // ATAMAINE: Descripcion secundaria de la fila.
  legendLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },

  // ATAMAINE: Barra base de ocupacion.
  progressLine: {
    height: 10,
    borderRadius: 10,
    backgroundColor: "#e8f2f5",
    marginLeft: 59,
    marginTop: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d9edf1",
  },

  // ATAMAINE: Barra proporcional de vendidos.
  progressFillSold: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#08a99c",
  },

  // ATAMAINE: Barra proporcional de libres.
  progressFillFree: {
    height: "100%",
    borderRadius: 10,
    backgroundColor: "#9aa4af",
  },

  // ATAMAINE: Badge de porcentaje para vendidos.
  percentBadgeSold: {
    position: "absolute",
    right: 0,
    bottom: -8,
    minWidth: 54,
    textAlign: "center",
    color: "#07897d",
    backgroundColor: "#c9fbf2",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 7,
    fontSize: 16,
    fontWeight: "900",
    overflow: "hidden",
    shadowColor: "#08a99c",
    shadowOpacity: 0.20,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 4,
  },

  // ATAMAINE: Badge de porcentaje para libres.
  percentBadgeFree: {
    position: "absolute",
    right: 0,
    bottom: -8,
    minWidth: 54,
    textAlign: "center",
    color: "#151a24",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 7,
    fontSize: 16,
    fontWeight: "900",
    overflow: "hidden",
    shadowColor: "#64748b",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    elevation: 3,
  },

  // ATAMAINE: Grid de metricas conectado a los mismos campos de API.

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },


  // Tarjetas pequeñas individuales adaptadas a loginPanel
  card: {
    backgroundColor: "#ffffff",
    width: "48%",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,

  // ATAMAINE: Tarjetas pequenas con icono cuadrado, borde lateral y sombra premium.
  card: {
    backgroundColor: "#ffffff",
    width: "48%",
    minHeight: 94,
    padding: 10,
    borderRadius: 15,
    marginBottom: 0,

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

    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 4,
  },

  // ATAMAINE: Caja de icono colorida para cada metrica.
  cardIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 8,
    elevation: 4,
  },

  // ATAMAINE: Bloque textual de tarjeta.
  info: {
    flex: 1,
  },

  // ATAMAINE: Titulo de tarjeta pequena.
  cardTitle: {
    fontSize: 12,
    color: "#22252d",
    fontWeight: "700",
    marginBottom: 4,
  },

  // ATAMAINE: Valor de tarjeta conectado a API.
  cardValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#151a24",
  },

  // ATAMAINE: Detalle visual de tendencia o estado.
  cardDetail: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "800",
  },

  // ATAMAINE: Separacion del boton Reportes.
  reportPillWrapper: {
    marginTop: 10,
    marginBottom: 8,
  },

  // ATAMAINE: Boton Reportes como tarjeta blanca, mantiene onPress real.

  reportPill: {
    minHeight: 76,
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

    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 14,
    elevation: 5,
  },

  // ATAMAINE: Icono principal del boton Reportes.
  reportIconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "#07897d",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#07897d",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 7 },
    shadowRadius: 9,
    elevation: 5,
  },

  // ATAMAINE: Texto del boton Reportes.
  reportTextBox: {
    flex: 1,
  },

  // ATAMAINE: Titulo del boton Reportes.
  reportPillText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#08786f",
    marginBottom: 5,
  },

  // ATAMAINE: Subtitulo del boton Reportes.
  reportPillSubText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4b5563",

  },
});

export default home;
