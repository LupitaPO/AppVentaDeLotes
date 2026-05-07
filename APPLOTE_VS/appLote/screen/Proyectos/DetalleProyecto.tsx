import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import Svg, { Rect, G, Text as SvgText } from "react-native-svg";
import Papa from "papaparse";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const API_URL = "http://10.246.197.207:90";


const DetalleProyecto = ({ route, navigation }) => {
  const { urlCSV, info } = route.params;
  const [proyectoInfo, setProyectoInfo] = useState(info || {});
  const idProyecto = proyectoInfo?.IdProyecto;
  const [lotesGeometria, setLotesGeometria] = useState([]);
  const [lotesBD, setLotesBD] = useState([]); // <--- NUEVO: Para los datos de SQL
  const [miViewBox, setMiViewBox] = useState("0 0 1000 1000");
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarTodo();
    }, [idProyecto, urlCSV]),
  );

  useEffect(() => {
    if (route.params?.info) {
      setProyectoInfo(route.params.info);
    }
  }, [route.params?.info]);

  const cargarTodo = async () => {
    setCargando(true);
    await descargarYProcesarMapa();
    await obtenerLotesDesdeBD();
    setCargando(false);
  };

  // 1. Jalar estados desde SQL Server
  const obtenerLotesDesdeBD = async () => {
    try {
      // --- PRUEBA ESTO ---
      console.log("¿Qué hay en route.params?", route.params);

      const response = await fetch(`${API_URL}/Lote/lote_Listar`);
      const todosLosLotes = await response.json();
      console.log("CARA REAL DE UN LOTE:", todosLosLotes[0]);

      // Usamos el nombre exacto que venga en el console.log de arriba
      const filtrados = todosLosLotes.filter(
        (lote) => lote.IdProyecto?.toString() === idProyecto?.toString(),
      );

      setLotesBD(filtrados);
    } catch (error) {
      console.error(error);
    }
  };

  // 2. Jalar geometría desde el CSV (AutoCAD)
  const descargarYProcesarMapa = async () => {
    try {
      const response = await fetch(`${API_URL}${urlCSV}`);
      const csvTexto = await response.text();

      Papa.parse(csvTexto, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const datos = result.data.filter(
            (l) => l["Posición X"] || l["Posicion X"],
          );
          if (datos.length > 0) {
            const xs = datos.map((l) =>
              parseFloat(l["Posición X"] || l["Posicion X"]),
            );
            const ys = datos.map((l) =>
              parseFloat(l["Posición Y"] || l["Posicion Y"]),
            );
            const minX = Math.min(...xs);
            const minY = Math.min(...ys);
            const maxX = Math.max(...xs);
            const maxY = Math.max(...ys);
            const padding = 20;
            setMiViewBox(
              `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`,
            );
            setLotesGeometria(datos);
          }
        },
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo cargar el plano.");
    }
  };

  // 3. Función para determinar color según estado
  const obtenerColor = (nombreMapa) => {
    // Buscamos el código del mapa en nuestra lista de la BD
    const loteEncontrado = lotesBD.find(
      (l) =>
        l.CodigoLote?.trim().toUpperCase() === nombreMapa?.trim().toUpperCase(),
    );

    if (!loteEncontrado) return "#ffffff"; // Blanco (Si no hay datos en la BD)

    // Usamos el campo EstadoLote que vimos en tu LOG
    switch (loteEncontrado.EstadoLote?.trim()) {
      case "Al Dia":
        return "#28a745"; // Verde
      case "Retrasado":
        return "#ffeb3b"; // Amarillo
      case "En Deuda":
        return "#dc3545"; // Rojo
      case "Vendido":
        return "#fd7e14"; // Naranja
      default:
        return "#ffffff"; // Blanco
    }
  };

  const obtenerIdLote = (lote) => {
    return (
      lote?.IdLote ?? lote?.idLote ?? lote?.Id ?? lote?.id ?? lote?.Id_Lote
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{proyectoInfo.Nombre}</Text>
        <Text style={styles.label}>
          📍 Ubicación: <Text style={styles.value}>{proyectoInfo.Ubicacion}</Text>
        </Text>
        <Text style={styles.label}>
          📏 Hectáreas: <Text style={styles.value}>{proyectoInfo.NumeroHectareas}</Text>
        </Text>
      </View>
      <ScrollView>
        <View style={styles.mapContainer}>
          {cargando ? (
            <ActivityIndicator size="large" color="#069488" />
          ) : (
            <Svg height="350" width={width - 80} viewBox={miViewBox} preserveAspectRatio="xMidYMid">
              <G scaleY={1} originY={0}>
                {lotesGeometria.map((lote, index) => {
                  const kX = Object.keys(lote).find((k) =>
                    k.toLowerCase().includes("x"),
                  );
                  const kY = Object.keys(lote).find((k) =>
                    k.toLowerCase().includes("y"),
                  );
                  const kVal = Object.keys(lote).find(
                    (k) =>
                      k.toLowerCase().includes("valor") ||
                      k.toLowerCase().includes("contenido"),
                  );

                  const x = parseFloat(lote[kX]);
                  const y = parseFloat(lote[kY]);
                  const nombre = lote[kVal] || "";
                  if (isNaN(x) || isNaN(y)) return null;

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
                            (l) =>
                              l.CodigoLote?.trim().toUpperCase() ===
                              nombre?.trim().toUpperCase(),
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
                                onPress: () =>
                                  Alert.alert(
                                    "Modificar",
                                    "Funcionalidad aún no implementada."
                                  ),
                              },
                              {
                                text: "Venta",
                                onPress: () => {
                                  const loteId = obtenerIdLote(dbInfo);
                                  if (!loteId) {
                                    Alert.alert(
                                      "Aviso",
                                      "No se encontró el Id del lote en la base de datos."
                                    );
                                    return;
                                  }
                                  navigation.navigate("RegistrarVenta", {
                                    idLote: loteId,
                                    idUsuario: route.params?.idUsuario,
                                    codigoLote: dbInfo.CodigoLote,
                                    precioVenta: dbInfo.Precio,
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
                        fill={
                          colorFondo === "#ffffff" || colorFondo === "#ffeb3b"
                            ? "#000"
                            : "#fff"
                        }
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

        <View style={styles.footer}>
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
            navigation.navigate('RegistrarLote', { idProyecto: idProyecto, onRefresh: cargarTodo })
          }
        >
          <Text style={styles.textoBoton}>Registrar Lote</Text>
        </TouchableOpacity>

        <View style={styles.listaSeccion}>
          <Text style={styles.subtitle}>
            Información de Lotes ({lotesBD.length}):
          </Text>

                    {lotesBD.map((loteItem, index) => (
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
                  // Ya estamos dentro del map de lotesBD, así que usamos directamente loteItem
                  Alert.alert(
                    `Opciones Lote: ${loteItem.CodigoLote}`,
                    `¿Qué deseas realizar?`,
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Registrar Venta",
                        onPress: () => {
                          // Obtenemos el ID usando tu función de seguridad
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
                            onRefresh: cargarTodo,
                          });
                        },
                      },
                      {
                        text: "Modificar",
                        onPress: () =>
                          Alert.alert("Modificar", "Módulo en desarrollo."),
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
  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: 40,
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
    backgroundColor: "#1a1a1a",
    margin: 15,
    borderRadius: 15,
    elevation: 5,
    overflow: "hidden",
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

  listaSeccion: {
    backgroundColor: "#e4f5f3",
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
