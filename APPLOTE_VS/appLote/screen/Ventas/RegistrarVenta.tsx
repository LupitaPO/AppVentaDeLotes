import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { API_URL } from "../../config/apiUrl";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const RegistrarVenta = ({ route, navigation }) => {
  const {
    idLote: idLoteInicial,
    idUsuario,
    codigoLote: codigoLoteInicial,
    precioVenta: precioInicial,
    proyectoNombre: proyectoNombreInicial,
    nombreProyecto: nombreProyectoInicial,
    onRefresh,
  } = route.params || {};
  console.log(route.params)
  // Estados para datos actuales
  const [idLote, setIdLote] = useState(idLoteInicial || null);
  const [codigoLote, setCodigoLote] = useState(codigoLoteInicial || "");
  const [clienteDni, setClienteDni] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [asesorDni, setAsesorDni] = useState("");
  const [asesorNombre, setAsesorNombre] = useState("");
  const [proyectoNombre, setProyectoNombre] = useState(
    proyectoNombreInicial || nombreProyectoInicial || "",
  );
  const [precioVenta, setPrecioVenta] = useState(
    precioInicial?.toString() || "",
  );
  const [montoInicial, setMontoInicial] = useState("");
  const [tipoVenta, setTipoVenta] = useState("Contado");
  const [tipoPago, setTipoPago] = useState("Mensual");
  const [plazoMeses, setPlazoMeses] = useState("");
  const [observacion, setObservacion] = useState("");
  const [cargando, setCargando] = useState(false);

  // Estados para modales de selección
  const [lotes, setLotes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  
  const [modalLotesVisible, setModalLotesVisible] = useState(false);
  const [modalClientesVisible, setModalClientesVisible] = useState(false);
  const [modalAsesoresVisible, setModalAsesoresVisible] = useState(false);
  const [modalProyectosVisible, setModalProyectosVisible] = useState(false);
  
  const [cargandoLotes, setCargandoLotes] = useState(false);
  const [cargandoClientes, setCargandoClientes] = useState(false);
  const [cargandoAsesores, setCargandoAsesores] = useState(false);
  const [cargandoProyectos, setCargandoProyectos] = useState(false);
  
  const [busquedaLotes, setBusquedaLotes] = useState("");
  const [busquedaClientes, setBusquedaClientes] = useState("");
  const [busquedaAsesores, setBusquedaAsesores] = useState("");
  const [busquedaProyectos, setBusquedaProyectos] = useState("");
  const [idProyecto, setIdProyecto] = useState(null);

  // Estado para simular cuotas
  const [mostrarSimulacion, setMostrarSimulacion] = useState(false);
  const [cuotasSimuladas, setCuotasSimuladas] = useState([]);

  useEffect(() => {
    if (precioInicial) {
      setPrecioVenta(precioInicial.toString());
      setMontoInicial(precioInicial.toString());
    }
  }, [precioInicial]);

  useEffect(() => {
    if (route.params?.proyectoNombre || route.params?.nombreProyecto) {
      setProyectoNombre(route.params.proyectoNombre || route.params.nombreProyecto);
    }
  }, [route.params?.proyectoNombre, route.params?.nombreProyecto]);

  // Cargar lotes disponibles
  const cargarLotes = async () => {
    setCargandoLotes(true);
    try {
      const response = await fetch(`${API_URL}/Lote/lote_Listar`);
      const data = await response.json();
      setLotes(data || []);
    } catch (error) {
      console.error("Error al obtener lotes:", error);
      Alert.alert("Error", "No se pudieron cargar los lotes");
    } finally {
      setCargandoLotes(false);
    }
  };

  // Cargar clientes disponibles
  const cargarClientes = async () => {
    setCargandoClientes(true);
    try {
      const response = await fetch(`${API_URL}/Cliente/cliente_Listar`);
      const data = await response.json();
      setClientes(data || []);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      Alert.alert("Error", "No se pudieron cargar los clientes");
    } finally {
      setCargandoClientes(false);
    }
  };

  // Cargar asesores disponibles
  const cargarAsesores = async () => {
    setCargandoAsesores(true);
    try {
      const response = await fetch(`${API_URL}/Asesor/asesor_Listar`);
      const data = await response.json();
      setAsesores(data || []);
    } catch (error) {
      console.error("Error al obtener asesores:", error);
      Alert.alert("Error", "No se pudieron cargar los asesores");
    } finally {
      setCargandoAsesores(false);
    }
  };

  // Cargar proyectos disponibles
  const cargarProyectos = async () => {
    setCargandoProyectos(true);
    try {
      const response = await fetch(`${API_URL}/Proyecto/proyecto_Listar`);
      const data = await response.json();
      setProyectos(data || []);
    } catch (error) {
      console.error("Error al obtener proyectos:", error);
      Alert.alert("Error", "No se pudieron cargar los proyectos");
    } finally {
      setCargandoProyectos(false);
    }
  };

  // Seleccionar lote
  const seleccionarLote = (lote) => {
    setIdLote(lote.IdLote || lote.idLote);
    setCodigoLote(lote.CodigoLote || lote.codigoLote || "Sin Código");
    setProyectoNombre(
      lote.NombreProyecto || lote.nombreProyecto || lote.Proyecto || lote.proyecto || ""
    );
    setPrecioVenta((lote.Precio || lote.precio)?.toString() || "");
    setModalLotesVisible(false);
  };

  // Seleccionar cliente
  const seleccionarCliente = (cliente) => {
    const dni = cliente.DNI || cliente.dni;
    const nombre = `${cliente.Nombre1 || ""} ${cliente.Apaterno || ""}`.trim();
    setClienteDni(dni?.toString() || "");
    setClienteNombre(nombre || "");
    setModalClientesVisible(false);
  };

  // Seleccionar asesor
  const seleccionarAsesor = (asesor) => {
    const dni = asesor.DNI || asesor.dni;
    const nombre = `${asesor.Nombre1 || ""} ${asesor.Apaterno || ""}`.trim();
    setAsesorDni(dni?.toString() || "");
    setAsesorNombre(nombre || "");
    setModalAsesoresVisible(false);
  };

  // Seleccionar proyecto
  const seleccionarProyecto = (proyecto) => {
    const id = proyecto.IdProyecto || proyecto.idProyecto;
    const nombre = proyecto.NombreProyecto || proyecto.nombreProyecto || proyecto.Nombre || proyecto.nombre || "Sin nombre";
    setIdProyecto(id);
    setProyectoNombre(nombre);
    setModalProyectosVisible(false);
  };

  // Filtrar lotes
  const lotesFiltrados = lotes.filter((lote) => {
    const codigo = (lote.CodigoLote || lote.codigoLote || "").toString().toLowerCase();
    const ubicacion = (lote.Ubicacion || lote.ubicacion || "").toString().toLowerCase();
    const proyecto = (
      lote.NombreProyecto || lote.nombreProyecto || lote.Proyecto || lote.proyecto || ""
    )
      .toString()
      .toLowerCase();

    return (
      codigo.includes(busquedaLotes.toLowerCase()) ||
      ubicacion.includes(busquedaLotes.toLowerCase()) ||
      proyecto.includes(busquedaLotes.toLowerCase())
    );
  });

  // Filtrar clientes
  const clientesFiltrados = clientes.filter(
    (cliente) =>
      (cliente.DNI || cliente.dni)?.toString().includes(busquedaClientes) ||
      `${cliente.Nombre1 || ""} ${cliente.Apaterno || ""}`
        .toLowerCase()
        .includes(busquedaClientes.toLowerCase())
  );

  // Filtrar asesores
  const asesoresFiltrados = asesores.filter(
    (asesor) =>
      (asesor.DNI || asesor.dni)?.toString().includes(busquedaAsesores) ||
      `${asesor.Nombre1 || ""} ${asesor.Apaterno || ""}`
        .toLowerCase()
        .includes(busquedaAsesores.toLowerCase())
  );

  // Filtrar proyectos
  const proyectosFiltrados = proyectos.filter((proyecto) => {
    const nombre = (proyecto.NombreProyecto || proyecto.nombreProyecto || proyecto.Nombre || "").toString().toLowerCase();
    const ubicacion = (proyecto.Ubicacion || proyecto.ubicacion || "").toString().toLowerCase();
    return (
      nombre.includes(busquedaProyectos.toLowerCase()) ||
      ubicacion.includes(busquedaProyectos.toLowerCase())
    );
  });

  // Simular cuotas
  const simularCuotas = () => {
    if (!precioVenta.trim() || !montoInicial.trim() || !plazoMeses.trim()) {
      Alert.alert("Error", "Complete monto inicial, precio y plazo para simular cuotas");
      return;
    }

    const precio = parseFloat(precioVenta.replace(/,/g, "."));
    const monto = parseFloat(montoInicial.replace(/,/g, "."));
    const plazo = parseInt(plazoMeses, 10);
    const saldoFinanciar = precio - monto;

    if (Number.isNaN(precio) || precio <= 0 || Number.isNaN(monto) || monto < 0) {
      Alert.alert("Error", "Ingrese un precio y monto inicial válidos.");
      return;
    }

    if (Number.isNaN(plazo) || plazo <= 0) {
      Alert.alert("Error", "Ingrese un plazo válido en meses.");
      return;
    }

    if (saldoFinanciar <= 0) {
      Alert.alert("Error", "El monto inicial debe ser menor al precio");
      return;
    }

    let frecuencia = 1;
    if (tipoPago === "Mensual") frecuencia = 1;
    if (tipoPago === "Trimestral") frecuencia = 3;
    if (tipoPago === "Semestral") frecuencia = 6;

    const numCuotas = Math.max(1, Math.ceil(plazo / frecuencia));
    const montoPorCuota = Math.round((saldoFinanciar / numCuotas) * 100) / 100;
    const hoy = new Date();

    const cuotas = Array.from({ length: numCuotas }, (_, index) => {
      const fechaCuota = new Date(hoy);
      fechaCuota.setMonth(hoy.getMonth() + frecuencia * (index + 1));

      return {
        numero: index + 1,
        monto: montoPorCuota,
        fecha: fechaCuota.toISOString().split("T")[0],
      };
    });

    setCuotasSimuladas(cuotas);
    setMostrarSimulacion(true);
  };

  const obtenerIdClientePorDNI = async (dni) => {
    try {
      const cliente = clientes.find(
        (item) => item.DNI?.toString()?.trim() === dni.toString().trim(),
      );
      return cliente?.IdCliente || cliente?.idCliente || cliente?.Id || null;
    } catch (error) {
      console.error("Error al obtener cliente:", error);
      return null;
    }
  };

  const obtenerIdAsesorPorDNI = async (dni) => {
    try {
      const asesor = asesores.find(
        (item) => item.DNI?.toString()?.trim() === dni.toString().trim(),
      );
      return asesor?.IdAsesor || asesor?.idAsesor || asesor?.Id || null;
    } catch (error) {
      console.error("Error al obtener asesor:", error);
      return null;
    }
  };

  const registrarVenta = async () => {
    if (!idLote) {
      Alert.alert("Error", "Debe seleccionar un lote.");
      return;
    }

    if (!idUsuario) {
      Alert.alert("Error", "No se encontró el usuario que realiza la venta.");
      return;
    }

    if (!clienteDni.trim() || !asesorDni.trim() || !precioVenta.trim()) {
      Alert.alert(
        "Error",
        "DNI de cliente, DNI de asesor y precio son obligatorios.",
      );
      return;
    }

    const precio = parseFloat(precioVenta.replace(/,/g, "."));
    if (Number.isNaN(precio) || precio <= 0) {
      Alert.alert("Error", "Ingrese un precio de venta válido.");
      return;
    }

    let montoInicialFinal = montoInicial;
    let plazoFinal = plazoMeses;
    let tipoPagoFinal = tipoPago;

    if (tipoVenta === "Contado") {
      montoInicialFinal = precio.toString();
      tipoPagoFinal = "Contado";
      plazoFinal = "0";
    } else {
      if (!montoInicial.trim() || !tipoPago.trim() || !plazoMeses.trim()) {
        Alert.alert(
          "Error",
          "Para venta financiada debe completar monto inicial, tipo de pago y plazo.",
        );
        return;
      }
      const monto = parseFloat(montoInicial.replace(/,/g, "."));
      const plazo = parseInt(plazoMeses, 10);
      if (Number.isNaN(monto) || monto <= 0 || monto >= precio) {
        Alert.alert(
          "Error",
          "El monto inicial debe ser menor al precio de venta.",
        );
        return;
      }
      if (Number.isNaN(plazo) || plazo <= 0) {
        Alert.alert("Error", "Ingrese un plazo válido en meses.");
        return;
      }
      montoInicialFinal = monto.toString();
      plazoFinal = plazo.toString();
    }

    setCargando(true);

    const idCliente = await obtenerIdClientePorDNI(clienteDni);
    if (!idCliente) {
      setCargando(false);
      Alert.alert("Error", "No se encontró un cliente con ese DNI.");
      return;
    }

    const idAsesor = await obtenerIdAsesorPorDNI(asesorDni);
    if (!idAsesor) {
      setCargando(false);
      Alert.alert("Error", "No se encontró un asesor con ese DNI.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/Venta/venta_registrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          IdLote: idLote,
          IdUsuario: idUsuario,
          IdCliente: idCliente,
          IdAsesor: idAsesor,
          PrecioVenta: precio,
          MontoInicial: parseFloat(montoInicialFinal.replace(/,/g, ".")),
          TipoVenta: tipoVenta,
          TipoPago: tipoPagoFinal,
          PlazoMeses: parseInt(plazoFinal),
          Observacion: observacion || "",
          EstadoVenta: "Activo",
        }),
      });

      if (response.ok) {
        Alert.alert("Éxito", "Venta registrada correctamente.", [
          {
            text: "OK",
            onPress: () => {
              onRefresh?.();
              navigation.goBack();
            },
          },
        ]);
      } else {
        console.log("error", response);
        const text = await response.text();
        Alert.alert("Error", text || "No se pudo registrar la venta.");
      }
    } catch (error) {
      console.error("Error al registrar venta:", error);
      Alert.alert("Error", "Error de conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Registrar Venta</Text>

        {/* Sección de Lote */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Información del Lote</Text>
          <TouchableOpacity
            style={styles.selectorContainer}
            onPress={() => {
              cargarLotes();
              setModalLotesVisible(true);
            }}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorTextContainer}>
                <Text style={styles.selectorLabel}>Lote</Text>
                <Text style={styles.selectorValue}>
                  {codigoLote || "Sin Código"}
                </Text>
              </View>
              <MaterialIcons name="expand-more" size={24} color="#069488" />
            </View>
          </TouchableOpacity>

          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>ID Lote:</Text>
              <Text style={styles.infoValue}>{idLote || "No Disponible"}</Text>
            </View>
            <View style={[styles.infoItem, { marginTop: 10 }]}> 
              <Text style={styles.infoLabel}>Proyecto:</Text>
              <Text style={styles.infoValue}>{proyectoNombre || "No disponible"}</Text>
            </View>
          </View>

          {/* Selector de Proyecto Asociado */}
          <TouchableOpacity
            style={styles.selectorContainer}
            onPress={() => {
              cargarProyectos();
              setModalProyectosVisible(true);
            }}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorTextContainer}>
                <Text style={styles.selectorLabel}>Proyecto Asociado</Text>
                <Text style={styles.selectorValue}>
                  {proyectoNombre || "Seleccionar proyecto"}
                </Text>
              </View>
              <MaterialIcons name="expand-more" size={24} color="#069488" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Sección de Cliente */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Información del Cliente</Text>
          <TouchableOpacity
            style={styles.selectorContainer}
            onPress={() => {
              cargarClientes();
              setModalClientesVisible(true);
            }}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorTextContainer}>
                <Text style={styles.selectorLabel}>Cliente</Text>
                <Text style={styles.selectorValue}>
                  {clienteNombre || "Seleccionar cliente"}
                </Text>
              </View>
              <MaterialIcons name="expand-more" size={24} color="#069488" />
            </View>
          </TouchableOpacity>

          {clienteDni && (
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>DNI:</Text>
                <Text style={styles.infoValue}>{clienteDni}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Sección de Asesor */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Información del Asesor</Text>
          <TouchableOpacity
            style={styles.selectorContainer}
            onPress={() => {
              cargarAsesores();
              setModalAsesoresVisible(true);
            }}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorTextContainer}>
                <Text style={styles.selectorLabel}>Asesor</Text>
                <Text style={styles.selectorValue}>
                  {asesorNombre || "Seleccionar asesor"}
                </Text>
              </View>
              <MaterialIcons name="expand-more" size={24} color="#069488" />
            </View>
          </TouchableOpacity>

          {asesorDni && (
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>DNI:</Text>
                <Text style={styles.infoValue}>{asesorDni}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Sección de Precio */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Información de Precio</Text>
          <Text style={styles.label}>Precio de Venta</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingrese el precio de venta"
            value={precioVenta}
            onChangeText={setPrecioVenta}
            keyboardType="numeric"
            editable={!precioInicial}
          />
        </View>

        {/* Sección de Tipo de Venta */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tipo de Venta</Text>
          <View style={styles.row}>
            {[
              { label: "Contado", value: "Contado" },
              { label: "Financiado", value: "Financiado" },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  tipoVenta === option.value && styles.optionSelected,
                ]}
                onPress={() => setTipoVenta(option.value)}
              >
                <Text
                  style={
                    tipoVenta === option.value
                      ? styles.optionTextSelected
                      : styles.optionText
                  }
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sección de Venta Financiada */}
        {tipoVenta === "Financiado" && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Detalles de Financiación</Text>

              <Text style={styles.label}>Monto Inicial</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingrese el monto inicial"
                value={montoInicial}
                onChangeText={setMontoInicial}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Tipo de Pago</Text>
              <View style={styles.row}>
                {[
                  { label: "Mensual", value: "Mensual" },
                  { label: "Trimestral", value: "Trimestral" },
                  { label: "Semestral", value: "Semestral" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.option,
                      tipoPago === option.value && styles.optionSelected,
                    ]}
                    onPress={() => setTipoPago(option.value)}
                  >
                    <Text
                      style={
                        tipoPago === option.value
                          ? styles.optionTextSelected
                          : styles.optionText
                      }
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Plazo en Meses</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingrese el plazo en meses"
                value={plazoMeses}
                onChangeText={setPlazoMeses}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={styles.btnSimular}
                onPress={simularCuotas}
              >
                <MaterialIcons name="calculate" size={20} color="#fff" />
                <Text style={styles.btnSimularText}>Simular Cuotas</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Modal de Simulación de Cuotas */}
        <Modal
          visible={mostrarSimulacion}
          transparent
          animationType="slide"
          onRequestClose={() => setMostrarSimulacion(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Simulación de Cuotas</Text>
                <TouchableOpacity
                  onPress={() => setMostrarSimulacion(false)}
                >
                  <MaterialIcons name="close" size={28} color="#069488" />
                </TouchableOpacity>
              </View>

              <View style={styles.simulacionInfo}>
                <View style={styles.simulacionItem}>
                  <Text style={styles.simulacionLabel}>Precio Total:</Text>
                  <Text style={styles.simulacionValue}>
                    S/ {parseFloat(precioVenta).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.simulacionItem}>
                  <Text style={styles.simulacionLabel}>Monto Inicial:</Text>
                  <Text style={styles.simulacionValue}>
                    S/ {parseFloat(montoInicial).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.simulacionItem}>
                  <Text style={styles.simulacionLabel}>A Financiar:</Text>
                  <Text style={styles.simulacionValue}>
                    S/{" "}
                    {(parseFloat(precioVenta) - parseFloat(montoInicial)).toFixed(2)}
                  </Text>
                </View>
              </View>

              <Text style={styles.cuotasTitle}>Cronograma de Cuotas</Text>
              <FlatList
                data={cuotasSimuladas}
                keyExtractor={(item) => item.numero.toString()}
                renderItem={({ item }) => (
                  <View style={styles.cuotaItem}>
                    <View style={styles.cuotaNumero}>
                      <Text style={styles.cuotaNumeroText}>Cuota {item.numero}</Text>
                    </View>
                    <View style={styles.cuotaDetalles}>
                      <Text style={styles.cuotaMonto}>
                        S/ {item.monto.toFixed(2)}
                      </Text>
                      <Text style={styles.cuotaFecha}>{item.fecha}</Text>
                    </View>
                  </View>
                )}
                scrollEnabled={true}
                nestedScrollEnabled={true}
              />

              <TouchableOpacity
                style={styles.btnCerrarModal}
                onPress={() => setMostrarSimulacion(false)}
              >
                <Text style={styles.btnCerrarModalText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Sección de Observación */}
        <View style={styles.section}>
          <Text style={styles.label}>Observación (Opcional)</Text>
          <TextInput
            style={[styles.input, styles.inputLarge]}
            placeholder="Ingrese observaciones adicionales"
            value={observacion}
            onChangeText={setObservacion}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Botón Registrar */}
        <TouchableOpacity
          style={[styles.button, cargando && styles.buttonDisabled]}
          onPress={registrarVenta}
          disabled={cargando}
        >
          <Text style={styles.buttonText}>
            {cargando ? "Guardando..." : "Registrar Venta"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal Seleccionar Lote */}
      <Modal
        visible={modalLotesVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalLotesVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Lote</Text>
              <TouchableOpacity onPress={() => setModalLotesVisible(false)}>
                <MaterialIcons name="close" size={28} color="#069488" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por código, ubicación o proyecto..."
              value={busquedaLotes}
              onChangeText={setBusquedaLotes}
            />

            {cargandoLotes ? (
              <ActivityIndicator size="large" color="#069488" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={lotesFiltrados}
                keyExtractor={(item) => item.IdLote?.toString() || item.idLote?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => seleccionarLote(item)}
                  >
                    <View>
                      <Text style={styles.listItemTitle}>
                        {item.CodigoLote || item.codigoLote || "Sin Código"}
                      </Text>
                      <Text style={styles.listItemSubtitle}>
                        {item.Ubicacion || item.ubicacion || ""}
                      </Text>
                      <Text style={styles.listItemSubtitle}>
                        Proyecto: {item.NombreProyecto || item.nombreProyecto || item.Proyecto || item.proyecto || "-"}
                      </Text>
                      <Text style={styles.listItemPrice}>
                        S/ {(item.Precio || item.precio)?.toFixed(2)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                scrollEnabled={true}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Seleccionar Cliente */}
      <Modal
        visible={modalClientesVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalClientesVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Cliente</Text>
              <TouchableOpacity onPress={() => setModalClientesVisible(false)}>
                <MaterialIcons name="close" size={28} color="#069488" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por DNI o nombre..."
              value={busquedaClientes}
              onChangeText={setBusquedaClientes}
            />

            {cargandoClientes ? (
              <ActivityIndicator size="large" color="#069488" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={clientesFiltrados}
                keyExtractor={(item) => item.IdCliente?.toString() || item.idCliente?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => seleccionarCliente(item)}
                  >
                    <View>
                      <Text style={styles.listItemTitle}>
                        {item.DNI || item.dni}
                      </Text>
                      <Text style={styles.listItemSubtitle}>
                        {item.Nombre1} {item.Apaterno}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                scrollEnabled={true}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Seleccionar Asesor */}
      <Modal
        visible={modalAsesoresVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalAsesoresVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Asesor</Text>
              <TouchableOpacity onPress={() => setModalAsesoresVisible(false)}>
                <MaterialIcons name="close" size={28} color="#069488" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por DNI o nombre..."
              value={busquedaAsesores}
              onChangeText={setBusquedaAsesores}
            />

            {cargandoAsesores ? (
              <ActivityIndicator size="large" color="#069488" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={asesoresFiltrados}
                keyExtractor={(item) => item.IdAsesor?.toString() || item.idAsesor?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => seleccionarAsesor(item)}
                  >
                    <View>
                      <Text style={styles.listItemTitle}>
                        {item.DNI || item.dni}
                      </Text>
                      <Text style={styles.listItemSubtitle}>
                        {item.Nombre1} {item.Apaterno}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                scrollEnabled={true}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Seleccionar Proyecto */}
      <Modal
        visible={modalProyectosVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalProyectosVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Proyecto</Text>
              <TouchableOpacity onPress={() => setModalProyectosVisible(false)}>
                <MaterialIcons name="close" size={28} color="#069488" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o ubicación..."
              value={busquedaProyectos}
              onChangeText={setBusquedaProyectos}
            />

            {cargandoProyectos ? (
              <ActivityIndicator size="large" color="#069488" style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={proyectosFiltrados}
                keyExtractor={(item) => item.IdProyecto?.toString() || item.idProyecto?.toString() || Math.random().toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => seleccionarProyecto(item)}
                  >
                    <View>
                      <Text style={styles.listItemTitle}>
                        {item.NombreProyecto || item.nombreProyecto || item.Nombre || "Sin nombre"}
                      </Text>
                      <Text style={styles.listItemSubtitle}>
                        {item.Ubicacion || item.ubicacion || ""}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4fcfb",
  },
  content: {
    padding: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(6, 148, 136, 0.08)",
    shadowColor: "#087c72",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#069488",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#f9fafb",
    fontSize: 14,
    color: "#1f2937",
  },
  inputLarge: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  selectorContainer: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginBottom: 12,
    overflow: "hidden",
  },
  selectorContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  selectorTextContainer: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
  },
  selectorValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#069488",
  },
  infoContainer: {
    backgroundColor: "#e6fbf7",
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#069488",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#069488",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 8,
  },
  option: {
    backgroundColor: "#f3fffe",
    borderWidth: 1.5,
    borderColor: "#d1e4e1",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: "48%",
    alignItems: "center",
    justifyContent: "center",
  },
  optionSelected: {
    backgroundColor: "#069488",
    borderColor: "#069488",
  },
  optionText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 13,
  },
  optionTextSelected: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  button: {
    backgroundColor: "#069488",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#0f766e",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#9ecdc9",
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  btnSimular: {
    backgroundColor: "#0ea5e9",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    shadowColor: "#0369a1",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  btnSimularText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  // Modales
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#f9fafb",
    fontSize: 14,
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#fafbfc",
    marginBottom: 6,
    borderRadius: 10,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  listItemSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  listItemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#069488",
    marginTop: 4,
  },
  // Simulación de Cuotas
  simulacionInfo: {
    backgroundColor: "#e6fbf7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#069488",
  },
  simulacionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  simulacionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  simulacionValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#069488",
  },
  cuotasTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  cuotaItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f9fafb",
    marginBottom: 8,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#0ea5e9",
  },
  cuotaNumero: {
    width: 60,
    height: 40,
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cuotaNumeroText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0369a1",
  },
  cuotaDetalles: {
    flex: 1,
  },
  cuotaMonto: {
    fontSize: 14,
    fontWeight: "700",
    color: "#069488",
  },
  cuotaFecha: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  btnCerrarModal: {
    backgroundColor: "#069488",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  btnCerrarModalText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default RegistrarVenta;
