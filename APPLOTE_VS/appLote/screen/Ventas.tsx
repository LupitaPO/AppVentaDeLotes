import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Dimensions
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// imports para idiomas 
import Fontisto from "@expo/vector-icons/Fontisto";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import i18n, { changeLanguage } from "../i18n";
import { Languages } from "../localizacion";
///////////////////////////////////////////////////

///import para imprimr reporte de cronograma///////
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
//////////////////////////////////////////////////

// Alto disponible de la ventana para calcular tamaños proporcionales en la UI.
const { height } = Dimensions.get('window');

// URL base del backend donde se consultan ventas, clientes y cronograma.
const API_URL = "http://www.tulote.somee.com";


const Ventas = ({ navigation, route }) => {

  // funcion de idiomas //////////////////////////////////////////////

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [language, setlanguage] = useState<Languages>("es");
  const handlechangeLanguage = () => {
    const lang: Languages = language === "en" ? "es" : "en";
    changeLanguage(lang);
    setlanguage(lang);
  }

  //////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////
  // Estado para abrir o cerrar el modal con el detalle del cronograma.
  const [modalVisible, setModalVisible] = useState(false);

  // Guarda la venta elegida localmente para mostrar sus datos en el modal y en el PDF.
  const [selectedVentaLocal, setSelectedVentaLocal] = useState(null);

  // Maneja el toque sobre una venta: la guarda, actualiza el cronograma filtrado y abre el modal.
  const manejarSeleccion = (venta) => {
    setSelectedVentaLocal(venta);
    seleccionarVenta(venta);
    setModalVisible(true);
  };


  // Obtiene la altura de la barra inferior para respetar espacios del layout si fuera necesario.
  const tabBarHeight = useBottomTabBarHeight();

  // Recibe el id del usuario autenticado desde los parámetros de navegación.
  const { idUsuario } = route.params || {};

  // Lista de ventas del usuario actual.
  const [ventas, setVentas] = useState([]);

  // Controla el spinner principal mientras se consultan las ventas.
  const [cargando, setCargando] = useState(true);

  // Venta actualmente seleccionada para filtrar el cronograma.
  const [selectedVenta, setSelectedVenta] = useState(null);

  // Lista completa del cronograma recuperado desde el backend.
  const [cronogramaTodos, setCronogramaTodos] = useState([]);

  // Lista de cuotas filtradas según la venta seleccionada.
  const [cronograma, setCronograma] = useState([]);

  // Controla el spinner interno del modal mientras se procesa el cronograma.
  const [cargandoCronograma, setCargandoCronograma] = useState(false);

  // Catálogo de clientes para resolver el nombre completo a partir del IdCliente.
  const [listaClientes, setListaClientes] = useState([]);

  // Normaliza diferentes posibles nombres de propiedad para obtener el id de una venta.
  const obtenerIdVenta = (venta) => {
    return venta?.IdVenta ?? venta?.idVenta ?? venta?.Id ?? venta?.id;
  };

  ///////////////////////////////////////////////////////////////////////////////
  //funcion para obtener el nombre del cliente ///////////////////////
  // Consulta la lista de clientes desde la API y la guarda en memoria local.
  const cargarClientes = async () => {
    try {
      const response = await fetch(`${API_URL}/Cliente/cliente_Listar`);
      const data = await response.json();
      setListaClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    }
  };

  // Busca el nombre completo del cliente usando su identificador.
  const obtenerNombreCliente = (idCliente) => {
    if (!idCliente) return "Sin ID";
    if (!idCliente || listaClientes.length === 0) return "Cargando...";

    const cliente = listaClientes.find(
      (c) => (c.IdCliente || c.idCliente)?.toString() === idCliente.toString()
    );

    if (cliente) {
      // Juntamos todos los campos en un array, filtramos los que estén vacíos y los unimos con un espacio
      const nombreCompleto = [
        cliente.Nombre1,
        cliente.Nombre2,
        cliente.Apaterno,
        cliente.Amaterno
      ]
        .filter(parte => parte && parte.toString().trim() !== "") // Quita nulos o vacíos
        .join(" "); // Los une con un espacio

      return nombreCompleto || "Sin Nombre";
    }

    return "No encontrado";
  };;

  // 3. EFECTOS (Ahora sí pueden llamar a las funciones de arriba)
  // Al iniciar la pantalla o cambiar de usuario, carga ventas, cronograma y clientes.
  useEffect(() => {
    const inicializar = async () => {
      await cargarDatosIniciales();
      await cargarClientes(); // <--- Ahora ya existe y no dará undefined
    };
    inicializar();
  }, [idUsuario]);
  //////////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////////////////
  // Recupera las ventas del sistema y filtra solo las que pertenecen al usuario actual.
  const cargarVentas = async () => {
    try {
      setCargando(true);
      const response = await fetch(`${API_URL}/Venta/venta_Listar`);
      const data = await response.json();
      const ventasUsuario = Array.isArray(data)
        ? data.filter(
          (venta) =>
            venta.IdUsuario?.toString() === idUsuario?.toString() ||
            venta.idUsuario?.toString() === idUsuario?.toString(),
        )
        : [];
      setVentas(ventasUsuario);
      return ventasUsuario;
    } catch (error) {
      console.error("Error al cargar ventas:", error);
      Alert.alert("Error", "No se pudo cargar el listado de ventas.");
      return [];
    } finally {
      setCargando(false);
    }
  };

  // Carga el cronograma relacionado al usuario y adapta la respuesta si viene en distintos formatos.
  const cargarCronogramaUsuario = async () => {
    try {
      setCargandoCronograma(true);

      const response = await fetch(`${API_URL}/Cronograma/cronograma_ListarPorVenta/${idUsuario}`);

      // Leemos la respuesta como texto primero para evitar errores de parseo
      const textoRespuesta = await response.text();

      if (response.ok && textoRespuesta) {
        const data = JSON.parse(textoRespuesta);

        // SI EL PROBLEMA ES EL ARRAY, HACEMOS ESTA DOBLE VERIFICACIÓN:
        let listaFinal = [];
        if (Array.isArray(data)) {
          listaFinal = data;
        } else if (data && typeof data === 'object' && data.Table) {
          // A veces los DataTables de C# vienen envueltos en una propiedad "Table"
          listaFinal = data.Table;
        }

        setCronogramaTodos(listaFinal);
        return listaFinal;
      } else {
        setCronogramaTodos([]);
        return [];
      }
    } catch (error) {
      console.error("Error procesando cronograma:", error);
      setCronogramaTodos([]);
    } finally {
      setCargandoCronograma(false);
    }
  };


  // Filtra las cuotas del cronograma para quedarnos solo con las de una venta concreta.
  const filtrarCronogramaPorVenta = (venta, lista = cronogramaTodos) => {
    if (!venta || !lista || lista.length === 0) return [];
    const idVentaSeleccionada = obtenerIdVenta(venta)?.toString();
    return lista.filter(
      (item) =>
        item.IdVenta?.toString() === idVentaSeleccionada ||
        item.idVenta?.toString() === idVentaSeleccionada,
    );
  };

  // Carga en paralelo ventas y cronograma, y deja una venta seleccionada por defecto si existe.
  const cargarDatosIniciales = async () => {
    if (!idUsuario) return;
    const [ventasUsuario, cronogramaPorUsuario] = await Promise.all([
      cargarVentas(),
      cargarCronogramaUsuario(),
    ]);

    if (ventasUsuario.length > 0) {
      const ventaInicial = ventasUsuario[0];
      setSelectedVenta(ventaInicial);
      setCronograma(filtrarCronogramaPorVenta(ventaInicial, cronogramaPorUsuario));
    }
  };

  // Vuelve a inicializar los datos cuando cambie el usuario recibido por navegación.
  useEffect(() => {
    cargarDatosIniciales();
  }, [idUsuario]);

  // Actualiza la venta activa y refresca la lista de cuotas visibles en pantalla.
  const seleccionarVenta = (venta) => {
    setSelectedVenta(venta);
    setCronograma(filtrarCronogramaPorVenta(venta));
  };
  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  //Aqui se genera los PDF ///////////////////////////////////////////////////////////////////////////////
  // Genera un PDF con el cronograma visible de la venta seleccionada y lo comparte.
  const generarPDF = async () => {
    if (!cronograma || cronograma.length === 0) {
      Alert.alert("Aviso", "No hay cuotas cargadas para generar el PDF.");
      return;
    }
    const nombreParaPDF = obtenerNombreCliente(selectedVentaLocal?.IdCliente);

    const html = `
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="text-align: center; color: #069488;">Cronograma de Pagos</h1>
        <p><strong>Lote:</strong> ${selectedVentaLocal?.IdLote || 'N/A'}</p>
        <p><strong>Nombre de Cliente:</strong> ${nombreParaPDF}</p>
        <hr/>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #069488; color: white;">
              <th style="border: 1px solid #ddd; padding: 10px;">Cuota</th>
              <th style="border: 1px solid #ddd; padding: 10px;">Vencimiento</th>
              <th style="border: 1px solid #ddd; padding: 10px;">Monto</th>
              <th style="border: 1px solid #ddd; padding: 10px;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${cronograma.map((item, i) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${i + 1}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.FechaVencimiento}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">$${item.MontoCuota}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: center; color: ${item.EstadoCuota === 'Pagado' ? 'green' : 'orange'};">
                  ${item.EstadoCuota}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Error", "No se pudo generar el PDF.");
    }
  };
  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  /// funcion para cerra sesion //////////////////////////////////////////////////////////////////////////

  // Reinicia el historial de navegación y envía al usuario a la pantalla de login.
  const cerrarSesion = () => {
    // Simplemente redirigimos y reseteamos el historial
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }], // Cambia 'Login' por el nombre exacto de tu pantalla inicial
    });
  };
  /////////////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <View style={styles.mainContainer}>
      {/* Contenedor principal de la lista de ventas del usuario. */}
      {/* --- LISTA DE VENTAS (CONTENEDOR FIJO) --- */}
      <View style={styles.ventasContainer}>
        {/* Encabezado visual de la pantalla. */}
        <View style={styles.header}>
          <Text style={styles.title}>Mis Ventas</Text>
          <MaterialCommunityIcons name="sign-real-estate" size={28} color="#069488" />
        </View>
        {/* ///////////////////////////////////////////////////////////////////////////////////////// */}
        {/* funcion de boton desplegable patra idioma y exit */}

        {/* Menú flotante para acciones rápidas: idioma y cerrar sesión. */}
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
        <Text style={styles.sectionTitle}>Toca una venta para ver el cronograma</Text>

        {/* Lista desplazable con todas las ventas asociadas al usuario. */}
        <ScrollView
          style={styles.scrollVentas}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {cargando ? (
            <ActivityIndicator size="large" color="#069488" />
          ) : ventas.length === 0 ? (
            <Text style={styles.emptyText}>No hay ventas registradas.</Text>
          ) : (
            ventas.map((venta, index) => (
              /* Cada tarjeta representa una venta y al tocarla se abre su cronograma. */
              <TouchableOpacity
                key={index}
                style={styles.card}
                onPress={() => manejarSeleccion(venta)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.loteInfo}>
                    <MaterialCommunityIcons name="map-marker-radius" size={20} color="#069488" />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.cardLabel}>LOTE</Text>
                      <Text style={styles.cardValue}>{venta.Manzana}{venta.NumeroLote}</Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>${venta.PrecioVenta ?? "0.00"}</Text>
                    <Text style={styles.subtext}>Cliente       : {obtenerNombreCliente(venta.IdCliente)}</Text>
                    <Text style={styles.subtext}>Tipo Venta: {venta.TipoVenta}</Text>
                    <Text style={styles.subtext}>Tipo pago : {venta.TipoPago}</Text>
                    <Text style={styles.subtext}>Inicial        : {venta.MontoInicial}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{venta.Estadoventa ?? "Activo"}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

      </View>


      {/* Indicador visual inferior para invitar a deslizar la lista. */}
      {/* PIE DE PÁGINA (OPCIONAL) */}
      <View style={styles.footerHint}>
        <MaterialCommunityIcons name="gesture-swipe-up" size={20} color="#999" />
        <Text style={styles.footerText}>Desliza para ver más lotes</Text>
      </View>

      

      <View style={styles.ctnbtn}>
        <TouchableOpacity onPress={()=> navigation.navigate("RegistrarVenta")} style={styles.btnregistrar}>
          <Text style={{color:"#fff",fontWeight:"bold"}}>REGISTRAR VENTA</Text>
        </TouchableOpacity>
      </View>

      {/* Modal inferior donde se muestran las cuotas de la venta seleccionada. */}
      {/* --- MODAL DEL CRONOGRAMA --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Cronograma de Pagos</Text>
                <Text style={styles.modalSubtitle}>Lote: {selectedVentaLocal?.IdLote}</Text>
              </View>
              <TouchableOpacity onPress={generarPDF}>
                <MaterialIcons name="print" size={28} color="#069488" />
              </TouchableOpacity>
              <Pressable onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close-circle" size={32} color="#ff5252" />
              </Pressable>
            </View>

            {cargandoCronograma ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#069488" />
              </View>
            ) : (
              /* Grilla de cuotas del cronograma; cada cuota puede abrir el detalle de pago. */
              <ScrollView contentContainerStyle={styles.modalScroll}>
                <View style={styles.grid}>
                  {cronograma.map((item, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.miniCard}
                      onPress={() => {
                        // Cierra primero el modal antes de navegar a la pantalla del detalle.
                        setModalVisible(false); // Cierra el modal actual

                        // validacion para evitar q se ingrese a pagar un monto que ya este pagado 
                        if (item.EstadoCuota === "Pagado") {
                          alert("Esta cuota ya esta pagada.")
                        } else {
                          navigation.navigate("DetallePago", { cuota: item, onRefresh: () => cargarDatosIniciales() }); // Te lleva a la nueva pantalla
                        }
                      }}
                    >
                      <View style={styles.cuotaHeader}>
                        <Text style={styles.cuotaTitle}>Cuota {i + 1}</Text>
                        <MaterialCommunityIcons
                          name={item.EstadoCuota === 'Pagado' ? "check-decagram" : "clock-outline"}
                          size={16}
                          color={item.EstadoCuota === 'Pagado' ? "#27ae60" : "#f39c12"}
                        />
                      </View>
                      <Text style={styles.cuotaMonto}>${item.MontoCuota}</Text>
                      <Text style={styles.cuotaFecha}>{item.FechaVencimiento}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { height: screenHeight } = Dimensions.get("window");
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

  // Estilos base de la pantalla principal y tarjetas de ventas
  mainContainer: { 
    flex: 1, 
    backgroundColor: "#f4fcfb" // Fondo premium unificado suave
  },
  ventasContainer: {
    height: screenHeight * 0.8, // Usa screenHeight de forma segura
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: 50,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(6, 148, 136, 0.08)",
    elevation: 6,
    shadowColor: '#087c72',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '900', // Tipografía robusta idéntica al login y home
    color: '#111827' 
  },
  sectionTitle: { 
    fontSize: 13.5, 
    color: '#64748b', 
    fontWeight: "600",
    marginBottom: 15 
  },
  scrollVentas: { 
    flex: 1 
  },
  scrollContent: { 
    paddingBottom: 20 
  },

  // Tarjetas del listado estilizadas como el loginPanel/cards
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 148, 136, 0.08)',
    borderLeftWidth: 5,
    borderLeftColor: "#069488", // Distintivo de marca esmeralda
    shadowColor: "#087c72",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  loteInfo: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  cardLabel: { 
    fontSize: 11, 
    color: '#64748b', 
    fontWeight: '700',
    textTransform: "uppercase"
  },
  cardValue: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#111827' 
  },

  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end' 
  },
  priceText: { 
    fontSize: 18, 
    fontWeight: '900', 
    color: '#069488' 
  },
  subtext: { 
    fontSize: 12, 
    color: '#64748b',
    fontWeight: '500'
  },
  badge: { 
    backgroundColor: '#e8fff8', // Verde menta muy sutil y limpio
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 8 
  },
  badgeText: { 
    color: '#069488', 
    fontSize: 12, 
    fontWeight: '800' 
  },

  // Texto guía inferior
  footerHint: { 
    alignItems: 'center', 
    marginTop: 20, 
    opacity: 0.5 
  },
  footerText: { 
    fontSize: 12, 
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4 
  },

  // Modal y Cronograma premium
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.4)', // Fondo oscuro suavizado
    justifyContent: 'flex-end' 
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '75%',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(6, 148, 136, 0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 15
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: '900', 
    color: '#111827' 
  },
  modalSubtitle: { 
    fontSize: 14, 
    color: '#069488', 
    fontWeight: '800' 
  },
  modalScroll: { 
    paddingBottom: 30 
  },
  grid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  
  // Mini tarjetas de cuotas refinadas
  miniCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(6, 148, 136, 0.08)',
    borderLeftWidth: 4,
    borderLeftColor: '#09caba', // Sub-acento turquesa limpio
    elevation: 3,
    shadowColor: '#087c72',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  cuotaHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 5 
  },
  cuotaTitle: { 
    fontSize: 10.5, 
    color: '#64748b', 
    fontWeight: '700', 
    textTransform: 'uppercase' 
  },
  cuotaMonto: { 
    fontSize: 17, 
    fontWeight: '900', 
    color: '#111827' 
  },
  cuotaFecha: { 
    fontSize: 12, 
    color: '#94a3b8', 
    fontWeight: '500',
    marginTop: 4 
  },
  modalLoading: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  label: { 
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 16
  },
  
  // Botón registrar adaptado al diseño de botones del Login
  btnregistrar: { 
    width: "85%", 
    height: 52, 
    backgroundColor: "#069488", // Verde éxito unificado
    justifyContent: "center", 
    alignItems: "center",
    borderRadius: 12,
    shadowColor: "#069488",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  ctnbtn: { 
    marginTop: 24, // Cambiado top por un margen relativo limpio para evitar desbordes
    alignItems: "center",
    width: "100%"
  }
});

export default Ventas