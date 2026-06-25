import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Platform
} from "react-native";
import Svg, { Rect, G, Text as SvgText } from "react-native-svg";
import Papa from "papaparse";
import { useFocusEffect } from "@react-navigation/native";
import { API_URL } from "../../config/apiUrl";

const { width, height } = Dimensions.get("window");
const esWeb = Platform.OS === "web";

const normalizarFiltroLote = (value) => String(value ?? "").trim().toUpperCase();
const asegurarArray = (value) => (Array.isArray(value) ? value : []);
const limpiarRespuestaServidor = (texto = "") => {
  let limpio = String(texto ?? "");
  ["<!--", "<script"].forEach((marca) => {
    const indice = limpio.indexOf(marca);
    if (indice >= 0) limpio = limpio.slice(0, indice);
  });
  return limpio.replace(/^\uFEFF/, "").trim();
};
const normalizarClaveCSV = (value) =>
  String(value ?? "")
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
const obtenerValorCSV = (registro, claves) => {
  const clavesNormalizadas = claves.map(normalizarClaveCSV);
  const claveReal = Object.keys(registro ?? {}).find((clave) =>
    clavesNormalizadas.includes(normalizarClaveCSV(clave)),
  );

  return claveReal ? registro[claveReal] : "";
};
const obtenerNumeroCSV = (registro, claves) => {
  const valor = obtenerValorCSV(registro, claves);
  const numero = parseFloat(String(valor ?? "").replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
};
const limpiarRutaPlano = (ruta) => String(ruta ?? "").replace(/[\r\n\t]/g, "").trim();
const obtenerNombrePlano = (ruta) => {
  const rutaLimpia = limpiarRutaPlano(ruta).split("?")[0].split("#")[0].replace(/\\/g, "/");
  return rutaLimpia.split("/").pop() || "";
};
const construirUrlApi = (ruta) => `${API_URL}${ruta.startsWith("/") ? "" : "/"}${ruta}`;
const obtenerRutasPlano = (ruta) => {
  const rutaLimpia = limpiarRutaPlano(ruta);
  if (!rutaLimpia) return [];

  const nombrePlano = obtenerNombrePlano(rutaLimpia);
  const rutas = [];

  if (nombrePlano) {
    rutas.push(`${API_URL}/Proyecto/plano_Obtener/${encodeURIComponent(nombrePlano)}`);
  }

  rutas.push(/^https?:\/\//i.test(rutaLimpia) ? rutaLimpia : construirUrlApi(rutaLimpia));

  return [...new Set(rutas)];
};
const descargarTextoPlano = async (rutas) => {
  let ultimoError = null;

  for (const ruta of rutas) {
    try {
      const response = await fetch(ruta);
      if (!response.ok) {
        ultimoError = new Error(`HTTP ${response.status} al cargar ${ruta}`);
        continue;
      }

      const texto = limpiarRespuestaServidor(await response.text());
      if (!texto || /^</.test(texto)) {
        ultimoError = new Error(`Respuesta inválida al cargar ${ruta}`);
        continue;
      }

      return texto;
    } catch (error) {
      ultimoError = error;
    }
  }

  throw ultimoError ?? new Error("No se pudo cargar el plano.");
};
const generarGeometriaDesdeLotes = (lotes) => {
  const columnas = Math.max(1, Math.ceil(Math.sqrt(lotes.length)));
  const separacionX = 24;
  const separacionY = 18;

  return lotes.map((lote, index) => ({
    Valor: lote.CodigoLote || lote.NumeroLote || `L${index + 1}`,
    "Posicion X": (index % columnas) * separacionX,
    "Posicion Y": Math.floor(index / columnas) * separacionY,
    generadoDesdeBD: true,
  }));
};
const obtenerViewBoxGeometria = (geometria) => {
  const xs = geometria
    .map((l) => obtenerNumeroCSV(l, ["posicionx"]))
    .filter((numero) => numero !== null);
  const ys = geometria
    .map((l) => obtenerNumeroCSV(l, ["posiciony"]))
    .filter((numero) => numero !== null);

  if (xs.length === 0 || ys.length === 0) return "0 0 100 100";

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  const padding = 20;
  const anchoTotal = Math.max(maxX - minX, 24);
  const altoTotal = Math.max(maxY - minY, 18);

  return `${minX - padding} ${minY - padding} ${anchoTotal + padding * 2} ${altoTotal + padding * 2}`;
};
const extraerManzanaCodigo = (codigo) => {
  const texto = String(codigo ?? "").trim();
  const match = texto.match(/^[A-Za-z]+/);
  return match ? match[0].toUpperCase() : "";
};
const valoresUnicos = (values) =>
  [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];

const DetalleProyecto = ({ route, navigation }) => {
  const params = route.params || {};
  const { urlCSV, info } = params;
  const [proyectoInfo, setProyectoInfo] = useState(info || {});
  const idProyecto = proyectoInfo?.IdProyecto;
  const lotesClienteIdsParam = asegurarArray(params.lotesClienteIds);
  const codigosLotesClienteParam = asegurarArray(params.codigosLotesCliente);
  const lotesClienteIdsSet = new Set(lotesClienteIdsParam.map(normalizarFiltroLote).filter(Boolean));
  const codigosLotesClienteSet = new Set(codigosLotesClienteParam.map(normalizarFiltroLote).filter(Boolean));
  const hayFiltroCliente = lotesClienteIdsSet.size > 0 || codigosLotesClienteSet.size > 0;
  const filtroLotesClienteKey = `${lotesClienteIdsParam.join("|")}::${codigosLotesClienteParam.join("|")}`;
  const clienteFiltroTexto = params.clienteFiltroNombre || params.clienteFiltroDNI || "";
  const [lotesGeometria, setLotesGeometria] = useState([]);
  const [lotesBD, setLotesBD] = useState([]);
  const [miViewBox, setMiViewBox] = useState("0 0 1000 1000");
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarTodo();
    }, [idProyecto, urlCSV, filtroLotesClienteKey]),
  );

  useEffect(() => {
    if (route.params?.info) {
      setProyectoInfo(route.params.info);
    }
  }, [route.params?.info]);

  const cargarTodo = async () => {
    setCargando(true);
    try {
      const planoCargado = await descargarYProcesarMapa();
      const lotesCargados = await obtenerLotesDesdeBD();

      if (!planoCargado && lotesCargados.length > 0) {
        const geometriaBD = generarGeometriaDesdeLotes(lotesCargados);
        setMiViewBox(obtenerViewBoxGeometria(geometriaBD));
        setLotesGeometria(geometriaBD);
      }
    } finally {
      setCargando(false);
    }
  };

  const lotePermitidoPorCliente = (lote) => {
    if (!hayFiltroCliente) return true;

    const idLote = normalizarFiltroLote(lote?.IdLote ?? lote?.idLote ?? lote?.Id ?? lote?.id);
    const codigoLote = normalizarFiltroLote(lote?.CodigoLote ?? lote?.codigoLote ?? lote?.Codigo ?? lote?.codigo);

    return lotesClienteIdsSet.has(idLote) || codigosLotesClienteSet.has(codigoLote);
  };

  const obtenerCodigoMapa = (loteMapa) => {
    return obtenerValorCSV(loteMapa, ["valor", "contenido", "codigo"]);
  };

  const geometriaPermitidaPorCliente = (codigoMapa) => {
    if (!hayFiltroCliente) return true;
    return codigosLotesClienteSet.has(normalizarFiltroLote(codigoMapa));
  };

  // 1. Obtener estados desde SQL Server (Limpiando inyecciones de Somee)
  const obtenerLotesDesdeBD = async () => {
    try {
      const response = await fetch(`${API_URL}/Lote/lote_Listar`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const textoLotes = limpiarRespuestaServidor(await response.text());
      const todosLosLotes = JSON.parse(textoLotes);

      const filtrados = todosLosLotes.filter(
        (lote) => lote.IdProyecto?.toString() === idProyecto?.toString(),
      );

      const lotesFiltrados = filtrados.filter(lotePermitidoPorCliente);
      setLotesBD(lotesFiltrados);
      return lotesFiltrados;
    } catch (error) {
      console.error("Error cargando lotes BD:", error);
      setLotesBD([]);
      return [];
    }
  };

  // 2. Descargar geometría desde el CSV (Borrando el banner publicitario de Somee)
  const descargarYProcesarMapa = async () => {
  try {
    if (!urlCSV) {
      setLotesGeometria([]);
      return false;
    }

    const csvLimpio = await descargarTextoPlano(obtenerRutasPlano(urlCSV));

    if (!csvLimpio || /^</.test(csvLimpio)) {
      setLotesGeometria([]);
      return;
    }

    return await new Promise((resolve) => {
      Papa.parse(csvLimpio, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.replace(/^\uFEFF/, "").trim(),
        complete: (result) => {
          const datos = result.data.filter((l) => {
            const x = obtenerNumeroCSV(l, ["posicionx"]);
            const y = obtenerNumeroCSV(l, ["posiciony"]);
            return x !== null && y !== null;
          });

          const datosCliente = hayFiltroCliente
            ? datos.filter((l) => geometriaPermitidaPorCliente(obtenerCodigoMapa(l)))
            : datos;

          if (datosCliente.length > 0) {
            setMiViewBox(obtenerViewBoxGeometria(datosCliente));
            setLotesGeometria(datosCliente);
            resolve(true);
            return;
          }

          setLotesGeometria([]);
          resolve(false);
        },
        error: () => {
          setLotesGeometria([]);
          resolve(false);
        },
      });
    });
  } catch (error) {
    setLotesGeometria([]);
    return false;
  }
};

  const obtenerColor = (nombreMapa) => {
    const loteEncontrado = lotesBD.find(
      (l) => l.CodigoLote?.trim().toUpperCase() === nombreMapa?.trim().toUpperCase(),
    );

    if (!loteEncontrado) return "#ffffff";

    switch (normalizarClaveCSV(loteEncontrado.EstadoLote)) {
      case "aldia": return "#28a745";
      case "retrasado": return "#ffeb3b";
      case "endeuda": return "#dc3545";
      case "vendido": return "#fd7e14";
      default: return "#ffffff";
    }
  };

  const obtenerIdLote = (lote) => {
    return lote?.IdLote ?? lote?.idLote ?? lote?.Id ?? lote?.id ?? lote?.Id_Lote;
  };
  const obtenerManzanasDisponibles = () =>
    valoresUnicos([
      ...lotesBD.map((lote) => lote.Manzana),
      ...lotesGeometria.map((lote) => extraerManzanaCodigo(obtenerCodigoMapa(lote))),
    ]).sort();

  const altoMapa = esWeb ? Math.max(220, Math.min(300, Math.round(height * 0.32))) : 380;
  const anchoMapa = esWeb ? Math.max(280, Math.min(width - 40, 860)) : undefined;
  const altoSvg = esWeb ? Math.max(180, altoMapa - 32) : 350;
  const anchoSvg = esWeb ? Math.max(240, (anchoMapa || width) - 32) : width - 80;

  return (
    <View style={styles.container}>
      <View style={[styles.header, esWeb && styles.headerWeb]}>
        <Text style={styles.title}>{proyectoInfo.Nombre}</Text>
        <Text style={styles.label}>
          📍 Ubicación: <Text style={styles.value}>{proyectoInfo.Ubicacion}</Text>
        </Text>
        <Text style={styles.label}>
          📏 Hectáreas: <Text style={styles.value}>{proyectoInfo.NumeroHectareas}</Text>
        </Text>
        {hayFiltroCliente ? (
          <Text style={styles.label}>
            Cliente: <Text style={styles.value}>{clienteFiltroTexto || "Cliente seleccionado"}</Text>
          </Text>
        ) : null}
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[styles.scrollContent, esWeb && styles.scrollContentWeb]}
      >
        <View style={[styles.mapContainer, esWeb && styles.mapContainerWeb, esWeb && { height: altoMapa, width: anchoMapa }]}>
          {cargando ? (
            <ActivityIndicator size="large" color="#069488" />
          ) : lotesGeometria.length === 0 ? (
            <Text style={styles.mapEmptyText}>
              No se encontró información del plano para mostrar.
            </Text>
          ) : (
            <Svg
              height={altoSvg}
              width={anchoSvg}
              viewBox={miViewBox}
              preserveAspectRatio="xMidYMid meet"
            >
              <G scaleY={1} originY={0}>
                {lotesGeometria.map((lote, index) => {
                  const x = obtenerNumeroCSV(lote, ["posicionx"]);
                  const y = obtenerNumeroCSV(lote, ["posiciony"]);
                  const nombre = obtenerCodigoMapa(lote);
                  if (x === null || y === null) return null;

                  const anchoLote = 15;
                  const altoLote = 10;
                  const colorFondo = obtenerColor(nombre);

                  return (
                    <G key={index}>
                      <Rect
                        x={x}
                        y={y}
                        width={anchoLote}
                        height={altoLote}
                        fill={colorFondo}
                        stroke="#7a7a7a"
                        strokeWidth="1"
                        onPress={() => {
                          const dbInfo = lotesBD.find(
                            (l) => l.CodigoLote?.trim().toUpperCase() === nombre?.trim().toUpperCase()
                          );
                          Alert.alert(
                            `Lote: ${nombre}`,
                            dbInfo
                              ? `Estado: ${dbInfo.EstadoLote}\nCliente: ${dbInfo.Cliente || "N/A"}`
                              : "Estado: Libre",
                            [
                              { text: "Cancelar" },
                              {
                                text: "Modificar",
                                onPress: () => Alert.alert("Modificar", "Funcionalidad aún no implementada."),
                              },
                              {
                                text: "Venta",
                                onPress: () => {
                                  const loteId = obtenerIdLote(dbInfo);
                                  if (!loteId) {
                                    Alert.alert("Aviso", "No se encontró el Id del lote en la base de datos.");
                                    return;
                                  }
                                  navigation.navigate("RegistrarVenta", {
                                    idLote: loteId,
                                    idUsuario: route.params?.idUsuario,
                                    codigoLote: dbInfo.CodigoLote,
                                    precioVenta: dbInfo.Precio,
                                    proyectoNombre: proyectoInfo?.NombreProyecto || proyectoInfo?.nombreProyecto || "Proyecto sin nombre",
                                    onRefresh: cargarTodo,
                                  });
                                },
                              },
                            ]
                          );
                        }}
                      />
                      <SvgText
                        x={x + anchoLote / 2}
                        y={y + altoLote / 2}
                        fill={colorFondo === "#ffffff" || colorFondo === "#ffeb3b" ? "#000" : "#fff"}
                        fontSize="3"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        pointerEvents="none"
                      >
                        {nombre}
                      </SvgText>
                    </G>
                  );
                })}
              </G>
            </Svg>
          )}
        </View>

        <View style={[styles.footer, esWeb && styles.footerWeb]}>
          <Text style={styles.subtitle}>Leyenda de Estados:</Text>
          <View style={styles.leyendaContainer}>
            <LeyendaItem color="#ffffff" texto="Libre" />
            <LeyendaItem color="#28a745" texto="Al día" />
            <LeyendaItem color="#ffeb3b" texto="Retrasado" />
            <LeyendaItem color="#dc3545" texto="En Deuda" />
            <LeyendaItem color="#fd7e14" texto="Vendido" />
          </View>
        </View>

        <TouchableOpacity
          style={styles.botonRegistrar}
          onPress={() =>
            navigation.navigate('RegistrarLote', { 
              idProyecto: idProyecto, 
              proyectoNombre: proyectoInfo?.Nombre || proyectoInfo?.nombre || "Proyecto sin nombre",
              manzanasDisponibles: obtenerManzanasDisponibles(),
              onRefresh: cargarTodo 
            })
          }
        >
          <Text style={styles.textoBoton}>Registrar Lote</Text>
        </TouchableOpacity>

        <View style={styles.listaSeccion}>
          <Text style={styles.subtitle}>
            {hayFiltroCliente ? "Información de Lotes Comprados" : "Información de Lotes"} ({lotesBD.length}):
          </Text>

          {lotesBD.length === 0 ? (
            <Text style={styles.infoText}>No hay lotes registrados para este proyecto.</Text>
          ) : lotesBD.map((loteItem, index) => (
            <View key={loteItem.IdLote || index} style={styles.cardLote}>
              <View>
                <Text style={styles.txtCodigoLote}>{loteItem.CodigoLote}</Text>
                <Text style={styles.txtDetalle}>
                  Mza: {loteItem.Manzana} - Lote: {loteItem.NumeroLote}
                </Text>
                <Text style={styles.txtDetalle}>Estado: {loteItem.EstadoLote}</Text>
              </View>

              <View style={styles.precioLote}>
                <Text style={styles.txtMonto}>S/ {loteItem.Precio}</Text>
                <View
                  style={[
                    styles.circuloEstado,
                    { backgroundColor: obtenerColor(loteItem.CodigoLote) },
                  ]}
                />
              </View>

              <TouchableOpacity
                style={styles.botonOpciones}
                onPress={() => {
                  Alert.alert(
                    `Opciones Lote: ${loteItem.CodigoLote}`,
                    `¿Qué deseas realizar?`,
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Registrar Venta",
                        onPress: () => {
                          const idReal = obtenerIdLote(loteItem);
                          if (!idReal) {
                            Alert.alert("Error", "No se encontró el ID de este lote.");
                            return;
                          }
                          navigation.navigate("RegistrarVenta", {
                            idLote: idReal,
                            idUsuario: route.params?.idUsuario,
                            codigoLote: loteItem.CodigoLote,
                            precioVenta: loteItem.Precio,
                            proyectoNombre: proyectoInfo?.NombreProyecto || proyectoInfo?.nombreProyecto || proyectoInfo?.Nombre || "Proyecto sin nombre",
                            onRefresh: cargarTodo,
                          });
                        },
                      },
                      {
                        text: "Modificar",
                        onPress: () => Alert.alert("Modificar", "Módulo en desarrollo."),
                      },
                    ]
                  );
                }}
              >
                <Text style={styles.textoOpciones}>⋮</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// Componente pequeño para la leyenda
const LeyendaItem = ({ color, texto }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      marginRight: 15,
      marginBottom: 5,
    }}
  >
    <View
      style={{
        width: 12,
        height: 12,
        backgroundColor: color,
        borderRadius: 2,
        borderWidth: 0.5,
        borderColor: "#ccc",
        marginRight: 5,
      }}
    />
    <Text style={{ fontSize: 12, color: "#555" }}>{texto}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e4f5f3", padding: 10 },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  scrollContentWeb: {
    paddingBottom: 140,
  },
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: 40,
  },
  headerWeb: {
    paddingTop: 28,
    paddingBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#069488",
    marginBottom: 5,
  },
  label: { fontSize: 14, fontWeight: "bold", color: "#555" },
  value: { fontWeight: "normal", color: "#333" },
  mapContainer: {
    height: 380,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    margin: 15,
    borderRadius: 15,
    elevation: 5,
    overflow: "hidden",
  },
  mapContainerWeb: {
    alignSelf: "center",
    marginVertical: 10,
    marginHorizontal: 0,
  },
  mapEmptyText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    paddingHorizontal: 18,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#069488",
  },
  leyendaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  infoText: { marginHorizontal: 20, color: "#666", fontSize: 13 },
  footer: { paddingBottom: 20 },
  footerWeb: {
    paddingBottom: 10,
  },

  listaSeccion: {
    backgroundColor: "#e4f5f3",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  cardLote: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: "#069488", // Un borde verde para que se vea pro
    elevation: 2, // Sombra en Android
  },
  txtCodigoLote: { fontSize: 18, fontWeight: "bold", color: "#333" },
  txtDetalle: { fontSize: 14, color: "#666" },
  txtMonto: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#069488",
    marginRight: 10,
  },
  precioLote: { flexDirection: "row", alignItems: "center" },
  circuloEstado: { width: 15, height: 15, borderRadius: 8 },
  botonRegistrar: {
    backgroundColor: "#069488",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  textoBoton: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  botonOpciones: {
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  textoOpciones: {
    fontSize: 20,
    color: "#069488",
    fontWeight: "bold",
  },
});

export default DetalleProyecto;
