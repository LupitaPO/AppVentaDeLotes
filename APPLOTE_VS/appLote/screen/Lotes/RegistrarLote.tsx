import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Modal,
} from "react-native";
import { API_URL } from "../../config/apiUrl";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const OPCIONES_MANZANA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const RegistrarLote = ({ route, navigation }: { route: any; navigation: any }) => {
  const { idProyecto, proyectoNombre, onRefresh } = route.params || {};
  const esWeb = Platform.OS === "web";
  const { height: altoPantalla } = useWindowDimensions();
  const altoFormularioWeb = Math.max(420, altoPantalla - 80);
  console.log("console para ver los datos de route:", route.params);
  const [codLote, setCodLote] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [frenteStr, setFrenteStr] = useState("");
  const [fondoStr, setFondoStr] = useState("");
  const [derechaStr, setDerechaStr] = useState("");
  const [izquierdaStr, setIzquierdaStr] = useState("");
  const [perimetro, setPerimetro] = useState("");
  const [tamañosM2, setTamañosM2] = useState("");
  const [numLote, setNumLote] = useState("");
  const [manzana, setManzana] = useState("");
  const [precio, setPrecio] = useState("");
  const [descrip, setDescrip] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [cargando, setCargando] = useState(false);
  const [selectorManzanaAbierto, setSelectorManzanaAbierto] = useState(false);

  const parseDimension = (value: string): number | null => {
    if (!value) return null;
    const cleaned = value.replace(/,/g, ".").replace(/\s/g, "");
    const parts = cleaned
      .split("+")
      .map((part) => parseFloat(part))
      .filter((n) => !Number.isNaN(n));
    if (parts.length === 0) return null;
    return parts.reduce((sum, part) => sum + part, 0);
  };

  useEffect(() => {
    const frente = parseDimension(frenteStr);
    const fondo = parseDimension(fondoStr);
    const derecha = parseDimension(derechaStr);
    const izquierda = parseDimension(izquierdaStr);

    if (frente !== null && fondo !== null) {
      const ancho = (frente + fondo) / 2;
      if (derecha !== null && izquierda !== null) {
        const alto = (derecha + izquierda) / 2;
        setTamañosM2((ancho * alto).toFixed(2).toString());
      } else if (derecha !== null) {
        setTamañosM2((ancho * derecha).toFixed(2).toString());
      } else if (izquierda !== null) {
        setTamañosM2((ancho * izquierda).toFixed(2).toString());
      }
    } else if (derecha !== null && izquierda !== null) {
      const alto = (derecha + izquierda) / 2;
      if (frente !== null) {
        setTamañosM2((frente * alto).toFixed(2).toString());
      } else if (fondo !== null) {
        setTamañosM2((fondo * alto).toFixed(2).toString());
      }
    }
  }, [frenteStr, fondoStr, derechaStr, izquierdaStr]);

  useEffect(() => {
    const frente = parseDimension(frenteStr);
    const fondo = parseDimension(fondoStr);
    const derecha = parseDimension(derechaStr);
    const izquierda = parseDimension(izquierdaStr);

    if (
      frente !== null &&
      fondo !== null &&
      derecha !== null &&
      izquierda !== null
    ) {
      setPerimetro((frente + fondo + derecha + izquierda).toString());
    } else {
      setPerimetro("");
    }
  }, [frenteStr, fondoStr, derechaStr, izquierdaStr]);

  const registrarLote = async () => {
    if (
      !codLote.trim() ||
      !ubicacion.trim() ||
      !frenteStr.trim() ||
      !fondoStr.trim() ||
      !derechaStr.trim() ||
      !izquierdaStr.trim() ||
      !perimetro ||
      !tamañosM2 ||
      !numLote.trim() ||
      !manzana.trim() ||
      !precio.trim()
      
    ) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/Lote/lote_Registrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // 1. Campos directos de la clase Lotes
          IdProyecto: idProyecto,
          CodigoLote: codLote,
          Ubicacion: ubicacion,
          NumeroLote: numLote,
          Manzana: manzana,
          Precio: parseFloat(precio) || 0,
          Descripcion: descrip || "",
          ImagenUrl: imgUrl || "",
          EstadoLote: "Libre",

          // 2. LA SOLUCIÓN: Agrupar los campos de medida
          Medida: {
            Izquierda: izquierdaStr,
            Derecha: derechaStr,
            Frente: frenteStr,
            Fondo: fondoStr,
            Perimetro: parseFloat(perimetro) || 0,
            TamañoM2: parseFloat(tamañosM2) || 0, // Verifica si en C# es TamañoM2 o TamanoM2
            Estado: "A"
          }
        }),
      });

      if (response.ok) {
        Alert.alert("Éxito", "Lote registrado correctamente", [
          {
            text: "OK", onPress: () => {
              onRefresh?.();
              navigation.goBack();
            }
          },
        ]);
      } else {
        const errorMsg = await response.text();
        Alert.alert("Error", errorMsg || "No se pudo registrar el lote");
      }
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={[styles.container, esWeb && { height: altoFormularioWeb, maxHeight: altoFormularioWeb }]}>
    <ScrollView
      style={[
        styles.scrollArea,
        esWeb && ({
          height: altoFormularioWeb,
          maxHeight: altoFormularioWeb,
          overflowY: "auto",
          overflowX: "hidden",
        } as any),
      ]}
      contentContainerStyle={[styles.content, esWeb && styles.contentWeb]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      <Text style={[styles.title, esWeb && styles.titleWeb]}>Registrar Lote</Text>

      {idProyecto ? (
        <View style={[styles.projectInfoBox, esWeb && styles.projectInfoBoxWeb]}>
          <Text style={styles.projectInfoLabel}>Proyecto seleccionado</Text>
          <Text style={styles.projectInfoValue}>{proyectoNombre || idProyecto}</Text>
          {proyectoNombre ? (
            <Text style={styles.projectInfoSubValue}>ID: {idProyecto}</Text>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.label}>Código del Lote</Text>
      <TextInput
        style={styles.input}
        placeholder="Código del lote"
        value={codLote}
        onChangeText={setCodLote}
      />

      <Text style={styles.label}>Manzana de lotes</Text>
      {esWeb ? (
        <View style={styles.selectorWrapper}>
          <View style={styles.selectorInputRow}>
            <TextInput
              style={[styles.input, styles.selectorInput]}
              placeholder="Manzana de lotes"
              value={manzana}
              onChangeText={(value) => {
                setManzana(value);
                if (!value.trim()) setSelectorManzanaAbierto(false);
              }}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Seleccionar manzana de lotes"
              style={styles.selectorButton}
              onPress={() => setSelectorManzanaAbierto((abierto) => !abierto)}
            >
              <MaterialIcons
                name={selectorManzanaAbierto ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={26}
                color="#0f766e"
              />
            </TouchableOpacity>
          </View>

          <Modal
            animationType="fade"
            transparent
            visible={selectorManzanaAbierto}
            onRequestClose={() => setSelectorManzanaAbierto(false)}
          >
            <View style={styles.selectorModalBackdrop}>
              <View style={styles.selectorModalCard}>
                <View style={styles.selectorModalHeader}>
                  <View>
                    <Text style={styles.selectorModalEyebrow}>Manzana de lotes</Text>
                    <Text style={styles.selectorModalTitle}>Selecciona una letra</Text>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar selector de manzana"
                    style={styles.selectorCloseButton}
                    onPress={() => setSelectorManzanaAbierto(false)}
                  >
                    <MaterialIcons name="close" size={22} color="#0f766e" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.selectorOptionsScroll}
                  contentContainerStyle={styles.selectorOptionsContent}
                  showsVerticalScrollIndicator
                >
                  {OPCIONES_MANZANA.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.selectorOption,
                      manzana.trim().toUpperCase() === item.toUpperCase() && styles.selectorOptionActive,
                    ]}
                    onPress={() => {
                      setManzana(item);
                      setSelectorManzanaAbierto(false);
                    }}
                  >
                    <Text style={styles.selectorOptionText}>Manzana de lotes {item}</Text>
                    {manzana.trim().toUpperCase() === item.toUpperCase() ? (
                      <MaterialIcons name="check" size={18} color="#0f766e" />
                    ) : null}
                  </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Manzana de lotes"
          value={manzana}
          onChangeText={setManzana}
        />
      )}

      <Text style={styles.label}>Direccion</Text>
      <TextInput
        style={styles.input}
        placeholder="Direccion"
        value={ubicacion}
        onChangeText={setUbicacion}
      />

      <Text style={styles.sectionLabel}>Medidas del lote</Text>
      <View style={styles.rowWrap}>
        <View style={styles.column50}>
          <Text style={styles.label}>Frente</Text>
          <TextInput
            style={styles.input}
            placeholder="Frente (ej: 10+5)"
            value={frenteStr}
            onChangeText={setFrenteStr}
          />

          <Text style={styles.label}>Fondo</Text>
          <TextInput
            style={styles.input}
            placeholder="Fondo (ej: 15+8)"
            value={fondoStr}
            onChangeText={setFondoStr}
          />
        </View>

        <View style={styles.column50}>
          <Text style={styles.label}>Derecha</Text>
          <TextInput
            style={styles.input}
            placeholder="Derecha (ej: 12+3)"
            value={derechaStr}
            onChangeText={setDerechaStr}
          />

          <Text style={styles.label}>Izquierda</Text>
          <TextInput
            style={styles.input}
            placeholder="Izquierda (ej: 11+4)"
            value={izquierdaStr}
            onChangeText={setIzquierdaStr}
          />
        </View>
      </View>

      <Text style={styles.label}>Perímetro</Text>
      <TextInput
        style={[styles.input, styles.readOnlyInput]}
        placeholder="Se calcula automáticamente"
        value={perimetro}
        editable={false}
      />

      <Text style={styles.label}>Tamaño m²</Text>
      <TextInput
        style={[styles.input, styles.readOnlyInput]}
        placeholder="Se calcula automáticamente"
        value={tamañosM2}
        editable={false}
      />

      <Text style={styles.label}>Número de lote</Text>
      <TextInput
        style={styles.input}
        placeholder="Número de lote"
        value={numLote}
        onChangeText={setNumLote}
      />

      <Text style={styles.label}>Precio</Text>
      <TextInput
        style={styles.input}
        placeholder="Precio"
        value={precio}
        onChangeText={setPrecio}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, styles.inputLarge]}
        placeholder="Descripción"
        value={descrip}
        onChangeText={setDescrip}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.button, cargando && styles.buttonDisabled]}
        onPress={registrarLote}
        disabled={cargando}
      >
        <Text style={styles.buttonText}>
          {cargando ? "Registrando..." : "Registrar Lote"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    padding: 20,
    paddingTop:35,
    paddingBottom: 50,
  },
  contentWeb: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
    paddingTop: 24,
    paddingBottom: 180,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0f172a",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  titleWeb: {
    fontSize: 28,
    marginBottom: 16,
  },
  projectInfoBox: {
    marginBottom: 10,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 15,
    borderWidth: 2,
    borderColor: "#10b981",
    shadowColor: "#10b981",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  projectInfoBoxWeb: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  projectInfoLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  projectInfoValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#065f46",
    marginBottom: 4,
  },
  projectInfoSubValue: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
    fontStyle: "italic",
  },
  sectionLabel: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0f766e",
    marginBottom: 1,
    marginTop: 8,
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    backgroundColor: "#ffffff",
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  selectorWrapper: {
    marginBottom: 16,
    zIndex: 20,
  },
  selectorInputRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },
  selectorInput: {
    flex: 1,
    marginBottom: 0,
  },
  selectorButton: {
    width: 54,
    borderWidth: 2,
    borderColor: "#10b981",
    borderRadius: 14,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10b981",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  selectorModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  selectorModalCard: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "72%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccfbf1",
    overflow: "hidden",
    shadowColor: "#0f766e",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 26,
    elevation: 10,
  },
  selectorModalHeader: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "#ecfdf5",
    borderBottomWidth: 1,
    borderBottomColor: "#d1fae5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  selectorModalEyebrow: {
    color: "#0f766e",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  selectorModalTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  selectorCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#99f6e4",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  selectorOptionsScroll: {
    maxHeight: 320,
  },
  selectorOptionsContent: {
    padding: 12,
    gap: 8,
  },
  selectorOption: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  selectorOptionActive: {
    backgroundColor: "#ecfdf5",
  },
  selectorOptionText: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800",
  },
  selectorEmpty: {
    padding: 14,
    color: "#64748b",
    fontSize: 13,
    fontWeight: "700",
  },
  inputLarge: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  readOnlyInput: {
    backgroundColor: "#ecfdf5",
    color: "#047857",
    borderColor: "#a7f3d0",
  },
  rowWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 5,
  },
  column50: {
    width: "48%",
  },
  button: {
    backgroundColor: "#10b981",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#10b981",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: "#cbd5e1",
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

export default RegistrarLote;
