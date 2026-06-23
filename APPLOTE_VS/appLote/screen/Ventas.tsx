import React, { useEffect, useRef, useState } from "react";
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
  Platform
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// imports para idiomas 
import Fontisto from "@expo/vector-icons/Fontisto";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import i18n, { changeLanguage } from "../i18n";
import { Languages } from "../localizacion";
import { API_URL } from "../config/apiUrl";
import { WebListHeader } from "../components/web-list-layout";
///////////////////////////////////////////////////

/// Utilidad multiplataforma para imprimir el cronograma. ///////
import { compartirPdf } from '../utils/pdf';
//////////////////////////////////////////////////

const REQUEST_TIMEOUT_MS = 15000;

// Adapta las respuestas de la API, que pueden llegar como arreglo o dentro de Table/data.
const extraerListaApi = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.Table)) return data.Table;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

// Evita que una conexión lenta deje la pantalla cargando indefinidamente.
const consultarListaApi = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const texto = await response.text();

    if (!response.ok) {
      throw new Error(`La API respondió con estado ${response.status}.`);
    }

    if (!texto.trim()) return [];
    return extraerListaApi(JSON.parse(texto));
  } finally {
    clearTimeout(timeout);
  }
};


const Ventas = ({ navigation, route }) => {
  const esWeb = Platform.OS === "web";

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

  // El reporte envía cliente y venta; el acceso normal a la pestaña conserva idUsuario.
  const {
    idUsuario,
    ventaSeleccionadaId,
    clienteSeleccionadoId,
    clienteSeleccionadoNombre,
    origenReporteCobranzas = false,
    origenReportePagos = false,
    abrirCronogramaParaPago = false,
    solicitudNuevoPago = 0,
  } = route.params || {};
  const esVistaCobranzasCliente = Boolean(origenReporteCobranzas && clienteSeleccionadoId);
  const esVistaPagosCliente = Boolean(origenReportePagos && clienteSeleccionadoId);
  const esVistaReporteCliente = esVistaCobranzasCliente || esVistaPagosCliente;

  // Lista de ventas del usuario actual.
  const [ventas, setVentas] = useState([]);
  const pagoAutoAbiertoRef = useRef("");

  // Controla el spinner principal mientras se consultan las ventas.
  const [cargando, setCargando] = useState(true);

  // Mensaje visible cuando la API no responde o devuelve un formato inesperado.
  const [errorCarga, setErrorCarga] = useState("");

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

  const obtenerIdClienteVenta = (venta) => venta?.IdCliente ?? venta?.idCliente;
  const obtenerIdUsuarioVenta = (venta) => venta?.IdUsuario ?? venta?.idUsuario;

  ///////////////////////////////////////////////////////////////////////////////
  //funcion para obtener el nombre del cliente ///////////////////////
  // Consulta la lista de clientes desde la API y la guarda en memoria local.
  const cargarClientes = async () => {
    try {
      const clientesApi = await consultarListaApi(`${API_URL}/Cliente/cliente_Listar`);
      setListaClientes(clientesApi);
      return clientesApi;
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setListaClientes([]);
      return [];
    }
  };

  // Busca el nombre completo del cliente usando su identificador.
  const obtenerNombreCliente = (idCliente) => {
    if (!idCliente) return "Sin cliente";
    if (listaClientes.length === 0) return `Cliente ${idCliente}`;

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

  //////////////////////////////////////////////////////////////////////////////////////////
  // Recupera ventas y prioriza el filtro de cliente cuando se llega desde cobranzas.
  const cargarVentas = async () => {
    const ventasApi = await consultarListaApi(`${API_URL}/Venta/venta_Listar`);
    const ventasFiltradas = clienteSeleccionadoId
      ? ventasApi.filter(
        (venta) => obtenerIdClienteVenta(venta)?.toString() === clienteSeleccionadoId.toString(),
      )
      : ventasApi.filter(
        (venta) => obtenerIdUsuarioVenta(venta)?.toString() === idUsuario?.toString(),
      );

    // La venta pulsada queda primero, seguida por las demás compras del mismo cliente.
    ventasFiltradas.sort((a, b) => {
      if (obtenerIdVenta(a)?.toString() === ventaSeleccionadaId?.toString()) return -1;
      if (obtenerIdVenta(b)?.toString() === ventaSeleccionadaId?.toString()) return 1;
      return Number(obtenerIdVenta(b) ?? 0) - Number(obtenerIdVenta(a) ?? 0);
    });

    setVentas(ventasFiltradas);
    return ventasFiltradas;
  };

  // La API solicita IdUsuario y devuelve sus cronogramas; luego filtramos por IdVenta.
  const cargarCronogramaUsuario = async (idUsuarioVenta) => {
    if (!idUsuarioVenta) return [];
    const lista = await consultarListaApi(
      `${API_URL}/Cronograma/cronograma_ListarPorVenta/${idUsuarioVenta}`,
    );
    setCronogramaTodos(lista);
    return lista;
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
    setCargando(true);
    setErrorCarga("");

    try {
      const [ventasVisibles] = await Promise.all([cargarVentas(), cargarClientes()]);
      const ventaInicial = ventasVisibles[0] ?? null;
      setSelectedVenta(ventaInicial);
      setSelectedVentaLocal(null);
      setCronograma([]);
      setCronogramaTodos([]);
    } catch (error) {
      console.error("Error al cargar ventas:", error);
      setVentas([]);
      setErrorCarga(
        error?.name === "AbortError"
          ? "La API tardó demasiado en responder. Intenta nuevamente."
          : "No se pudo cargar el listado de ventas. Revisa tu conexión e intenta nuevamente.",
      );
    } finally {
      setCargando(false);
    }
  };

  // Reacciona también cuando se pulsa otro cliente/venta desde ReporteCobranzas.
  useEffect(() => {
    cargarDatosIniciales();
  }, [idUsuario, clienteSeleccionadoId, ventaSeleccionadaId]);

  // Abre la cobranza exacta consultando el cronograma del usuario dueño de esa venta.
  const manejarSeleccion = async (venta) => {
    setSelectedVenta(venta);
    setSelectedVentaLocal(venta);
    setCronograma([]);
    setModalVisible(true);
    setCargandoCronograma(true);

    try {
      const idUsuarioDeVenta = obtenerIdUsuarioVenta(venta) ?? idUsuario;
      const cronogramasUsuario = await cargarCronogramaUsuario(idUsuarioDeVenta);
      setCronograma(filtrarCronogramaPorVenta(venta, cronogramasUsuario));
    } catch (error) {
      console.error("Error procesando cronograma:", error);
      setCronogramaTodos([]);
      Alert.alert("Cronograma no disponible", "No se pudo consultar la cobranza de esta venta.");
    } finally {
      setCargandoCronograma(false);
    }
  };

  useEffect(() => {
    if (!abrirCronogramaParaPago || cargando || !ventas.length) return;
    const ventaParaPago = ventas.find(
      (venta) => obtenerIdVenta(venta)?.toString() === ventaSeleccionadaId?.toString(),
    ) ?? ventas[0];
    const claveVenta = obtenerIdVenta(ventaParaPago)?.toString() ?? "";
    const claveSolicitud = `${claveVenta}:${solicitudNuevoPago}`;
    if (!claveVenta || pagoAutoAbiertoRef.current === claveSolicitud) return;

    // ATAMAINE: Nuevo Pago abre una sola vez el cronograma de la venta enviada.
    pagoAutoAbiertoRef.current = claveSolicitud;
    void manejarSeleccion(ventaParaPago);
  }, [abrirCronogramaParaPago, solicitudNuevoPago, cargando, ventas, ventaSeleccionadaId]);
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
      // En web abre el diálogo de impresión; en móvil mantiene el PDF compartible.
      await compartirPdf({ html, titulo: 'Cronograma de pagos' });
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

  const nombreClienteVista = esVistaReporteCliente
    ? obtenerNombreCliente(clienteSeleccionadoId) || clienteSeleccionadoNombre || `Cliente ${clienteSeleccionadoId}`
    : "";

  // Conserva una sola accion de navegacion para el boton superior web y el inferior movil.
  const abrirAccionPrincipal = () => {
    if (esVistaReporteCliente) {
      navigation.getParent()?.navigate(esVistaPagosCliente ? "ReportePagos" : "ReporteCobranzas");
      return;
    }

    const idUsuarioLogueado = route.params?.idUsuario || obtenerIdUsuarioVenta(ventas[0]);
    if (!idUsuarioLogueado) {
      Alert.alert("Usuario requerido", "No se pudo identificar al usuario que registra la venta.");
      return;
    }

    navigation.navigate("RegistrarVenta", {
      idUsuario: idUsuarioLogueado,
      onRefresh: cargarDatosIniciales,
    });
  };

  return (
    <View style={[styles.mainContainer, esWeb && styles.mainContainerWeb]}>
      {/* Contenedor principal de la lista de ventas del usuario. */}
      {/* --- LISTA DE VENTAS (CONTENEDOR FIJO) --- */}
      <View style={[styles.ventasContainer, esWeb && styles.ventasContainerWeb]}>
        {/* En web unifica el encabezado y la accion; movil conserva su diseño original. */}
        {esWeb ? (
          <WebListHeader
            embedded
            title={esVistaPagosCliente ? "Pagos del cliente" : esVistaCobranzasCliente ? "Cobranzas del cliente" : "Gestión de Ventas"}
            subtitle={esVistaReporteCliente ? `Compras y cronogramas de ${nombreClienteVista}` : "Consulta ventas, clientes y cronogramas desde un solo lugar."}
            count={ventas.length}
            actionLabel={esVistaPagosCliente ? "Regresar a Pagos" : esVistaCobranzasCliente ? "Regresar a Cobranzas" : "Registrar Venta"}
            actionIcon={esVistaReporteCliente ? "arrow-left" : "plus-circle-outline"}
            onAction={abrirAccionPrincipal}
          />
        ) : (
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{esVistaPagosCliente ? "Pagos del cliente" : esVistaCobranzasCliente ? "Cobranzas del cliente" : "Mis Ventas"}</Text>
              <Text style={styles.headerEyebrow}>{esVistaReporteCliente ? "COMPRAS Y CRONOGRAMAS" : "GESTIÓN DE VENTAS"}</Text>
            </View>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name={esVistaPagosCliente ? "receipt-text-check-outline" : esVistaCobranzasCliente ? "cash-multiple" : "sign-real-estate"} size={26} color="#069488" />
            </View>
          </View>
        )}
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
        {esVistaReporteCliente ? (
          <View style={styles.clienteFiltroCard}>
            <View style={styles.clienteFiltroIcon}>
              <MaterialCommunityIcons name="account-check-outline" size={22} color="#ffffff" />
            </View>
            <View style={styles.clienteFiltroCopy}>
              <Text style={styles.clienteFiltroLabel}>CLIENTE SELECCIONADO</Text>
              <Text style={styles.clienteFiltroNombre} numberOfLines={1}>{nombreClienteVista}</Text>
              <Text style={styles.clienteFiltroMeta}>
                {cargando ? "Consultando compras..." : `${ventas.length} compra${ventas.length === 1 ? "" : "s"} encontrada${ventas.length === 1 ? "" : "s"} · ID ${clienteSeleccionadoId}`}
              </Text>
            </View>
            <MaterialCommunityIcons name="filter-check-outline" size={22} color="#0f766e" />
          </View>
        ) : null}
        <Text style={styles.sectionTitle}>
          {esVistaReporteCliente
            ? `Solo se muestran las compras de esta persona. ${esVistaPagosCliente ? "La compra del pago elegido esta resaltada." : "Toca una para ver y cobrar su cronograma."}`
            : "Toca una venta para ver el cronograma"}
        </Text>

        {/* Lista desplazable con todas las ventas asociadas al usuario. */}
        <ScrollView
          style={styles.scrollVentas}
          contentContainerStyle={[styles.scrollContent, esWeb && styles.scrollContentWeb]}
          showsVerticalScrollIndicator={true}
        >
          {cargando ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#069488" />
              <Text style={styles.loadingText}>Cargando ventas y cobranzas...</Text>
            </View>
          ) : errorCarga ? (
            <View style={styles.feedbackState}>
              <View style={styles.feedbackIconError}>
                <MaterialCommunityIcons name="cloud-alert-outline" size={30} color="#dc2626" />
              </View>
              <Text style={styles.feedbackTitle}>No pudimos cargar los datos</Text>
              <Text style={styles.feedbackText}>{errorCarga}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={cargarDatosIniciales}>
                <MaterialCommunityIcons name="refresh" size={17} color="#ffffff" />
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : ventas.length === 0 ? (
            <View style={styles.feedbackState}>
              <View style={styles.feedbackIconEmpty}>
                <MaterialCommunityIcons name="file-search-outline" size={30} color="#0f766e" />
              </View>
              <Text style={styles.feedbackTitle}>Sin compras registradas</Text>
              <Text style={styles.feedbackText}>
                {esVistaReporteCliente
                  ? "Este cliente no tiene ventas asociadas en la API."
                  : "No hay ventas registradas para este usuario."}
              </Text>
            </View>
          ) : (
            ventas.map((venta, index) => (
              /* Cada tarjeta representa una venta y al tocarla se abre su cronograma. */
              <TouchableOpacity
                key={obtenerIdVenta(venta) ?? index}
                style={[
                  styles.card,
                  esWeb && styles.cardWeb,
                  obtenerIdVenta(venta)?.toString() === ventaSeleccionadaId?.toString() && styles.cardDestacada,
                ]}
                onPress={() => manejarSeleccion(venta)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.loteInfo}>
                    <MaterialCommunityIcons name="map-marker-radius" size={20} color="#069488" />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.cardLabel}>{venta.Proyecto || "LOTE"}</Text>
                      <Text style={styles.cardValue}>{venta.CodigoLote || `${venta.Manzana || ""}${venta.NumeroLote || ""}`}</Text>
                    </View>
                  </View>
                  <View style={styles.cardHeaderRight}>
                    {obtenerIdVenta(venta)?.toString() === ventaSeleccionadaId?.toString() ? (
                      <View style={styles.selectedPill}><Text style={styles.selectedPillText}>SELECCIONADA</Text></View>
                    ) : null}
                    <MaterialCommunityIcons name="chevron-right" size={24} color="#94a3b8" />
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>S/ {Number(venta.PrecioVenta ?? 0).toFixed(2)}</Text>
                    <Text style={styles.subtext}>Cliente: {obtenerNombreCliente(obtenerIdClienteVenta(venta))}</Text>
                    <Text style={styles.subtext}>Venta #{obtenerIdVenta(venta)} · {venta.TipoVenta || "Sin tipo"}</Text>
                    <Text style={styles.subtext}>Pago: {venta.TipoPago || "Sin tipo"}</Text>
                    <Text style={styles.subtext}>Inicial: S/ {Number(venta.MontoInicial ?? 0).toFixed(2)}</Text>
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


      {!esWeb ? <View style={styles.ctnbtn}>
        <TouchableOpacity
          onPress={abrirAccionPrincipal}
          style={[styles.btnregistrar, esVistaReporteCliente && styles.btnVolverReporte]}
          activeOpacity={0.86}
        >
          <MaterialCommunityIcons name={esVistaReporteCliente ? "arrow-left" : "plus-circle-outline"} size={20} color="#ffffff" />
          <Text style={styles.btnregistrarText}>{esVistaPagosCliente ? "VOLVER A REPORTE PAGOS" : esVistaCobranzasCliente ? "VOLVER A REPORTE COBRANZAS" : "REGISTRAR VENTA"}</Text>
        </TouchableOpacity>
      </View> : null}

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
                <Text style={styles.modalTitle}>{esVistaPagosCliente ? "Detalle de Pagos" : esVistaCobranzasCliente ? "Detalle de Cobranza" : "Cronograma de Pagos"}</Text>
                <Text style={styles.modalSubtitle}>Venta #{obtenerIdVenta(selectedVentaLocal)} · Lote {selectedVentaLocal?.CodigoLote || selectedVentaLocal?.IdLote}</Text>
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
                {cronograma.length === 0 ? (
                  <View style={styles.cronogramaVacio}>
                    <MaterialCommunityIcons name="calendar-remove-outline" size={38} color="#0f766e" />
                    <Text style={styles.feedbackTitle}>Sin cuotas para esta venta</Text>
                    <Text style={styles.feedbackText}>La API no devolvió un cronograma asociado.</Text>
                  </View>
                ) : <View style={styles.grid}>
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
                          // La cuota es serializable; la pantalla se actualiza al volver a abrir la venta.
                          navigation.navigate("DetallePago", { cuota: item });
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
                </View>}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    top: 5,
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
  mainContainerWeb: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 0,
  },
  ventasContainer: {
    // La lista ocupa automaticamente el espacio libre en web y movil.
    flex: 1,
    minHeight: 0,
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
  ventasContainerWeb: {
    flex: 1,
    height: "auto",
    minHeight: 0,
    borderRadius: 24,
    paddingTop: 34,
    paddingBottom: 0,
    maxWidth: "100%",
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  headerCopy: {
    flex: 1,
    paddingRight: 72,
  },
  headerEyebrow: {
    color: '#0f766e',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
    marginTop: 4,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8fff8',
    marginRight: 62,
  },
  title: {
    fontSize: 28,
    fontWeight: '900', // Tipografía robusta idéntica al login y home
    color: '#111827'
  },
  clienteFiltroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ecfdf8',
    borderWidth: 1,
    borderColor: '#99e6d8',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
  },
  clienteFiltroIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f9f8f',
  },
  clienteFiltroCopy: {
    flex: 1,
    minWidth: 0,
  },
  clienteFiltroLabel: {
    color: '#0f766e',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  clienteFiltroNombre: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  clienteFiltroMeta: {
    color: '#52716d',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
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
    paddingBottom: 0
  },
  scrollContentWeb: {
    paddingBottom: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "flex-start",
    gap: 14,
  },
  loadingState: {
    width: "100%",
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  feedbackState: {
    width: "100%",
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  feedbackIconError: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    marginBottom: 12,
  },
  feedbackIconEmpty: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf8',
    marginBottom: 12,
  },
  feedbackTitle: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  feedbackText: {
    color: '#64748b',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 5,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#0f766e',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '900',
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
  cardWeb: {
    width: "32%",
    minWidth: 320,
    flexGrow: 1,
    marginBottom: 0,
  },
  cardDestacada: {
    borderColor: '#2dd4bf',
    backgroundColor: '#f6fffd',
    shadowOpacity: 0.12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedPill: {
    backgroundColor: '#ccfbf1',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectedPillText: {
    color: '#0f766e',
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
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
  priceContainer: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
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
  cronogramaVacio: {
    minHeight: 230,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
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
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    shadowColor: "#069488",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  btnVolverReporte: {
    backgroundColor: '#0f766e',
  },
  btnregistrarText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0,
  },
  ctnbtn: {
    marginTop: 8,
    paddingBottom: 0,
    alignItems: "center",
    width: "100%"
  }
});

export default Ventas
